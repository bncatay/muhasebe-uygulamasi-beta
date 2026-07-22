import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import API_BASE_URL from '../api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('hepsi');

  const [formData, setFormData] = useState({
    type: 'gelir',
    amount: '',
    category: 'Satış',
    date: new Date().toISOString().split('T')[0],
    description: '',
    payment_method: 'Banka Transferi',
    customer_id: ''
  });

  const token = localStorage.getItem('token');

  const loadData = () => {
    fetch(`${API_BASE_URL}/api/transactions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTransactions(Array.isArray(data) ? data : []));

    fetch(`${API_BASE_URL}/api/customers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/transactions`, {
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
        setFormData({
          type: 'gelir',
          amount: '',
          category: 'Satış',
          date: new Date().toISOString().split('T')[0],
          description: '',
          payment_method: 'Banka Transferi',
          customer_id: ''
        });
        loadData();
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
      fetch(`${API_BASE_URL}/api/transactions/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(() => loadData());
    }
  };

  const filtered = transactions.filter(t => {
    const matchesType = filterType === 'hepsi' || t.type === filterType;
    const matchesSearch = t.description?.toLowerCase().includes(search.toLowerCase()) || 
                          t.category?.toLowerCase().includes(search.toLowerCase()) ||
                          t.customer_name?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const formatTL = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', flex: 1, maxWidth: '360px' }}>
            <Search size={18} color="var(--text-muted)" style={{ marginRight: '10px' }} />
            <input 
              type="text" 
              placeholder="İşlem, kategori veya müşteri ara..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%', minHeight: '44px' }}
            />
          </div>

          <select 
            className="form-select" 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="hepsi">Tüm İşlemler</option>
            <option value="gelir">Sadece Gelirler</option>
            <option value="gider">Sadece Giderler</option>
          </select>
        </div>

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Yeni Gelir / Gider Ekle
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '8px' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>TÜR</th>
                <th>TARIH</th>
                <th>KATEGORİ</th>
                <th>CARİ (MÜŞTERİ/TEDARİKÇİ)</th>
                <th>AÇIKLAMA</th>
                <th>ÖDEME YÖNTEMİ</th>
                <th>TUTAR</th>
                <th>İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                    Kayıtlı işlem bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <span className={t.type === 'gelir' ? 'badge badge-income' : 'badge badge-expense'}>
                        {t.type === 'gelir' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {t.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.date}</td>
                    <td style={{ fontWeight: 600 }}>{t.category}</td>
                    <td>{t.customer_name || '-'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.description || '-'}</td>
                    <td>{t.payment_method}</td>
                    <td className="amount-number" style={{ fontWeight: 700, color: t.type === 'gelir' ? 'var(--color-income)' : 'var(--color-expense)' }}>
                      {t.type === 'gelir' ? '+' : '-'}{formatTL(t.amount)}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleDelete(t.id)} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-expense)', cursor: 'pointer', padding: '6px' }}
                        title="İşlemi Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>Yeni İşlem Ekle</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>İşlem Türü</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button 
                    type="button"
                    className={`btn-secondary ${formData.type === 'gelir' ? 'active' : ''}`}
                    style={{ background: formData.type === 'gelir' ? 'var(--color-income)' : '', color: '#fff' }}
                    onClick={() => setFormData({ ...formData, type: 'gelir', category: 'Satış' })}
                  >
                    Gelir (Giriş)
                  </button>
                  <button 
                    type="button"
                    className={`btn-secondary ${formData.type === 'gider' ? 'active' : ''}`}
                    style={{ background: formData.type === 'gider' ? 'var(--color-expense)' : '', color: '#fff' }}
                    onClick={() => setFormData({ ...formData, type: 'gider', category: 'Kira' })}
                  >
                    Gider (Çıkış)
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Tutar (₺) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    className="form-input" 
                    placeholder="0.00"
                    value={formData.amount} 
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Tarih *</label>
                  <input 
                    type="date" 
                    required
                    className="form-input" 
                    value={formData.date} 
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Kategori</label>
                  <input 
                    type="text"
                    className="form-input" 
                    placeholder="Örn: Satış, Kira, Fatura, Maaş"
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Ödeme Yöntemi</label>
                  <select 
                    className="form-select"
                    value={formData.payment_method} 
                    onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                  >
                    <option value="Banka Transferi">Banka Transferi / EFT</option>
                    <option value="Nakit">Nakit</option>
                    <option value="Kredi Kartı">Kredi Kartı</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>İlişkili Cari (Müşteri / Tedarikçi)</label>
                <select 
                  className="form-select"
                  value={formData.customer_id} 
                  onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                >
                  <option value="">-- Seçim Yok (Genel İşlem) --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type === 'musteri' ? 'Müşteri' : 'Tedarikçi'})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Açıklama</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Not veya fatura no ekleyin"
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
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
