const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/dashboard', (req, res) => {
  const queries = {
    totalIncome: "SELECT SUM(amount) as total FROM transactions WHERE type = 'gelir'",
    totalExpense: "SELECT SUM(amount) as total FROM transactions WHERE type = 'gider'",
    customerCount: "SELECT COUNT(*) as count FROM customers WHERE type = 'musteri'",
    lowStockCount: "SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock",
    recentTransactions: "SELECT t.*, c.name as customer_name FROM transactions t LEFT JOIN customers c ON t.customer_id = c.id ORDER BY t.date DESC LIMIT 5",
    monthlyGraph: `
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'gelir' THEN amount ELSE 0 END) as gelir,
        SUM(CASE WHEN type = 'gider' THEN amount ELSE 0 END) as gider
      FROM transactions 
      GROUP BY month 
      ORDER BY month ASC 
      LIMIT 12
    `
  };

  db.get(queries.totalIncome, [], (err, incomeRow) => {
    if (err) return res.status(500).json({ error: err.message });
    db.get(queries.totalExpense, [], (err, expenseRow) => {
      if (err) return res.status(500).json({ error: err.message });
      db.get(queries.customerCount, [], (err, customerRow) => {
        if (err) return res.status(500).json({ error: err.message });
        db.get(queries.lowStockCount, [], (err, stockRow) => {
          if (err) return res.status(500).json({ error: err.message });
          db.all(queries.recentTransactions, [], (err, recentRows) => {
            if (err) return res.status(500).json({ error: err.message });
            db.all(queries.monthlyGraph, [], (err, graphRows) => {
              if (err) return res.status(500).json({ error: err.message });

              const totalGelir = incomeRow?.total || 0;
              const totalGider = expenseRow?.total || 0;

              res.json({
                totalIncome: totalGelir,
                totalExpense: totalGider,
                netBalance: totalGelir - totalGider,
                customerCount: customerRow?.count || 0,
                lowStockCount: stockRow?.count || 0,
                recentTransactions: recentRows,
                monthlyGraph: graphRows
              });
            });
          });
        });
      });
    });
  });
});

app.get('/api/transactions', (req, res) => {
  db.all(`SELECT t.*, c.name as customer_name FROM transactions t LEFT JOIN customers c ON t.customer_id = c.id ORDER BY t.date DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/transactions', (req, res) => {
  const { type, amount, category, date, description, payment_method, customer_id } = req.body;
  if (!type || !amount || !category || !date) return res.status(400).json({ error: 'Eksik bilgi' });

  const sql = `INSERT INTO transactions (type, amount, category, date, description, payment_method, customer_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [type, amount, category, date, description, payment_method || 'Nakit', customer_id || null], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (customer_id) {
      const balanceChange = type === 'gelir' ? amount : -amount;
      db.run(`UPDATE customers SET balance = balance + ? WHERE id = ?`, [balanceChange, customer_id]);
    }
    res.json({ id: this.lastID, message: 'Eklendi' });
  });
});

app.delete('/api/transactions/:id', (req, res) => {
  db.run(`DELETE FROM transactions WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Silindi' });
  });
});

app.get('/api/customers', (req, res) => {
  db.all(`SELECT * FROM customers ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/customers', (req, res) => {
  const { name, type, phone, email, tax_number, address, balance } = req.body;
  db.run(`INSERT INTO customers (name, type, phone, email, tax_number, address, balance) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, type || 'musteri', phone, email, tax_number, address, balance || 0], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

app.delete('/api/customers/:id', (req, res) => {
  db.run(`DELETE FROM customers WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Silindi' });
  });
});

app.get('/api/products', (req, res) => {
  db.all(`SELECT * FROM products ORDER BY name ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/products', (req, res) => {
  const { name, code, category, purchase_price, sale_price, stock_quantity, min_stock, unit } = req.body;
  db.run(`INSERT INTO products (name, code, category, purchase_price, sale_price, stock_quantity, min_stock, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, code, category, purchase_price || 0, sale_price || 0, stock_quantity || 0, min_stock || 5, unit || 'Adet'], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

app.put('/api/products/:id/stock', (req, res) => {
  db.run(`UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`, [req.body.quantityChange, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Stok güncellendi' });
  });
});

app.delete('/api/products/:id', (req, res) => {
  db.run(`DELETE FROM products WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Silindi' });
  });
});

app.get('/api/invoices', (req, res) => {
  db.all(`SELECT i.*, c.name as customer_name, c.tax_number, c.address FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id ORDER BY i.issue_date DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items_json || '[]') })));
  });
});

app.post('/api/invoices', (req, res) => {
  const { invoice_number, type, customer_id, issue_date, due_date, total_amount, tax_amount, status, items } = req.body;
  db.run(`INSERT INTO invoices (invoice_number, type, customer_id, issue_date, due_date, total_amount, tax_amount, status, items_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [invoice_number, type || 'satis', customer_id, issue_date, due_date, total_amount, tax_amount || 0, status || 'ödenmedi', JSON.stringify(items || [])], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
