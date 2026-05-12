import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const SystemSettings = () => {
  const [emailConfig, setEmailConfig] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    user: 'iiorprojects2024@gmail.com',
    pass: 'znwrolwpkvsykwkt',
    from: 'CropLoss Portal <iiorprojects2024@gmail.com>'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings/email_config');
      if (res.data.success && res.data.data) {
        setEmailConfig(res.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching settings:', err);
      // toast.error('Failed to load settings');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEmailConfig({ ...emailConfig, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Saving settings...');
    setSaving(true);
    try {
      await axios.post('/api/settings/email_config', { value: emailConfig });
      toast.success('System settings updated successfully!', { id: loadingToast });
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error(err.response?.data?.message || 'Failed to save settings', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner">
        <div className="spinner-ring"></div>
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h2>⚙️ System Configuration</h2>
          <p style={{ color: 'var(--gray)', fontSize: '12px', marginTop: '4px' }}>
            Manage global communication credentials and notification gateways.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title">
            📧 Email Gateway (SMTP Settings)
          </div>
          
          <div className="alert alert-info" style={{ marginBottom: '20px' }}>
            <span>💡</span>
            <div>
              <strong>Note:</strong> These credentials are used to send automated alerts for new submissions, approvals, and high-loss warnings.
            </div>
          </div>

          <div className="form-grid grid-2">
            <div className="form-group">
              <label className="form-label required">SMTP Host</label>
              <input
                type="text"
                name="host"
                className="form-control"
                value={emailConfig.host}
                onChange={handleChange}
                placeholder="e.g. smtp.gmail.com"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">SMTP Port</label>
              <input
                type="text"
                name="port"
                className="form-control"
                value={emailConfig.port}
                onChange={handleChange}
                placeholder="e.g. 587"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Sender Email ID</label>
              <input
                type="email"
                name="user"
                className="form-control"
                value={emailConfig.user}
                onChange={handleChange}
                placeholder="e.g. iiorprojects2024@gmail.com"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">App Password</label>
              <input
                type="password"
                name="pass"
                className="form-control"
                value={emailConfig.pass}
                onChange={handleChange}
                placeholder="16-character google app password"
                required
              />
              <span className="form-note">Use a 16-character Google App Password for Gmail accounts.</span>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label required">Display "From" Name & Email</label>
              <input
                type="text"
                name="from"
                className="form-control"
                value={emailConfig.from}
                onChange={handleChange}
                placeholder='CropLoss Portal <iiorprojects2024@gmail.com>'
                required
              />
              <span className="form-note">Format: Display Name &lt;email@example.com&gt;</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--gray-l)', borderStyle: 'dashed' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0 }}>Review Changes</h3>
              <p style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '2px' }}>
                Applying these settings will instantly update the notification engine.
              </p>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
              style={{ padding: '10px 24px' }}
            >
              {saving ? 'Saving...' : '🚀 Save & Apply Settings'}
            </button>
          </div>
        </div>
      </form>

      <div className="alert alert-warning" style={{ marginTop: '20px' }}>
        <span>⚠️</span>
        <div style={{ fontSize: '11.5px' }}>
          <strong>Security Warning:</strong> Ensure the "Sender Email ID" matches the account used to generate the "App Password". Incorrect credentials will block all system notifications.
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
