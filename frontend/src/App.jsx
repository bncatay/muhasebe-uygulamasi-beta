import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ArrowUpRight, Users, Package, FileText, Building2, ShieldCheck, LogOut } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Customers from './components/Customers';
import Products from './components/Products';
import Invoices from './components/Invoices';
import AdminUsers from './components/AdminUsers';
import Login from './components/Login';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigasyonu */}
      <aside className="sidebar">
        <div className="brand-logo">
          <div className="brand-icon">
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ lineHeight: 1.1 }}>HesapKolay</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {currentUser.company_name}
            </div>
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

          {/* Sadece Admin Hesabında Görünen Menü */}
          {currentUser.role === 'admin' && (
            <li className="nav-item" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <button className={activeTab === 'admin' ? 'active' : ''} style={{ color: 'var(--color-brand)' }} onClick={() => setActiveTab('admin')}>
                <ShieldCheck size={20} /> Kullanıcı Yönetimi
              </button>
            </li>
          )}
        </ul>

        {/* Alt Kullanıcı Bilgisi ve Çıkış */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Giriş Yapan: <span style={{ color: '#fff' }}>@{currentUser.username}</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="btn-secondary" 
            style={{ width: '100%', minHeight: '38px', padding: '8px', fontSize: '0.85rem', color: 'var(--color-expense)', borderColor: 'rgba(244, 63, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <LogOut size={16} /> Güvenli Çıkış
          </button>
        </div>
      </aside>

      {/* Main Sayfa Alanı */}
      <main className="main-content">
        <header className="top-bar">
          <div className="page-title">
            <h1>
              {activeTab === 'dashboard' && 'Finansal Gösterge Paneli'}
              {activeTab === 'transactions' && 'Gelir & Gider Yönetimi'}
              {activeTab === 'customers' && 'Cari Hesaplar (Müşteri & Tedarikçi)'}
              {activeTab === 'products' && 'Stok ve Ürün Yönetimi'}
              {activeTab === 'invoices' && 'Fatura Kesme ve Yönetim'}
              {activeTab === 'admin' && 'Sistem Yönetim Paneli (Admin)'}
            </h1>
            <p>{currentUser.company_name} • Muhasebe Portalı</p>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard onNewTransaction={() => setActiveTab('transactions')} />}
        {activeTab === 'transactions' && <Transactions />}
        {activeTab === 'customers' && <Customers />}
        {activeTab === 'products' && <Products />}
        {activeTab === 'invoices' && <Invoices />}
        {activeTab === 'admin' && <AdminUsers />}
      </main>
    </div>
  );
}
