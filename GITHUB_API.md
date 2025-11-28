# Secure GitHub API Integration - Implementation Guide

## Overview

This implementation provides a production-ready GitHub contributions fetching system with multiple fallback strategies and secure credential management.

## Architecture

### Frontend (JavaScript)

- **[github.js](file:///c:/Users/hanxi/Documents/Github%20Widget/src/services/github.js)**: Main fetching logic with GraphQL and scraping
- **[tauri-api.js](file:///c:/Users/hanxi/Documents/Github%20Widget/src/services/tauri-api.js)**: Tauri backend wrapper (optional, more secure)

### Backend (Rust)

- **[commands.rs](file:///c:/Users/hanxi/Documents/Github%20Widget/src-tauri/src/commands.rs)**: Tauri commands for secure HTTP requests
- Filesystem caching with 5-minute expiry
- Automatic cache directory management

## Features

✅ **GraphQL API Support** - Primary method with authentication  
✅ **HTML Scraping Fallback** - Works for public profiles without token  
✅ **Rust Backend Option** - More secure, server-side caching  
✅ **Rate Limit Handling** - Detects and reports rate limit errors  
✅ **Filesystem Caching** - 5-minute cache in Rust backend  
✅ **Mock Data** - Development fallback when no credentials  
✅ **Error Handling** - Comprehensive error reporting

## Usage

### Option 1: JavaScript Direct Fetch (Current Implementation)

Set credentials in browser localStorage or environment:

```javascript
// In browser console or App.jsx
import { setGitHubCredentials } from "./services/github";

// With token (recommended)
setGitHubCredentials("your-username", "ghp_yourtoken");

// Without token (public profiles only)
setGitHubCredentials("your-username");
```

### Option 2: Environment Variables

Create `.env` file in project root:

```bash
VITE_GITHUB_USERNAME=your-username
VITE_GITHUB_TOKEN=ghp_yourtoken
```

### Option 3: Tauri Backend (Most Secure)

Update App.jsx to use Tauri backend:

```javascript
import { fetchContributionsViaTauri } from "./services/tauri-api";

// In useEffect:
const data = await fetchContributionsViaTauri("username", "token");
```

## Testing

The implementation automatically handles all error cases:

1. ✅ **With valid token**: Uses GraphQL API
2. ✅ **Without token**: Falls back to HTML scraping
3. ✅ **Private profile**: Returns error message
4. ✅ **Rate limited**: Returns reset time
5. ✅ **No credentials**: Uses mock data

## API Response Format

All methods return the same format:

```javascript
{
  ok: boolean,
  data?: [{ date: "2025-01-15", contributionCount: 5 }, ...],
  error?: "Error message if failed"
}
```

## Cache Management

**JavaScript Cache** (5 minutes):

```javascript
// Cleared automatically or manually via cache.js
```

**Rust Filesystem Cache** (5 minutes):

```javascript
import { clearCacheViaTauri } from "./services/tauri-api";
await clearCacheViaTauri();
```

Cache location: `%APPDATA%/github_widget/cache/`

## Security Best Practices

> [!IMPORTANT] > **Never commit tokens to git!** Use environment variables or localStorage.

1. Use personal access tokens with minimal scopes (`read:user` only)
2. Store tokens in environment variables for production
3. Use Tauri backend for enterprise deployments
4. Regularly rotate access tokens

## Troubleshooting

**"GraphQL errors"**: Check token validity and scopes  
**"Profile might be private"**: Enable public contribution graph or use token  
**"Rate limited"**: Wait or use authenticated requests  
**Mock data showing**: Set credentials via `setGitHubCredentials()`

## Next Steps

To switch to Tauri backend (recommended for production):

1. Update [App.jsx](file:///c:/Users/hanxi/Documents/Github%20Widget/src/App.jsx) to import `tauri-api.js`
2. Replace `fetchGitHubActivity()` with `fetchContributionsViaTauri()`
3. Restart development server

The Rust backend provides better security, server-side caching, and no CORS issues.
