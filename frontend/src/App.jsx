import React, { useState } from 'react';
import { LayoutDashboard, ArrowUpRight, Users, Package, FileText, Building2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Customers from './components/Customers';
import Products from './components/Products';
import Invoices from './components/Invoices';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand-logo">
          <div className="brand-icon"><Building2 size={22} /></div>
          <div>
            <div style={{ lineHeight: 1.1 }}>HesapKolay</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>Ön Muhasebe v1.0</div>
          </div>
        </div>

        <ul className="nav-list">
          <li className="nav-item">
            <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard size={20} /> Dashboard
            </button>
          </li>
          <li className="nav-item">
            <button className={activeTab === 'transactions' ? 'active' : ''} onClick={() => setActiveTab('transactions')}>
              <ArrowUpRight size={20} /> Gelir & Gider
            </button>
          </li>
          <li className="nav-item">
            <button className={activeTab === 'customers' ? 'active' : ''} onClick={() => setActiveTab('customers')}>
              <Users size={20} /> Cari Hesaplar
            </button>
          </li>
          <li className="nav-item">
            <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
              <Package size={20} /> Stok & Ürünler
            </button>
          </li>
          <li className="nav-item">
            <button className={activeTab === 'invoices' ? 'active' : ''} onClick={() => setActiveTab('invoices')}>
              <FileText size={20} /> Faturalar
            </button>
          </li>
        </ul>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="page-title">
            <h1>
              {activeTab === 'dashboard' && 'Finansal Gösterge Paneli'}
              {activeTab === 'transactions' && 'Gelir & Gider Yönetimi'}
              {activeTab === 'customers' && 'Cari Hesaplar (Müşteri & Tedarikçi)'}
              {activeTab === 'products' && 'Stok ve Ürün Yönetimi'}
              {activeTab === 'invoices' && 'Fatura Kesme ve Yönetim'}
            </h1>
            <p>Küçük İşletme Ön Muhasebe & Takip Sistemi</p>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard onNewTransaction={() => setActiveTab('transactions')} />}
        {activeTab === 'transactions' && <Transactions />}
        {activeTab === 'customers' && <Customers />}
        {activeTab === 'products' && <Products />}
        {activeTab === 'invoices' && <Invoices />}
      </main>
    </div>
  );
}
