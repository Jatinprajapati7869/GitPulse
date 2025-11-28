import React, { useState } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { saveGitHubToken } from '../services/tauri-api';

const Login = ({ onLoginSuccess }) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    try {
      await openUrl('https://github.com/settings/tokens/new?scopes=repo,read:user&description=GitPulse%20Widget');
    } catch (err) {
      setError('Failed to open browser. Please visit GitHub settings manually.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter a valid token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify token and get username
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token.trim()}`
        }
      });

      if (!response.ok) {
        throw new Error('Invalid token or network error');
      }

      const userData = await response.json();
      const username = userData.login;

      // Save token securely
      await saveGitHubToken(token.trim());
      
      // Save username to localStorage (non-sensitive)
      localStorage.setItem('github_username', username);

      onLoginSuccess(token.trim());
    } catch (err) {
      console.error(err);
      setError('Failed to verify token. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      height: '100%',
      padding: '20px 10px 10px 10px', // Top padding for drag region
      color: 'var(--text-primary)',
      textAlign: 'left',
      gap: '20px'
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <h2 style={{ marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>GitPulse Setup</h2>
        <p style={{ marginBottom: '10px', opacity: 0.7, fontSize: '11px', lineHeight: '1.2' }}>
          1. Connect GitHub<br/>
          2. Paste Token below
        </p>
        <button 
          onClick={handleConnect}
          style={{
            background: '#238636',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Connect GitHub
        </button>
      </div>

      <div style={{ width: '1px', height: '80%', background: 'rgba(255,255,255,0.1)' }}></div>

      <div style={{ flex: 1.5 }}>
        <p style={{ fontSize: '11px', marginBottom: '5px', opacity: 0.7 }}>
          Paste Token (PAT):
        </p>
        <form onSubmit={handleSave} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_..."
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '12px',
              minWidth: '0' // Prevent flex overflow
            }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: 'var(--accent-color)',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: loading ? 'wait' : 'pointer',
              fontWeight: '600',
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}
          >
            {loading ? '...' : 'Save'}
          </button>
        </form>
        {error && (
          <p style={{ color: '#f85149', fontSize: '10px', marginTop: '5px', lineHeight: '1.1' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
