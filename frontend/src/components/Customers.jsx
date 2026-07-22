import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Search, Users, Phone, Mail, FileText } from 'lucide-react';
import API_BASE_URL from '../api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'musteri',
    phone: '',
    email: '',
    tax_number: '',
    address: '',
    balance: 0
  });

  const token = localStorage.getItem('token');

  const loadCustomers = () => {
    fetch(`${API_BASE_URL}/api/customers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/customers`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(() => {
        setShowModal(false);
        setFormData({ name: '', type: 'musteri', phone: '', email: '', tax_number: '', address: '', balance: 0 });
        loadCustomers();
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('Bu cari hesabı silmek istediğinize emin misiniz?')) {
      fetch(`${API_BASE_URL}/api/customers/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(() => loadCustomers());
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.tax_number?.includes(search)
  );

  const formatTL = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', flex: 1, maxWidth: '360px' }}>
          <Search size={18} color="var(--text-muted)" style={{ marginRight: '10px' }} />
          <input 
            type="text" 
            placeholder="Firma veya kişi adı ara..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%', minHeight: '44px' }}
          />
        </div>

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Yeni Cari Hesap Ekle
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filtered.map(c => (
          <div key={c.id} className="glass-panel bento-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="badge" style={{ background: c.type === 'musteri' ? 'var(--color-brand-glow)' : 'rgba(245, 158, 11, 0.15)', color: c.type === 'musteri' ? 'var(--color-brand)' : 'var(--color-warning)', marginBottom: '8px' }}>
                  {c.type === 'musteri' ? 'MÜŞTERİ' : 'TEDARİKÇİ'}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{c.name}</h3>
              </div>
              <button onClick={() => handleDelete(c.id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-expense)', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={14} /> {c.phone}</div>}
              {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={14} /> {c.email}</div>}
              {c.tax_number && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={14} /> Vergi No: {c.tax_number}</div>}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bakiye Durumu</span>
              <span className="amount-number" style={{ fontSize: '1.1rem', fontWeight: 700, color: c.balance > 0 ? 'var(--color-income)' : c.balance < 0 ? 'var(--color-expense)' : '#fff' }}>
                {c.balance > 0 ? `+${formatTL(c.balance)} (Alacaklı)` : c.balance < 0 ? `${formatTL(c.balance)} (Borçlu)` : '0.00 ₺'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>Yeni Cari Hesap Oluştur</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Firma / Şahıs Adı *</label>
                <input 
                  type="text" 
                  required
                  className="form-input" 
                  placeholder="Örn: Yılmaz Ticaret Ltd. Şti."
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Hesap Türü</label>
                  <select className="form-select" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="musteri">Müşteri</option>
                    <option value="tedarikci">Tedarikçi</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Telefon</label>
                  <input type="text" className="form-input" placeholder="05XX XXX XX XX" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>E-Posta</label>
                  <input type="email" className="form-input" placeholder="ornek@firma.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Vergi / T.C. No</label>
                  <input type="text" className="form-input" placeholder="10 Haneli Vergi No" value={formData.tax_number} onChange={e => setFormData({ ...formData, tax_number: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Adres</label>
                <input type="text" className="form-input" placeholder="İl, İlçe ve açık adres" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
