const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'hesapkolay_super_gizli_anahtar_2026';

app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// AUTHENTICATION MIDDLEWARE (JWT KONTROLÜ)
// -------------------------------------------------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Giriş yapmanız gerekmektedir.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Oturum süreniz dolmuş, lütfen tekrar giriş yapın.' });
    req.user = user;
    next();
  });
};

// -------------------------------------------------------------
// 1. KULLANICI GİRİŞİ (LOGIN)
// -------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunludur.' });
  }

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Hatalı kullanıcı adı veya şifre.' });
    if (user.is_active === 0) return res.status(403).json({ error: 'Hesabınız dondurulmuştur. Lütfen admin ile iletişime geçin.' });

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Hatalı kullanıcı adı veya şifre.' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, company_name: user.company_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        company_name: user.company_name
      }
    });
  });
});

// -------------------------------------------------------------
// 2. ADMİN YÖNETİMİ - KULLANICI LİSTELEME VE HESAP AÇMA
// -------------------------------------------------------------
app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bu alana erişim yetkiniz bulunmamaktadır.' });
  }

  db.all(`SELECT id, username, company_name, role, is_active, created_at FROM users ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Yalnızca yöneticiler yeni kullanıcı oluşturabilir.' });
  }

  const { username, password, company_name, role } = req.body;
  if (!username || !password || !company_name) {
    return res.status(400).json({ error: 'Kullanıcı adı, şifre ve firma adı zorunludur.' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const sql = `INSERT INTO users (username, password_hash, company_name, role) VALUES (?, ?, ?, ?)`;

  db.run(sql, [username, password_hash, company_name, role || 'user'], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılmaktadır.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, message: 'Kullanıcı hesabı başarıyla oluşturuldu.' });
  });
});

app.delete('/api/admin/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Yetkisiz işlem.' });
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz.' });

  db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Kullanıcı hesabı silindi.' });
  });
});

// -------------------------------------------------------------
// 3. İZOLE DASHBOARD İSTATİSTİKLERİ
// -------------------------------------------------------------
app.get('/api/dashboard', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const queries = {
    totalIncome: "SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'gelir'",
    totalExpense: "SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'gider'",
    customerCount: "SELECT COUNT(*) as count FROM customers WHERE user_id = ? AND type = 'musteri'",
    lowStockCount: "SELECT COUNT(*) as count FROM products WHERE user_id = ? AND stock_quantity <= min_stock",
    recentTransactions: "SELECT t.*, c.name as customer_name FROM transactions t LEFT JOIN customers c ON t.customer_id = c.id WHERE t.user_id = ? ORDER BY t.date DESC LIMIT 5",
    monthlyGraph: `
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'gelir' THEN amount ELSE 0 END) as gelir,
        SUM(CASE WHEN type = 'gider' THEN amount ELSE 0 END) as gider
      FROM transactions 
      WHERE user_id = ?
      GROUP BY month 
      ORDER BY month ASC 
      LIMIT 12
    `
  };

  db.get(queries.totalIncome, [userId], (err, incomeRow) => {
    if (err) return res.status(500).json({ error: err.message });
    db.get(queries.totalExpense, [userId], (err, expenseRow) => {
      if (err) return res.status(500).json({ error: err.message });
      db.get(queries.customerCount, [userId], (err, customerRow) => {
        if (err) return res.status(500).json({ error: err.message });
        db.get(queries.lowStockCount, [userId], (err, stockRow) => {
          if (err) return res.status(500).json({ error: err.message });
          db.all(queries.recentTransactions, [userId], (err, recentRows) => {
            if (err) return res.status(500).json({ error: err.message });
            db.all(queries.monthlyGraph, [userId], (err, graphRows) => {
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

// -------------------------------------------------------------
// 4. İZOLE GELİR & GİDER İŞLEMLERİ
// -------------------------------------------------------------
app.get('/api/transactions', authenticateToken, (req, res) => {
  db.all(`SELECT t.*, c.name as customer_name FROM transactions t LEFT JOIN customers c ON t.customer_id = c.id WHERE t.user_id = ? ORDER BY t.date DESC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/transactions', authenticateToken, (req, res) => {
  const { type, amount, category, date, description, payment_method, customer_id } = req.body;
  if (!type || !amount || !category || !date) return res.status(400).json({ error: 'Eksik bilgi' });

  const sql = `INSERT INTO transactions (user_id, type, amount, category, date, description, payment_method, customer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [req.user.id, type, amount, category, date, description, payment_method || 'Nakit', customer_id || null], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (customer_id) {
      const balanceChange = type === 'gelir' ? amount : -amount;
      db.run(`UPDATE customers SET balance = balance + ? WHERE id = ? AND user_id = ?`, [balanceChange, customer_id, req.user.id]);
    }
    res.json({ id: this.lastID, message: 'İşlem eklendi' });
  });
});

app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM transactions WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'İşlem silindi' });
  });
});

// -------------------------------------------------------------
// 5. İZOLE CARİ HESAPLAR
// -------------------------------------------------------------
app.get('/api/customers', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM customers WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/customers', authenticateToken, (req, res) => {
  const { name, type, phone, email, tax_number, address, balance } = req.body;
  db.run(`INSERT INTO customers (user_id, name, type, phone, email, tax_number, address, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, name, type || 'musteri', phone, email, tax_number, address, balance || 0], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

app.delete('/api/customers/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM customers WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cari hesap silindi' });
  });
});

// -------------------------------------------------------------
// 6. İZOLE STOK & ÜRÜN YÖNETİMİ
// -------------------------------------------------------------
app.get('/api/products', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM products WHERE user_id = ? ORDER BY name ASC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/products', authenticateToken, (req, res) => {
  const { name, code, category, purchase_price, sale_price, stock_quantity, min_stock, unit } = req.body;
  db.run(`INSERT INTO products (user_id, name, code, category, purchase_price, sale_price, stock_quantity, min_stock, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, name, code, category, purchase_price || 0, sale_price || 0, stock_quantity || 0, min_stock || 5, unit || 'Adet'], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

app.put('/api/products/:id/stock', authenticateToken, (req, res) => {
  db.run(`UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? AND user_id = ?`, [req.body.quantityChange, req.params.id, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Stok güncellendi' });
  });
});

app.delete('/api/products/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM products WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Ürün silindi' });
  });
});

// -------------------------------------------------------------
// 7. İZOLE FATURALAR
// -------------------------------------------------------------
app.get('/api/invoices', authenticateToken, (req, res) => {
  db.all(`SELECT i.*, c.name as customer_name, c.tax_number, c.address FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE i.user_id = ? ORDER BY i.issue_date DESC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items_json || '[]') })));
  });
});

app.post('/api/invoices', authenticateToken, (req, res) => {
  const { invoice_number, type, customer_id, issue_date, due_date, total_amount, tax_amount, status, items } = req.body;
  db.run(`INSERT INTO invoices (user_id, invoice_number, type, customer_id, issue_date, due_date, total_amount, tax_amount, status, items_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, invoice_number, type || 'satis', customer_id, issue_date, due_date, total_amount, tax_amount || 0, status || 'ödenmedi', JSON.stringify(items || [])], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

app.listen(PORT, () => console.log(`HesapKolay Backend Server running on port ${PORT}`));
