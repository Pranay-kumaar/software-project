// Admin — API Key Management
import { useState, useEffect } from 'react';
import { getGeminiKeys, updateGeminiKeys } from '../../services/firestore';
import { useToast } from '../../contexts/ToastContext';
import { Key, Plus, Trash2, Eye, EyeOff, Save, RefreshCw, Shield } from 'lucide-react';

export default function ApiKeyManagement() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState({});
  const { success, error } = useToast();

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    try {
      const data = await getGeminiKeys();
      setKeys(data.length ? data : Array.from({ length: 10 }, (_, i) => ({
        key: '',
        label: `Key ${i + 1}`,
        enabled: true
      })));
    } catch (err) {
      // Initialize with empty slots
      setKeys(Array.from({ length: 10 }, (_, i) => ({
        key: '',
        label: `Key ${i + 1}`,
        enabled: true
      })));
    } finally {
      setLoading(false);
    }
  }

  function updateKey(index, field, value) {
    setKeys(prev => prev.map((k, i) => i === index ? { ...k, [field]: value } : k));
  }

  function addKeySlot() {
    setKeys(prev => [...prev, { key: '', label: `Key ${prev.length + 1}`, enabled: true }]);
  }

  function removeKey(index) {
    setKeys(prev => prev.filter((_, i) => i !== index));
  }

  function toggleShow(index) {
    setShowKeys(prev => ({ ...prev, [index]: !prev[index] }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const validKeys = keys.filter(k => k.key.trim());
      await updateGeminiKeys(validKeys);
      success(`Saved ${validKeys.length} API keys successfully!`);
    } catch (err) {
      error('Failed to save API keys.');
    } finally {
      setSaving(false);
    }
  }

  const activeCount = keys.filter(k => k.key.trim() && k.enabled).length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>Gemini API Keys</h1>
            <p>Manage the round-robin API key pool for AI features</p>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.1)' }}>
          <Shield size={20} style={{ color: 'var(--accent-indigo)' }} />
        </div>
        <div>
          <div style={{ fontWeight: 500, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
            {activeCount} Active Keys
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Keys rotate automatically via round-robin when one hits quota limits
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {keys.map((keyObj, i) => (
            <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: keyObj.enabled ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)' }}>
                <Key size={14} style={{ color: keyObj.enabled ? 'var(--accent-emerald)' : 'var(--accent-rose)' }} />
              </div>

              <input
                className="input"
                placeholder="Label"
                value={keyObj.label}
                onChange={e => updateKey(i, 'label', e.target.value)}
                style={{ width: 120, flexShrink: 0 }}
              />

              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  className="input"
                  type={showKeys[i] ? 'text' : 'password'}
                  placeholder="AIza..."
                  value={keyObj.key}
                  onChange={e => updateKey(i, 'key', e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', paddingRight: '2.5rem' }}
                />
                <button className="input-action" onClick={() => toggleShow(i)} style={{ right: '0.5rem' }}>
                  {showKeys[i] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                <input
                  type="checkbox"
                  checked={keyObj.enabled}
                  onChange={e => updateKey(i, 'enabled', e.target.checked)}
                />
                Active
              </label>

              <button className="btn btn-icon btn-ghost" onClick={() => removeKey(i)} style={{ color: 'var(--accent-rose)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <button className="btn btn-secondary" onClick={addKeySlot} style={{ alignSelf: 'flex-start' }}>
            <Plus size={16} /> Add Key Slot
          </button>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
