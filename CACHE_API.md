# Persistent Cache API - Usage Guide

## Overview

The cache system now uses Tauri's filesystem API to persist GitHub contributions data to disk. Data survives app restarts and has a 1-hour TTL by default.

## API Functions

### `readCache(username, ttlMs = 3600000)`

Read cached contributions from disk.

**Parameters:**

- `username` (string): GitHub username
- `ttlMs` (number, optional): Time-to-live in milliseconds (default: 1 hour)

**Returns:** Promise resolving to:

```javascript
{
  ok: boolean,
  data?: [{ date: "2025-01-15", contributionCount: 5 }, ...],
  error?: string
}
```

**Example:**

```javascript
import { readCache } from "./services/cache";

const result = await readCache("octocat");
if (result.ok) {
  console.log("Found cached data:", result.data);
} else {
  console.log("Cache miss:", result.error);
}
```

---

### `writeCache(username, days)`

Write contributions data to disk cache.

**Parameters:**

- `username` (string): GitHub username
- `days` (Array): Contribution days `[{date, contributionCount}, ...]`

**Returns:** Promise resolving to:

```javascript
{
  ok: boolean,
  error?: string
}
```

**Example:**

```javascript
import { writeCache } from "./services/cache";

const days = [
  { date: "2025-01-15", contributionCount: 5 },
  { date: "2025-01-16", contributionCount: 3 },
];

const result = await writeCache("octocat", days);
if (result.ok) {
  console.log("Cache saved successfully");
}
```

---

### `isFresh(generatedAt, ttlMs = 3600000)`

Check if cached data is still fresh.

**Parameters:**

- `generatedAt` (number): Timestamp when data was cached
- `ttlMs` (number, optional): Time-to-live in milliseconds

**Returns:** boolean

**Example:**

```javascript
import { isFresh } from "./services/cache";

const timestamp = Date.now() - 30 * 60 * 1000; // 30 minutes ago
console.log(isFresh(timestamp)); // true (30min < 1hour)

const oldTimestamp = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
console.log(isFresh(oldTimestamp)); // false (2hours > 1hour)
```

---

### Additional Functions

#### `clearCache(username)`

Remove cached data for a specific user.

#### `getCacheInfo(username)`

Get cache statistics (exists, age, size, freshnessStatus).

---

## Cache File Format

Files are stored in `%APPDATA%/github_widget/cache/` as:

**Filename:** `cache_<username>.json`

**Content (compact JSON):**

```json
{
  "username": "octocat",
  "generatedAt": 1690000000000,
  "days": [
    { "date": "2025-01-01", "contributionCount": 0 },
    { "date": "2025-01-02", "contributionCount": 5 }
  ]
}
```

## Default TTL

- **Default:** 1 hour (3600000ms)
- **Recommended for production:** 1 hour
- **For development/testing:** Can be set to 0 for no caching

## Integration with GitHub Service

The `github.js` service now automatically:

1. **On fetch**: Checks disk cache before making API requests
2. **On success**: Writes fetched data to disk cache
3. **On clear**: Removes cache file along with credentials

No changes needed to App.js - cache is handled transparently!

## Benefits

✅ **Persistent**: Data survives app restarts  
✅ **Efficient**: Reduces API calls and rate limiting  
✅ **Automatic**: Integrated into existing fetch logic  
✅ **Cross-platform**: Uses Tauri's BaseDirectory.AppData  
✅ **Safe**: Username sanitization prevents path traversal

## Testing

```javascript
// In browser console:
import { getCacheInfo } from "./services/cache";

const info = await getCacheInfo("your-username");
console.log(info);
// { exists: true, age: 120000, size: 15234, daysCount: 365, isFresh: true }
```
