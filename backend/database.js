const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('SQLite Veritabanı bağlantı hatası:', err.message);
  } else {
    console.log('SQLite Veritabanına başarıyla bağlandı:', dbPath);
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('musteri', 'tedarikci')) NOT NULL DEFAULT 'musteri',
    phone TEXT,
    email TEXT,
    tax_number TEXT,
    address TEXT,
    balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    category TEXT,
    purchase_price REAL DEFAULT 0,
    sale_price REAL DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    unit TEXT DEFAULT 'Adet',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('gelir', 'gider')) NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    payment_method TEXT DEFAULT 'Nakit',
    customer_id INTEGER,
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    type TEXT CHECK(type IN ('satis', 'alis')) NOT NULL,
    customer_id INTEGER NOT NULL,
    issue_date TEXT NOT NULL,
    due_date TEXT,
    total_amount REAL NOT NULL,
    tax_amount REAL DEFAULT 0,
    status TEXT CHECK(status IN ('ödenmedi', 'ödendi', 'kısmi')) DEFAULT 'ödenmedi',
    items_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  )`);

  db.get("SELECT COUNT(*) AS count FROM customers", (err, row) => {
    if (row && row.count === 0) {
      db.run(`INSERT INTO customers (name, type, phone, email, tax_number, address, balance) VALUES
        ('Ahmet Yılmaz (Yılmaz Ticaret)', 'musteri', '0532 111 2233', 'ahmet@yilmazticaret.com', '1234567890', 'Kadıköy, İstanbul', 14500),
        ('Mehmet Demir (Demir İnşaat)', 'musteri', '0533 222 3344', 'info@demirinsaat.com', '9876543210', 'Çankaya, Ankara', -3200),
        ('TeknoTedarik A.Ş.', 'tedarikci', '0212 444 5566', 'siparis@teknotedarik.com', '5554443322', 'Levent, İstanbul', -12500)
      `);

      db.run(`INSERT INTO products (name, code, category, purchase_price, sale_price, stock_quantity, min_stock, unit) VALUES
        ('Kablosuz Ergonomik Klavye', 'KBY-01', 'Elektronik', 450, 850, 24, 5, 'Adet'),
        ('27" IPS Monitor 165Hz', 'MON-27', 'Elektronik', 3200, 4800, 8, 3, 'Adet'),
        ('Ofis Koltuğu Ergonomik', 'OFS-KLT', 'Mobilya', 1500, 2900, 2, 5, 'Adet'),
        ('A4 Fotokopi Kağıdı (500lü)', 'KGT-A4', 'Kırtasiye', 90, 140, 45, 10, 'Koli')
      `);

      const today = new Date().toISOString().split('T')[0];
      const lastMonth = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

      db.run(`INSERT INTO transactions (type, amount, category, date, description, payment_method, customer_id) VALUES
        ('gelir', 14500, 'Satış', '${today}', 'Yılmaz Ticaret Fatura Tahsilatı', 'Banka Transferi', 1),
        ('gider', 3200, 'Kira', '${today}', 'Ofis Kira Ödemesi Temmuz', 'Banka Transferi', NULL),
        ('gider', 1450, 'Fatura', '${today}', 'Elektrik & İnternet Faturası', 'Kredi Kartı', NULL),
        ('gelir', 8500, 'Satış', '${lastMonth}', 'Ofis Koltuğu ve Malzeme Satışı', 'Nakit', 2),
        ('gider', 4500, 'Stok Alımı', '${lastMonth}', 'TeknoTedarik Klavye ve Ekipman Alımı', 'Banka Transferi', 3)
      `);

      db.run(`INSERT INTO invoices (invoice_number, type, customer_id, issue_date, due_date, total_amount, tax_amount, status, items_json) VALUES
        ('FAT-2026-001', 'satis', 1, '${today}', '${today}', 14500, 2610, 'ödendi', '[{"description":"Kablosuz Klavye x 10","quantity":10,"unit_price":850,"total":8500},{"description":"27 Monitor x 1","quantity":1,"unit_price":6000,"total":6000}]'),
        ('FAT-2026-002', 'satis', 2, '${today}', '${today}', 3200, 576, 'ödenmedi', '[{"description":"Ofis Koltuğu Ergonomik x 1","quantity":1,"unit_price":3200,"total":3200}]')
      `);
    }
  });
});

module.exports = db;
