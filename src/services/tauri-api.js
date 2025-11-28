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
export async function clearCacheViaTauri() {
  try {
    const message = await invoke('clear_cache');

    return message;
  } catch (error) {
    console.error('Failed to clear cache:', error);
    throw error;
  }
}
