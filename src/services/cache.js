/**
 * Simple in-memory cache for GitHub contributions data
 * Fallback implementation without Tauri filesystem dependencies
 */

// Default cache TTL: 1 hour (3600000ms)
const DEFAULT_TTL_MS = 3600000;

// In-memory cache storage
const cache = new Map();

/**
 * Check if cached data is still fresh based on TTL
 * @param {number} generatedAt - Timestamp when data was cached
 * @param {number} ttlMs - Time-to-live in milliseconds (default: 1 hour)
 * @returns {boolean} True if cache is fresh, false if expired
 */
export function isFresh(generatedAt, ttlMs = DEFAULT_TTL_MS) {
  if (!generatedAt || typeof generatedAt !== 'number') {
    return false;
  }

  const now = Date.now();
  const age = now - generatedAt;
  
  return age < ttlMs;
}

/**
 * Read cached contributions data from memory
 * @param {string} username - GitHub username
 * @param {number} ttlMs - Time-to-live in milliseconds (default: 1 hour)
 * @returns {Promise<{ok: boolean, data?: Array, error?: string}>}
 */
export async function readCache(username, ttlMs = DEFAULT_TTL_MS) {
  if (!username || typeof username !== 'string') {
    return {
      ok: false,
      error: 'Invalid username provided',
    };
  }

  const cacheKey = `github_${username}`;
  const cached = cache.get(cacheKey);

  if (!cached) {
    return {
      ok: false,
      error: 'Cache not found',
    };
  }

  // Check if cache is fresh
  if (!isFresh(cached.generatedAt, ttlMs)) {
    const age = Math.round((Date.now() - cached.generatedAt) / 1000 / 60);
    cache.delete(cacheKey); // Remove expired cache
    return {
      ok: false,
      error: `Cache expired (${age} minutes old)`,
    };
  }



  return {
    ok: true,
    data: cached.days,
  };
}

/**
 * Write contributions data to memory cache
 * @param {string} username - GitHub username
 * @param {Array} days - Array of contribution days [{date, contributionCount}]
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function writeCache(username, days) {
  if (!username || typeof username !== 'string') {
    return {
      ok: false,
      error: 'Invalid username provided',
    };
  }

  if (!Array.isArray(days)) {
    return {
      ok: false,
      error: 'Invalid days data (must be an array)',
    };
  }

  const cacheKey = `github_${username}`;
  
  cache.set(cacheKey, {
    username,
    generatedAt: Date.now(),
    days,
  });



  return {
    ok: true,
  };
}

/**
 * Clear cached data for a specific username
 * @param {string} username - GitHub username
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function clearCache(username) {
  if (!username || typeof username !== 'string') {
    return {
      ok: false,
      error: 'Invalid username provided',
    };
  }

  const cacheKey = `github_${username}`;
  cache.delete(cacheKey);


  return {
    ok: true,
  };
}

/**
 * Get cache statistics for a username
 * @param {string} username - GitHub username
 * @returns {Promise<{exists: boolean, age?: number, size?: number, daysCount?: number}>}
 */
export async function getCacheInfo(username) {
  const cacheKey = `github_${username}`;
  const cached = cache.get(cacheKey);

  if (!cached) {
    return { exists: false };
  }

  return {
    exists: true,
    age: Date.now() - cached.generatedAt,
    size: JSON.stringify(cached.days).length,
    daysCount: cached.days?.length || 0,
    isFresh: isFresh(cached.generatedAt),
  };
}

// Legacy compatibility exports
export function getCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  // Check freshness
  if (!isFresh(cached.timestamp || cached.generatedAt)) {
    cache.delete(key);
    return null;
  }
  
  return cached.data || cached;
}

export function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}
