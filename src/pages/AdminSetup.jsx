// Admin Setup Utility
// Run this page once to create the initial admin account
// Access via /setup-admin route (only works when no admin exists)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useToast } from '../contexts/ToastContext';
import { Zap, Shield, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import './AuthPages.css';

export default function AdminSetup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'admin'));
      const snap = await getDocs(q);
      setAdminExists(!snap.empty);
    } catch (err) {
      console.error('Error checking for admin:', err);
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return error('Fill in all fields.');
    if (form.password.length < 6) return error('Password must be at least 6 characters.');

    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(result.user, { displayName: form.name });
      await setDoc(doc(db, 'users', result.user.uid), {
        email: form.email,
        displayName: form.name,
        role: 'admin',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      success('Admin account created! Redirecting...');
      setTimeout(() => navigate('/admin', { replace: true }), 1000);
    } catch (err) {
      error(err.message || 'Failed to create admin account.');
    } finally {
      setLoading(false);
    }
  }

  if (checking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="btn-spinner" style={{ width: 32, height: 32, borderWidth: 3, borderColor: 'var(--border-secondary)', borderTopColor: 'var(--accent-indigo)' }} />
    </div>
  );

  if (adminExists) return (
    <div className="auth-page">
      <div className="auth-ambient" />
      <div className="auth-container">
        <div className="glass-card animate-scale-in" style={{ maxWidth: 440, textAlign: 'center', padding: '2.5rem' }}>
          <Shield size={40} style={{ color: 'var(--accent-indigo)', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Admin Already Exists</h2>
          <p style={{ marginBottom: '1.5rem' }}>An admin account has already been created. Use the login page to sign in.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-ambient" />
      <div className="auth-container animate-fade-in-up">
        <div className="auth-card glass-card">
          <div className="auth-logo">
            <div className="logo-mark"><Zap size={20} /></div>
            <span className="logo-text">Examine<span className="logo-accent">AI</span></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Shield size={20} style={{ color: 'var(--accent-rose)' }} />
            <h1 className="auth-title" style={{ marginBottom: 0 }}>Admin Setup</h1>
          </div>
          <p className="auth-subtitle">Create the platform administrator account</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="admin-name">Full Name</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input id="admin-name" type="text" className="input" placeholder="Admin Name" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="admin-email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input id="admin-email" type="email" className="input" placeholder="admin@example.com" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="admin-password">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input id="admin-password" type={showPassword ? 'text' : 'password'} className="input"
                  placeholder="Min. 6 characters" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required style={{ paddingLeft: '2.5rem' }} />
                <button type="button" className="input-action" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : <><Shield size={18} /> Create Admin Account</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
