/**
 * Tauri API wrapper for GitHub contributions fetching
 * This uses the Rust backend commands for better security and caching
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Fetch GitHub contributions using Tauri Rust backend
 * @param {string} username - GitHub username
 * @param {string|null} token - GitHub personal access token (optional)
 * @returns {Promise<Array>} Array of contribution days
 */
export async function fetchContributionsViaTauri(username, token = null) {
  try {
    const result = await invoke('fetch_contributions', {
      username,
      token: token || undefined,
    });

    if (result.ok && result.data) {
      return result.data;
    } else {
      console.error('Tauri fetch error:', result.error);
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Failed to fetch via Tauri:', error);
    throw error;
  }
}

/**
 * Clear all cached contributions data
 * @returns {Promise<string>} Success message
 */
export async function clearCache() {
  try {
    return await invoke('clear_cache');
  } catch (error) {
    console.error('Failed to clear cache:', error);
    throw error;
  }
}

export async function saveGitHubToken(token) {
  try {
    await invoke('save_github_token', { token });
  } catch (error) {
    console.error('Failed to save token:', error);
    throw error;
  }
}

export async function getGitHubToken() {
  try {
    return await invoke('get_github_token');
  } catch (error) {
    // It's normal to fail if no token exists yet
    return null;
  }
}

export async function deleteGitHubToken() {
  try {
    await invoke('delete_github_token');
  } catch (error) {
    console.error('Failed to delete token:', error);
    throw error;
  }
}
