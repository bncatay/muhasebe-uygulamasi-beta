import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, Users, AlertTriangle, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import API_BASE_URL from '../api';

export default function Dashboard({ onNewTransaction }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard yüklenirken hata:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', color: '#94a3b8' }}>Finansal göstergeler yükleniyor...</div>;
  }

  const formatTL = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);

  return (
    <div>
      <div className="bento-grid">
        <div className="glass-panel bento-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>KASA & BANKA (NET)</span>
            <div style={{ background: 'var(--color-brand-glow)', padding: '8px', borderRadius: '10px', color: 'var(--color-brand)' }}>
              <Wallet size={20} />
            </div>
          </div>
          <div className="amount-number" style={{ fontSize: '1.8rem', color: data?.netBalance >= 0 ? '#fff' : 'var(--color-expense)' }}>
            {formatTL(data?.netBalance)}
          </div>
          <span style={{ color: 'var(--color-income)', fontSize: '0.8rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={14} /> Kar/Zarar Durumu
          </span>
        </div>

        <div className="glass-panel bento-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>TOPLAM GELİR</span>
            <div style={{ background: 'var(--color-income-glow)', padding: '8px', borderRadius: '10px', color: 'var(--color-income)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="amount-number" style={{ fontSize: '1.8rem', color: 'var(--color-income)' }}>
            {formatTL(data?.totalIncome)}
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
            Tahsil edilen gelirler
          </span>
        </div>

        <div className="glass-panel bento-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>TOPLAM GİDER</span>
            <div style={{ background: 'var(--color-expense-glow)', padding: '8px', borderRadius: '10px', color: 'var(--color-expense)' }}>
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="amount-number" style={{ fontSize: '1.8rem', color: 'var(--color-expense)' }}>
            {formatTL(data?.totalExpense)}
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
            Yapılan harcamalar
          </span>
        </div>

        <div className="glass-panel bento-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>DURUM ÖZETİ</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '8px', borderRadius: '10px', color: 'var(--color-warning)' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Müşteriler:</span>
              <strong style={{ color: '#fff' }}>{data?.customerCount} Kişi/Firma</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Kritik Stok:</span>
              <strong style={{ color: data?.lowStockCount > 0 ? 'var(--color-warning)' : 'var(--color-income)' }}>
                {data?.lowStockCount} Ürün
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', fontWeight: 700 }}>Nakit Akışı (Aylık Gelir vs Gider)</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthlyGraph || []}>
                <defs>
                  <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGider" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff' }} />
                <Area type="monotone" dataKey="gelir" stroke="#10b981" fillOpacity={1} fill="url(#colorGelir)" name="Gelir (₺)" />
                <Area type="monotone" dataKey="gider" stroke="#f43f5e" fillOpacity={1} fill="url(#colorGider)" name="Gider (₺)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Son İşlemler</h3>
            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', minHeight: '34px' }} onClick={onNewTransaction}>
              <Plus size={14} /> Ekle
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.recentTransactions?.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.description || item.category}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.date} • {item.customer_name || 'Genel'}</div>
                </div>
                <div className="amount-number" style={{ fontWeight: 700, color: item.type === 'gelir' ? 'var(--color-income)' : 'var(--color-expense)' }}>
                  {item.type === 'gelir' ? '+' : '-'}{formatTL(item.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
