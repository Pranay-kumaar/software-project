// Landing Page — Hero, Features, How It Works, CTA
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
  Brain, Shield, Clock, Users, BookOpen, Award,
  ChevronRight, Sparkles, MonitorPlay, FileText,
  Sun, Moon, Zap, BarChart3, GraduationCap
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: <Brain size={24} />,
      title: 'AI-Powered Evaluation',
      description: 'Gemini AI auto-evaluates answers, generates questions, and provides intelligent feedback on student performance.',
      color: 'var(--accent-violet)'
    },
    {
      icon: <Shield size={24} />,
      title: 'Secure Testing',
      description: 'Full-screen lockdown, tab-switch detection, and timed sessions prevent cheating during examinations.',
      color: 'var(--accent-emerald)'
    },
    {
      icon: <Users size={24} />,
      title: 'Classroom Management',
      description: 'Create virtual classrooms, share join codes, track student progress, and manage your entire teaching workflow.',
      color: 'var(--accent-sky)'
    },
    {
      icon: <BarChart3 size={24} />,
      title: 'Rich Analytics',
      description: 'Comprehensive dashboards for teachers with grade distributions, performance trends, and detailed reports.',
      color: 'var(--accent-amber)'
    },
    {
      icon: <Sparkles size={24} />,
      title: 'AI Study Hub',
      description: 'Students can upload materials and have AI generate flashcards, mock exams, and study guides instantly.',
      color: 'var(--accent-indigo)'
    },
    {
      icon: <FileText size={24} />,
      title: 'PDF Export',
      description: 'Export results, question papers, flashcards, and reports as professional PDF documents with one click.',
      color: 'var(--accent-rose)'
    },
  ];

  const steps = [
    { num: '01', title: 'Sign Up', desc: 'Register as a teacher or student in seconds.', icon: <GraduationCap size={28} /> },
    { num: '02', title: 'Create or Join', desc: 'Teachers create classrooms. Students join with a code.', icon: <Users size={28} /> },
    { num: '03', title: 'Build Tests', desc: 'Create tests manually or let AI generate them from your content.', icon: <BookOpen size={28} /> },
    { num: '04', title: 'Take & Evaluate', desc: 'Students take timed exams. AI auto-evaluates responses.', icon: <Award size={28} /> },
  ];

  return (
    <div className="landing-page">
      {/* Ambient Background */}
      <div className="landing-ambient" />

      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="container landing-nav-inner">
          <Link to="/" className="landing-logo">
            <div className="logo-mark">
              <Zap size={20} />
            </div>
            <span className="logo-text">Examine<span className="logo-accent">AI</span></span>
          </Link>

          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <button className="btn btn-icon btn-ghost" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" className="btn btn-ghost">Log In</Link>
            <Link to="/register" className="btn btn-primary">
              Get Started <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="container">
          <div className="hero-content animate-fade-in-up">
            <div className="hero-badge">
              <Sparkles size={14} />
              <span>Powered by Gemini AI</span>
            </div>
            <h1 className="hero-title">
              The Future of
              <span className="hero-gradient-text"> Online Examinations</span>
            </h1>
            <p className="hero-subtitle">
              Create, manage, and evaluate tests with AI-powered intelligence.
              Built for teachers who want to focus on teaching, not grading.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Start Free <ChevronRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                <MonitorPlay size={18} /> Sign In
              </Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-value">AI-Powered</span>
                <span className="hero-stat-label">Evaluation</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-value">Real-Time</span>
                <span className="hero-stat-label">Analytics</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-value">Secure</span>
                <span className="hero-stat-label">Testing</span>
              </div>
            </div>
          </div>

          {/* Floating decoration */}
          <div className="hero-visual animate-fade-in delay-3">
            <div className="hero-glow-orb orb-1" />
            <div className="hero-glow-orb orb-2" />
            <div className="hero-card-preview glass-card">
              <div className="preview-header">
                <div className="preview-dot" style={{ background: 'var(--accent-rose)' }} />
                <div className="preview-dot" style={{ background: 'var(--accent-amber)' }} />
                <div className="preview-dot" style={{ background: 'var(--accent-emerald)' }} />
              </div>
              <div className="preview-content">
                <div className="preview-line" style={{ width: '80%' }} />
                <div className="preview-line" style={{ width: '60%' }} />
                <div className="preview-line" style={{ width: '90%' }} />
                <div className="preview-bar-chart">
                  <div className="preview-bar" style={{ height: '40%', background: 'var(--accent-indigo)' }} />
                  <div className="preview-bar" style={{ height: '70%', background: 'var(--accent-violet)' }} />
                  <div className="preview-bar" style={{ height: '55%', background: 'var(--accent-indigo)' }} />
                  <div className="preview-bar" style={{ height: '85%', background: 'var(--accent-violet)' }} />
                  <div className="preview-bar" style={{ height: '65%', background: 'var(--accent-indigo)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="landing-features">
        <div className="container">
          <div className="section-header animate-fade-in-up">
            <span className="section-badge badge badge-indigo">Features</span>
            <h2>Everything you need to digitize your exams</h2>
            <p>From AI question generation to anti-cheating measures — we've got it all.</p>
          </div>
          <div className="features-grid">
            {features.map((feature, i) => (
              <div key={i} className={`feature-card glass-card animate-fade-in-up delay-${i % 5 + 1}`}>
                <div className="feature-icon" style={{ background: `${feature.color}15`, color: feature.color }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="landing-steps">
        <div className="container">
          <div className="section-header animate-fade-in-up">
            <span className="section-badge badge badge-emerald">How It Works</span>
            <h2>Get started in minutes</h2>
            <p>A simple workflow to transform your assessment process.</p>
          </div>
          <div className="steps-grid">
            {steps.map((step, i) => (
              <div key={i} className={`step-card animate-fade-in-up delay-${i + 1}`}>
                <div className="step-number">{step.num}</div>
                <div className="step-icon-wrapper">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {i < steps.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <div className="container">
          <div className="cta-card glass-card animate-fade-in-up">
            <div className="cta-glow" />
            <h2>Ready to transform your classroom?</h2>
            <p>Join ExamineAI and experience the future of education technology.</p>
            <div className="hero-actions" style={{ justifyContent: 'center' }}>
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started Free <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-inner">
            <div className="landing-logo">
              <div className="logo-mark"><Zap size={16} /></div>
              <span className="logo-text" style={{ fontSize: '1rem' }}>Examine<span className="logo-accent">AI</span></span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              © {new Date().getFullYear()} ExamineAI. Built with AI for smarter education.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
