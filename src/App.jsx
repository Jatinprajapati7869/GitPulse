import { useState, useEffect } from 'react';
import Heatmap from './components/Heatmap';
import { fetchContributionsViaTauri } from './services/tauri-api';
import { fetchGitHubActivity } from './services/github';

import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';

function App() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        // Get credentials from localStorage or environment
        const username = localStorage.getItem('github_username') || 
                        import.meta.env.VITE_GITHUB_USERNAME;
        const token = localStorage.getItem('github_token') || 
                     import.meta.env.VITE_GITHUB_TOKEN || 
                     null;

        // Try Tauri backend first (more secure with filesystem cache)
        if (username && username !== 'YOUR_USERNAME_HERE') {
          try {
            const data = await fetchContributionsViaTauri(username, token);
            setActivity(data);
            setError(null);

            return;
          } catch (tauri_error) {
            console.warn('Tauri backend failed, falling back to JS:', tauri_error);
          }
        }

        // Fallback to JavaScript implementation
        const data = await fetchGitHubActivity();
        setActivity(data);
        setError(null);

      } catch (error) {
        console.error('Failed to fetch GitHub activity:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
    const interval = setInterval(loadActivity, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const handleClose = async () => {

    try {
      await getCurrentWindow().close();
    } catch (e) {
      console.error('Failed to close window:', e);
    }
  };

  const handleResetSize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.setSize(new LogicalSize(950, 220));
    } catch (e) {
      console.error('Failed to resize window:', e);
    }
  };

  return (
    <div className="app">
      <div className="drag-region" data-tauri-drag-region />
      <div className="window-controls">
        <button className="control-btn close-btn" onClick={handleClose} title="Close Widget">×</button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: '#ff6b6b' }}>Error: {error}</p>
      ) : (
        <Heatmap data={activity} />
      )}
    </div>
  );
}

export default App;
