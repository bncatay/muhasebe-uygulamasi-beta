const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Eski tabloları temizle (Sıfırdan temiz kurulum için)
  db.run(`DROP TABLE IF EXISTS users`);
  db.run(`DROP TABLE IF EXISTS customers`);
  db.run(`DROP TABLE IF EXISTS products`);
  db.run(`DROP TABLE IF EXISTS transactions`);
  db.run(`DROP TABLE IF EXISTS invoices`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    company_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('musteri', 'tedarikci')) DEFAULT 'musteri',
    phone TEXT,
    email TEXT,
    tax_number TEXT,
    address TEXT,
    balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    code TEXT,
    category TEXT,
    purchase_price REAL DEFAULT 0,
    sale_price REAL DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    unit TEXT DEFAULT 'Adet',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('gelir', 'gider')) NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    payment_method TEXT DEFAULT 'Nakit',
    customer_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    invoice_number TEXT NOT NULL,
    type TEXT CHECK(type IN ('satis', 'alis')) NOT NULL,
    customer_id INTEGER NOT NULL,
    issue_date TEXT NOT NULL,
    due_date TEXT,
    total_amount REAL NOT NULL,
    tax_amount REAL DEFAULT 0,
    status TEXT CHECK(status IN ('ödenmedi', 'ödendi', 'kısmi')) DEFAULT 'ödenmedi',
    items_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  )`);

  // Güvenli ve benzersiz admin şifresi
  db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
    if (row && row.count === 0) {
      console.log('Varsayılan özel hesaplar oluşturuluyor...');

      const secureAdminPasswordHash = bcrypt.hashSync('Hk9274!Mhk#99', 10);
      const secureDemoPasswordHash = bcrypt.hashSync('Dm8361!Frm#88', 10);

      // Güvenli Admin Hesabı
      db.run(`INSERT INTO users (username, password_hash, company_name, role) VALUES (?, ?, ?, ?)`,
        ['admin', secureAdminPasswordHash, 'Sistem Yönetimi (Admin)', 'admin']
      );

      // Güvenli Demo Hesabı
      db.run(`INSERT INTO users (username, password_hash, company_name, role) VALUES (?, ?, ?, ?)`,
        ['demofirma', secureDemoPasswordHash, 'Örnek Dükkan Ltd.', 'user'],
        function() {
          const userId = this.lastID;
          const today = new Date().toISOString().split('T')[0];

          db.run(`INSERT INTO customers (user_id, name, type, phone, email, tax_number, address, balance) VALUES
            (${userId}, 'Ahmet Yılmaz (Yılmaz Ticaret)', 'musteri', '0532 111 2233', 'ahmet@yilmazticaret.com', '1234567890', 'Kadıköy, İstanbul', 14500),
            (${userId}, 'Mehmet Demir (Demir İnşaat)', 'musteri', '0533 222 3344', 'info@demirinsaat.com', '9876543210', 'Çankaya, Ankara', -3200)
          `);

          db.run(`INSERT INTO products (user_id, name, code, category, purchase_price, sale_price, stock_quantity, min_stock, unit) VALUES
            (${userId}, 'Kablosuz Ergonomik Klavye', 'KBY-01', 'Elektronik', 450, 850, 24, 5, 'Adet'),
            (${userId}, '27 IPS Monitor 165Hz', 'MON-27', 'Elektronik', 3200, 4800, 8, 3, 'Adet')
          `);

          db.run(`INSERT INTO transactions (user_id, type, amount, category, date, description, payment_method, customer_id) VALUES
            (${userId}, 'gelir', 14500, 'Satış', '${today}', 'Yılmaz Ticaret Fatura Tahsilatı', 'Banka Transferi', 1),
            (${userId}, 'gider', 3200, 'Kira', '${today}', 'Ofis Kira Ödemesi', 'Banka Transferi', NULL)
          `);
        }
      );
    }
  });
});

module.exports = db;
