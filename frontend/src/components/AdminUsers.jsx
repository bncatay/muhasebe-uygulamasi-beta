import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2, ShieldCheck, Building, Key } from 'lucide-react';
import API_BASE_URL from '../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', company_name: '', role: 'user' });
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const loadUsers = () => {
    fetch(`${API_BASE_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    fetch(`${API_BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setShowModal(false);
          setFormData({ username: '', password: '', company_name: '', role: 'user' });
          loadUsers();
        }
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('Bu kullanıcı hesabını silmek istediğinize emin misiniz?')) {
      fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(() => loadUsers());
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Kullanıcı & İşletme Hesap Yönetimi (Admin)</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sistemi kullanacak yeni firma/kullanıcı hesapları tanımlayın.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={18} /> Yeni Kullanıcı Tanımla
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '8px' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>KULLANICI ADI</th>
                <th>FİRMA / İŞLETME ADI</th>
                <th>ROL</th>
                <th>KAYIT TARIHİ</th>
                <th>İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>#{u.id}</td>
                  <td style={{ fontWeight: 700 }}>{u.username}</td>
                  <td>{u.company_name}</td>
                  <td>
                    <span className="badge" style={{ background: u.role === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)', color: u.role === 'admin' ? 'var(--color-brand)' : 'var(--text-secondary)' }}>
                      {u.role === 'admin' ? <ShieldCheck size={12} /> : null}
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.created_at}</td>
                  <td>
                    {u.role !== 'admin' && (
                      <button onClick={() => handleDelete(u.id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-expense)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>Yeni Kullanıcı / Dükkan Tanımla</h2>
            {error && <div style={{ background: 'var(--color-expense-glow)', color: 'var(--color-expense)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Firma / İşletme Adı *</label>
                <input type="text" required className="form-input" placeholder="Örn: Özkan Kuruyemiş Ltd." value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Kullanıcı Adı *</label>
                  <input type="text" required className="form-input" placeholder="ozkankuruyemis" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Giriş Şifresi *</label>
                  <input type="text" required className="form-input" placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Yetki Rolü</label>
                <select className="form-select" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <option value="user">Standart İşletme Kullanıcısı</option>
                  <option value="admin">Sistem Yöneticisi (Admin)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn-primary">Hesabı Oluştur</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
