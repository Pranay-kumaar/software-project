// Register Page
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { Mail, Lock, Eye, EyeOff, User, Zap, Sun, Moon, ArrowLeft, UserPlus, GraduationCap, BookOpen } from 'lucide-react';
import './AuthPages.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { error: toastError, success, info } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { name, email, password, confirmPassword, role } = form;

    if (!name || !email || !password) return toastError('Please fill in all fields.');
    if (password.length < 6) return toastError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return toastError('Passwords do not match.');

    setIsLoading(true);
    try {
      await register(email, password, name, role);
      if (role === 'teacher') {
        info('Account created! Your teacher account is pending admin approval.');
      } else {
        success('Account created successfully!');
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
      };
      toastError(messages[err.code] || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-ambient" />

      <div className="auth-header">
        <Link to="/" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <button className="btn btn-icon btn-ghost" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="auth-container animate-fade-in-up">
        <div className="auth-card glass-card">
          <div className="auth-logo">
            <div className="logo-mark"><Zap size={20} /></div>
            <span className="logo-text">Examine<span className="logo-accent">AI</span></span>
          </div>

          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join ExamineAI and get started</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Role Selector */}
            <div className="role-selector">
              <button
                type="button"
                className={`role-option ${form.role === 'student' ? 'active' : ''}`}
                onClick={() => updateForm('role', 'student')}
              >
                <GraduationCap size={20} />
                <span>Student</span>
              </button>
              <button
                type="button"
                className={`role-option ${form.role === 'teacher' ? 'active' : ''}`}
                onClick={() => updateForm('role', 'teacher')}
              >
                <BookOpen size={20} />
                <span>Teacher</span>
              </button>
            </div>

            {form.role === 'teacher' && (
              <div className="role-notice">
                <p>Teacher accounts require admin approval before activation.</p>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="register-name">Full Name</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  id="register-name"
                  type="text"
                  className="input"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="register-email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  id="register-email"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => updateForm('email', e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-form-row">
              <div className="input-group">
                <label htmlFor="register-password">Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => updateForm('password', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-action"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="register-confirm">Confirm Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="register-confirm"
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={e => updateForm('confirmPassword', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="btn-spinner" />
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
