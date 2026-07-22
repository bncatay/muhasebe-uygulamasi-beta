import React, { useState } from 'react';
import { Building2, Lock, User, AlertCircle } from 'lucide-react';
import API_BASE_URL from '../api';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.error) {
          setError(data.error);
        } else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          onLoginSuccess(data.user);
        }
      })
      .catch(err => {
        setLoading(false);
        setError('Sunucu ile iletişim kurulamadı.');
      });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px', background: 'var(--bg-surface)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="brand-icon" style={{ margin: '0 auto 16px auto', width: '48px', height: '48px' }}>
            <Building2 size={28} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>HesapKolay Giriş</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>Ön Muhasebe & Yönetim Portalı</p>
        </div>

        {error && (
          <div style={{ background: 'var(--color-expense-glow)', border: '1px solid var(--color-expense)', padding: '12px 16px', borderRadius: '12px', color: 'var(--color-expense)', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Kullanıcı Adı</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                required 
                className="form-input" 
                style={{ width: '100%', paddingLeft: '40px' }} 
                placeholder="Kullanıcı adınız" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
              />
              <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
            </div>
          </div>

          <div className="form-group">
            <label>Şifre</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                required 
                className="form-input" 
                style={{ width: '100%', paddingLeft: '40px' }} 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Kullanıcı hesabınız yoksa lütfen sistem yöneticiniz (Admin) ile iletişime geçin.
        </div>
      </div>
    </div>
  );
}
