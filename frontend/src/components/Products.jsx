import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Search, Package, AlertTriangle } from 'lucide-react';
import API_BASE_URL from '../api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Elektronik',
    purchase_price: '',
    sale_price: '',
    stock_quantity: '',
    min_stock: '5',
    unit: 'Adet'
  });

  const token = localStorage.getItem('token');

  const loadProducts = () => {
    fetch(`${API_BASE_URL}/api/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/products`, {
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
        setFormData({ name: '', code: '', category: 'Elektronik', purchase_price: '', sale_price: '', stock_quantity: '', min_stock: '5', unit: 'Adet' });
        loadProducts();
      });
  };

  const handleStockUpdate = (id, quantityChange) => {
    fetch(`${API_BASE_URL}/api/products/${id}/stock`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ quantityChange })
    }).then(() => loadProducts());
  };

  const handleDelete = (id) => {
    if (window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
      fetch(`${API_BASE_URL}/api/products/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(() => loadProducts());
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTL = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', flex: 1, maxWidth: '360px' }}>
          <Search size={18} color="var(--text-muted)" style={{ marginRight: '10px' }} />
          <input 
            type="text" 
            placeholder="Ürün adı veya kodu ara..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%', minHeight: '44px' }}
          />
        </div>

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Yeni Ürün / Stok Ekle
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '8px' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>KOD</th>
                <th>ÜRÜN ADI</th>
                <th>KATEGORİ</th>
                <th>ALIŞ FİYATI</th>
                <th>SATIŞ FİYATI</th>
                <th>STOK DURUMU</th>
                <th>HIZLI STOK</th>
                <th>İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isLow = p.stock_quantity <= p.min_stock;
                return (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brand)' }}>{p.code || '-'}</td>
                    <td style={{ fontWeight: 700 }}>{p.name}</td>
                    <td>{p.category}</td>
                    <td className="amount-number">{formatTL(p.purchase_price)}</td>
                    <td className="amount-number" style={{ color: 'var(--color-income)' }}>{formatTL(p.sale_price)}</td>
                    <td>
                      <span className="badge" style={{ background: isLow ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: isLow ? 'var(--color-warning)' : 'var(--color-income)' }}>
                        {isLow && <AlertTriangle size={12} />}
                        {p.stock_quantity} {p.unit}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-secondary" style={{ padding: '4px 10px', minHeight: '30px' }} onClick={() => handleStockUpdate(p.id, 1)}>+1</button>
                        <button className="btn-secondary" style={{ padding: '4px 10px', minHeight: '30px' }} onClick={() => handleStockUpdate(p.id, -1)}>-1</button>
                      </div>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(p.id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-expense)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>Yeni Ürün Ekle</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Ürün Adı *</label>
                <input type="text" required className="form-input" placeholder="Örn: Kablosuz Klavye" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Ürün Kodu (SKU)</label>
                  <input type="text" className="form-input" placeholder="KLV-01" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Kategori</label>
                  <input type="text" className="form-input" placeholder="Elektronik" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Alış Fiyatı (₺)</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00" value={formData.purchase_price} onChange={e => setFormData({ ...formData, purchase_price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Satış Fiyatı (₺)</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00" value={formData.sale_price} onChange={e => setFormData({ ...formData, sale_price: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Mevcut Stok Adedi</label>
                  <input type="number" className="form-input" placeholder="0" value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Kritik Stok Uyarısı Sınırı</label>
                  <input type="number" className="form-input" placeholder="5" value={formData.min_stock} onChange={e => setFormData({ ...formData, min_stock: e.target.value })} />
                </div>
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
