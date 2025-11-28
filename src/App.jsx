import { useState, useEffect, useCallback } from 'react';
import Heatmap from './components/Heatmap';
import Login from './components/Login';
import { fetchContributionsViaTauri, getGitHubToken, deleteGitHubToken } from './services/tauri-api';
import { fetchGitHubActivity } from './services/github';

import { getCurrentWindow } from '@tauri-apps/api/window';

/**
 * Main React component that loads GitHub contribution activity, manages authentication state, and renders the appropriate UI (login, loading, error, or heatmap) with window controls.
 *
 * @returns {JSX.Element} A JSX element for the application UI: the Login view when not authenticated, a header with window controls when authenticated, and either a loading indicator, an error view with a Back to Login option, or the Heatmap populated with contribution data.
 */
function App() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadActivity = useCallback(async () => {
    try {
      setLoading(true);
      // Get credentials
      const username = localStorage.getItem('github_username');
      let token = await getGitHubToken();
      
      // Fallback to env/localstorage if not in keychain (migration/dev)
      if (!token) {
        token = localStorage.getItem('github_token') || 
                import.meta.env.VITE_GITHUB_TOKEN;
      }

      if (!username || !token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Try Tauri backend first
      try {
        const data = await fetchContributionsViaTauri(username, token);
        setActivity(data);
        setError(null);
      } catch (tauri_error) {
        console.warn('Tauri backend failed, falling back to JS:', tauri_error);
        // Fallback
        const data = await fetchGitHubActivity(username, token);
        setActivity(data);
        setError(null);
      }

    } catch (error) {
      console.error('Failed to fetch GitHub activity:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivity();
    const interval = setInterval(loadActivity, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [loadActivity]);



  const handleLoginSuccess = () => {
    loadActivity();
  };

  const handleLogout = async () => {
    try {
      await deleteGitHubToken();
      localStorage.removeItem('github_username');
      localStorage.removeItem('github_token');
      setIsAuthenticated(false);
      setActivity([]);
    } catch (e) {
      console.error('Failed to logout:', e);
    }
  };

  const handleClose = async () => {
    try {
      await getCurrentWindow().close();
    } catch (e) {
      console.error('Failed to close window:', e);
    }
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="app">
        <div className="drag-region" data-tauri-drag-region />
        <div className="window-controls">
          <button className="control-btn close-btn" onClick={handleClose} title="Close Widget">×</button>
        </div>
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="drag-region" data-tauri-drag-region />
      <div className="window-controls">
        {isAuthenticated && (
          <button 
            className="control-btn" 
            onClick={handleLogout} 
            title="Sign out"
            style={{ marginRight: '4px', display: 'flex', alignItems: 'center' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        )}
        <button className="control-btn close-btn" onClick={handleClose} title="Close Widget">×</button>
      </div>
      {loading && activity.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <p>Loading...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ color: '#ff6b6b' }}>Error: {error}</p>
          <button onClick={() => setIsAuthenticated(false)} style={{ marginTop: '10px', background: 'none', border: '1px solid currentColor', color: 'inherit', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
            Back to Login
          </button>
        </div>
      ) : (
        <Heatmap data={activity} />
      )}
    </div>
  );
}

export default App;