/**
 * Tauri API wrapper for GitHub contributions fetching
 * This uses the Rust backend commands for better security and caching
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Retrieve GitHub contribution data for a user via the Tauri backend.
 * @param {string} username - GitHub username.
 * @param {string|null} token - Optional GitHub personal access token; if `null` the token is omitted.
 * @returns {Array} Array of contribution day objects.
 * @throws {Error} When the Tauri backend returns an error or the invocation fails.
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
 * Clear all cached GitHub contributions stored by the Tauri backend.
 * @returns {string} Success message.
 */
export async function clearCache() {
  try {
    return await invoke('clear_cache');
  } catch (error) {
    console.error('Failed to clear cache:', error);
    throw error;
  }
}

/**
 * Persist a GitHub personal access token in the Tauri backend.
 * @param {string} token - The GitHub personal access token to save.
 * @throws {Error} Rethrows the underlying error if the backend fails to save the token.
 */
export async function saveGitHubToken(token) {
  try {
    await invoke('save_github_token', { token });
  } catch (error) {
    console.error('Failed to save token:', error);
    throw error;
  }
}

/**
 * Retrieve the stored GitHub personal access token, if any.
 * @returns {string|null} The saved GitHub token, or `null` if no token is stored or retrieval fails.
 */
export async function getGitHubToken() {
  try {
    return await invoke('get_github_token');
  } catch (error) {
    // It's normal to fail if no token exists yet
    return null;
  }
}

/**
 * Delete the stored GitHub personal access token.
 *
 * @throws {Error} The error thrown when the underlying deletion fails; the original error is rethrown.
 */
export async function deleteGitHubToken() {
  try {
    await invoke('delete_github_token');
  } catch (error) {
    console.error('Failed to delete token:', error);
    throw error;
  }
}