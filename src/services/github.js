/**
 * Production-ready GitHub Contributions Fetcher
 * Supports GraphQL API with token and HTML scraping fallback
 */

import { readCache, writeCache } from './cache';

// GraphQL query for contribution calendar
const CONTRIBUTION_QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetch GitHub contributions using GraphQL API
 * @param {string} username - GitHub username
 * @param {string|null} token - GitHub personal access token (optional)
 * @returns {Promise<{ok: boolean, data?: Array, error?: string}>}
 */
async function fetchViaGraphQL(username, token) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: CONTRIBUTION_QUERY,
        variables: { login: username },
      }),
    });

    if (!response.ok) {
      // Check for rate limiting
      if (response.status === 429) {
        const resetTime = response.headers.get('X-RateLimit-Reset');
        return {
          ok: false,
          error: `Rate limited. Resets at ${new Date(parseInt(resetTime) * 1000).toLocaleString()}`,
        };
      }

      return {
        ok: false,
        error: `GitHub API error: ${response.status} ${response.statusText}`,
      };
    }

    const result = await response.json();

    // Check for GraphQL errors
    if (result.errors) {
      return {
        ok: false,
        error: `GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`,
      };
    }

    // Flatten weeks into chronological array of days
    const weeks = result.data?.user?.contributionsCollection?.contributionCalendar?.weeks || [];
    const days = weeks.flatMap(week => 
      week.contributionDays.map(day => ({
        date: day.date,
        contributionCount: day.contributionCount,
      }))
    );

    return {
      ok: true,
      data: days,
    };

  } catch (error) {
    return {
      ok: false,
      error: `Network error: ${error.message}`,
    };
  }
}

/**
 * Scrape GitHub contributions from public profile page
 * Fallback method when no token is available
 * @param {string} username - GitHub username
 * @returns {Promise<{ok: boolean, data?: Array, error?: string}>}
 */
async function fetchViaScraping(username) {
  try {
    const response = await fetch(`https://github.com/users/${username}/contributions`);

    if (!response.ok) {
      return {
        ok: false,
        error: `Failed to fetch profile: ${response.status} ${response.statusText}`,
      };
    }

    const html = await response.text();
    
    // Parse contribution data from SVG rect elements
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rects = doc.querySelectorAll('rect[data-date]');

    if (rects.length === 0) {
      return {
        ok: false,
        error: 'No contribution data found. Profile might be private.',
      };
    }

    const days = Array.from(rects).map(rect => ({
      date: rect.getAttribute('data-date'),
      contributionCount: parseInt(rect.getAttribute('data-count') || rect.getAttribute('data-level') || '0', 10),
    })).filter(day => day.date); // Filter out invalid entries

    return {
      ok: true,
      data: days,
    };

  } catch (error) {
    return {
      ok: false,
      error: `Scraping error: ${error.message}`,
    };
  }
}

/**
 * Main function to fetch GitHub activity
 * Tries GraphQL first (if token available), falls back to scraping
 * @returns {Promise<Array>} Array of contribution days
 */
export async function fetchGitHubActivity(usernameArg, tokenArg) {
  // Try to get credentials from arguments, environment or localStorage
  const username = usernameArg || 
                   localStorage.getItem('github_username') || 
                   import.meta.env.VITE_GITHUB_USERNAME || 
                   'YOUR_USERNAME_HERE';

  const token = tokenArg || 
                localStorage.getItem('github_token') || 
                import.meta.env.VITE_GITHUB_TOKEN || 
                null;

  // Check disk cache first (if we have a valid username)
  if (username && username !== 'YOUR_USERNAME_HERE') {
    const cacheResult = await readCache(username);
    if (cacheResult.ok && cacheResult.data) {

      return cacheResult.data;
    } else if (cacheResult.error) {

    }
  }



  let result;

  // Try GraphQL first if token is available
  if (token && token !== 'YOUR_GITHUB_TOKEN_HERE') {

    result = await fetchViaGraphQL(username, token);
    
    if (result.ok) {

      
      // Save to disk cache
      const writeResult = await writeCache(username, result.data);
      if (!writeResult.ok) {
        console.warn('Failed to write cache:', writeResult.error);
      }
      
      return result.data;
    } else {
      console.warn('GraphQL fetch failed:', result.error);
    }
  }

  // Fallback to scraping for public profiles
  if (username && username !== 'YOUR_USERNAME_HERE') {

    result = await fetchViaScraping(username);
    
    if (result.ok) {

      
      // Save to disk cache
      const writeResult = await writeCache(username, result.data);
      if (!writeResult.ok) {
        console.warn('Failed to write cache:', writeResult.error);
      }
      
      return result.data;
    } else {
      console.error('Scraping failed:', result.error);
    }
  }

  // If all methods fail, return mock data for development
  console.warn('All fetch methods failed, using mock data');
  const mockData = generateMockData();
  return mockData;
}

/**
 * Generate mock contribution data for testing/development
 * @returns {Array} Mock contribution days
 */
function generateMockData() {
  const mockData = [];
  const today = new Date();
  
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const random = Math.random();
    let count = 0;
    if (random > 0.7) count = Math.floor(Math.random() * 3) + 1;
    if (random > 0.9) count = Math.floor(Math.random() * 10) + 4;
    
    mockData.push({
      date: dateStr,
      contributionCount: count,
    });
  }
  
  return mockData;
}


