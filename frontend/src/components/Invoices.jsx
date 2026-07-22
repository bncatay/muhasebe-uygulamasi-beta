import React, { useEffect, useState } from 'react';
import { Plus, Printer, FileText, Download, CheckCircle, Clock } from 'lucide-react';
import API_BASE_URL from '../api';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [formData, setFormData] = useState({
    invoice_number: `FAT-2026-${Math.floor(100 + Math.random() * 900)}`,
    type: 'satis',
    customer_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
  });

  const token = localStorage.getItem('token');

  const loadData = () => {
    fetch(`${API_BASE_URL}/api/invoices`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setInvoices(Array.isArray(data) ? data : []));

    fetch(`${API_BASE_URL}/api/customers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []));

    fetch(`${API_BASE_URL}/api/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === 'quantity' || field === 'unit_price') {
      const q = parseFloat(newItems[index].quantity || 0);
      const p = parseFloat(newItems[index].unit_price || 0);
      newItems[index].total = q * p;
    }

    setFormData({ ...formData, items: newItems });
  };

  const calculateSubtotal = () => formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const calculateKDV = () => calculateSubtotal() * 0.20;
  const calculateGrandTotal = () => calculateSubtotal() + calculateKDV();

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      total_amount: calculateGrandTotal(),
      tax_amount: calculateKDV(),
      status: 'ödenmedi'
    };

    fetch(`${API_BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => {
        setShowModal(false);
        loadData();
      });
  };

  const formatTL = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Fatura Yönetimi</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Yeni Fatura Kes
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedInvoice ? '1fr 1fr' : '1fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '8px' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>FATURA NO</th>
                  <th>MÜŞTERİ / FİRMA</th>
                  <th>TARIH</th>
                  <th>TUTAR</th>
                  <th>DURUM</th>
                  <th>ÖNİZLE</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ background: selectedInvoice?.id === inv.id ? 'rgba(99, 102, 241, 0.1)' : '' }}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-brand)' }}>{inv.invoice_number}</td>
                    <td style={{ fontWeight: 600 }}>{inv.customer_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{inv.issue_date}</td>
                    <td className="amount-number" style={{ fontWeight: 700 }}>{formatTL(inv.total_amount)}</td>
                    <td>
                      <span className="badge" style={{ background: inv.status === 'ödendi' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)', color: inv.status === 'ödendi' ? 'var(--color-income)' : 'var(--color-expense)' }}>
                        {inv.status === 'ödendi' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button className="btn-secondary" style={{ padding: '4px 10px', minHeight: '30px' }} onClick={() => setSelectedInvoice(inv)}>
                        Göster
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedInvoice && (
          <div className="glass-panel" style={{ padding: '32px', background: '#fff', color: '#0f172a', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5' }}>FATURA</h2>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Fatura No: <strong>{selectedInvoice.invoice_number}</strong></div>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Tarih: {selectedInvoice.issue_date}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button onClick={handlePrint} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <Printer size={16} /> Yazdır / PDF
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>SAYIN (MÜŞTERİ / FİRMA):</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px' }}>{selectedInvoice.customer_name}</div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>Vergi No: {selectedInvoice.tax_number || '-'}</div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>Adres: {selectedInvoice.address || '-'}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>AÇIKLAMA</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>MİKTAR</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>BİRİM FİYAT</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>TOPLAM</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items?.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px' }}>{item.description}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{formatTL(item.unit_price)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>{formatTL(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', fontSize: '0.95rem' }}>
              <div>Ara Toplam: <strong>{formatTL(selectedInvoice.total_amount - selectedInvoice.tax_amount)}</strong></div>
              <div>KDV (%20): <strong>{formatTL(selectedInvoice.tax_amount)}</strong></div>
              <div style={{ fontSize: '1.2rem', color: '#4f46e5', fontWeight: 800, marginTop: '8px' }}>
                GENEL TOPLAM: {formatTL(selectedInvoice.total_amount)}
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>Yeni Satış Faturası Kes</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Fatura No *</label>
                  <input type="text" required className="form-input" value={formData.invoice_number} onChange={e => setFormData({ ...formData, invoice_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Müşteri Seçin *</label>
                  <select required className="form-select" value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })}>
                    <option value="">-- Müşteri Seç --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Fatura Kalemleri</label>
                {formData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: '8px', marginTop: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Hizmet / Ürün Açıklaması" 
                      className="form-input"
                      value={item.description} 
                      onChange={e => handleItemChange(idx, 'description', e.target.value)} 
                    />
                    <input 
                      type="number" 
                      placeholder="Adet" 
                      className="form-input"
                      value={item.quantity} 
                      onChange={e => handleItemChange(idx, 'quantity', e.target.value)} 
                    />
                    <input 
                      type="number" 
                      placeholder="Birim Fiyat ₺" 
                      className="form-input"
                      value={item.unit_price} 
                      onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} 
                    />
                  </div>
                ))}
                <button type="button" className="btn-secondary" style={{ marginTop: '8px', padding: '6px 12px' }} onClick={handleAddItem}>
                  + Kalem Ekle
                </button>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px', textAlign: 'right', marginTop: '16px' }}>
                <div>KDV Dahil Toplam: <strong className="amount-number" style={{ color: 'var(--color-brand)', fontSize: '1.2rem' }}>{formatTL(calculateGrandTotal())}</strong></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn-primary">Faturayı Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
