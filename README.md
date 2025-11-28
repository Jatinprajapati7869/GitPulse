# GitHub Contribution Widget for Windows 11

A beautiful desktop widget that displays your GitHub contribution graph, just like the GitHub mobile widget. Built with React, Vite, and Tauri for a native Windows experience.

![Widget Preview](https://via.placeholder.com/340x140/141414/39d353?text=GitHub+Widget)

## 🚀 Features

✨ **Real-time GitHub Sync** - Fetches your actual contribution data  
🔒 **Secure Backend** - Rust-powered API calls with filesystem caching  
💾 **Persistent Cache** - Data survives app restarts (1-hour TTL)  
🎨 **GitHub-Style Heatmap** - Authentic contribution visualization  
🪟 **Desktop Integration** - Stays on desktop, not above apps  
⚡ **Auto-refresh** - Updates every 60 seconds  
🌐 **Multiple Fetch Methods** - GraphQL API, HTML scraping, or mock data

---

## 📋 Table of Contents

- [How It Works](#how-it-works)
- [Quick Start](#quick-start)
- [Adding Your GitHub Account](#adding-your-github-account)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Troubleshooting](#troubleshooting)

---

## 🔧 How It Works

### Data Fetching Flow

```
┌─────────────┐
│   App.jsx   │ → Loads widget and manages state
└──────┬──────┘
       │
       ├─→ Try Tauri Backend (Rust) ✅ Preferred
       │   └─→ fetch_contributions command
       │       ├─→ Check filesystem cache (5 min)
       │       ├─→ If expired: GitHub GraphQL API
       │       └─→ Save to cache
       │
       └─→ Fallback: JavaScript
           ├─→ Check disk cache (1 hour)
           ├─→ Try GraphQL with token
           ├─→ Try HTML scraping (public profiles)
           └─→ Use mock data (development)
```

### Key Components

1. **Frontend (React)**

   - `App.jsx` - Main component, handles data fetching
   - `Heatmap.jsx` - Contribution graph visualization
   - `heatmap.css` - GitHub-authentic styling

2. **Services (JavaScript)**

   - `github.js` - GraphQL API & HTML scraping
   - `cache.js` - Persistent disk cache (Tauri fs API)
   - `tauri-api.js` - Wrapper for Rust backend commands

3. **Backend (Rust/Tauri)**
   - `commands.rs` - Secure API fetching & filesystem caching
   - `lib.rs` - Tauri application entry point

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+ and npm
- Rust (for Tauri)
- Windows 11

### Installation

```bash
# Clone or navigate to project directory
cd "C:\Users\hanxi\Documents\Github Widget"

# Install dependencies
npm install

# Run development mode
npm run tauri:dev
```

The widget will appear on your desktop showing mock data initially.

---

## 🔐 Adding Your GitHub Account

### Method 1: Browser Console (Recommended for Testing)

1. Open the widget
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Run:

```javascript
// Set your username (required)
localStorage.setItem("github_username", "your-github-username");

// Set token (optional, for private profiles)
localStorage.setItem("github_token", "ghp_your_personal_access_token");

// Verify
console.log(localStorage.getItem("github_username"));
```

5. Refresh the widget (Ctrl+R) or wait 60 seconds

### Method 2: Environment Variables (Production)

Create a `.env` file in the project root:

```bash
VITE_GITHUB_USERNAME=your-github-username
VITE_GITHUB_TOKEN=ghp_your_token_here
```

Then restart: `npm run tauri:dev`

### Getting a GitHub Personal Access Token

1. Go to GitHub.com → **Settings**
2. **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **Generate new token (classic)**
4. Give it a name: "Desktop Widget"
5. Select scopes: **ONLY** `read:user`
6. Click **Generate token**
7. **Copy the token** (it starts with `ghp_`)

> ⚠️ **Important**: Never commit your token to Git! Use `.env` (already in `.gitignore`)

### Without a Token (Public Profiles Only)

If your contribution graph is public, you can use just the username:

```javascript
localStorage.setItem("github_username", "octocat");
```

The widget will scrape your public profile page.

---

## 🏗️ Architecture

### Dual-Mode Fetching

**Mode 1: Tauri Backend (Rust)** ✅ Recommended

- More secure (API calls happen server-side)
- Filesystem cache with 5-minute TTL
- Better error handling
- No CORS issues

**Mode 2: JavaScript Fallback**

- GraphQL API with authentication
- HTML scraping for public profiles
- In-memory + disk cache (1-hour TTL)
- Works without Rust backend

### Caching Strategy

| Cache Type    | Location                                                      | TTL     | Format |
| ------------- | ------------------------------------------------------------- | ------- | ------ |
| Rust Cache    | `%APPDATA%/github_widget/cache/<username>_contributions.json` | 5 min   | JSON   |
| JS Disk Cache | `%APPDATA%/github_widget/cache/cache_<username>.json`         | 1 hour  | JSON   |
| In-Memory     | Browser RAM                                                   | Session | Object |

### Cache File Format

```json
{
  "username": "octocat",
  "generatedAt": 1700000000000,
  "days": [
    { "date": "2025-01-15", "contributionCount": 5 },
    { "date": "2025-01-16", "contributionCount": 3 }
  ]
}
```

---

## 📁 File Structure

```
Github Widget/
├── src/
│   ├── App.jsx              # Main component
│   ├── main.jsx             # React entry point
│   ├── index.css            # Global styles
│   ├── components/
│   │   ├── Heatmap.jsx      # Contribution graph
│   │   └── heatmap.css      # Heatmap styling
│   └── services/
│       ├── github.js        # GraphQL & scraping
│       ├── cache.js         # Disk cache (Tauri fs)
│       └── tauri-api.js     # Rust backend wrapper
│
├── src-tauri/
│   ├── src/
│   │   ├── main.rs          # Entry point
│   │   ├── lib.rs           # Tauri builder
│   │   └── commands.rs      # Rust API commands
│   ├── Cargo.toml           # Rust dependencies
│   ├── tauri.conf.json      # App configuration
│   └── icons/               # App icons
│
├── package.json             # Node dependencies
├── vite.config.js           # Vite configuration
├── GITHUB_API.md            # API integration docs
├── CACHE_API.md             # Cache usage guide
└── README.md                # This file
```

---

## 🎨 Customization

### Widget Size and Position

Edit `src-tauri/tauri.conf.json`:

```json
{
  "windows": [
    {
      "width": 340, // Change width
      "height": 140, // Change height
      "alwaysOnTop": false, // Desktop mode
      "decorations": false // No title bar
    }
  ]
}
```

### Refresh Interval

Edit `src/App.jsx` line 48:

```javascript
setInterval(loadActivity, 60000); // 60000ms = 1 minute
```

### Cache TTL

**JavaScript Cache** (`src/services/cache.js`):

```javascript
const DEFAULT_TTL_MS = 3600000; // 1 hour
```

**Rust Cache** (`src-tauri/src/commands.rs`):

```rust
// Cache expires if older than 300 seconds (5 minutes)
if elapsed.as_secs() > 300 {
```

---

## 🐛 Troubleshooting

### Widget Shows Mock Data

**Cause**: No GitHub credentials configured  
**Fix**: Set `github_username` in localStorage or `.env`

### "GraphQL errors" in Console

**Cause**: Invalid or expired token  
**Fix**: Generate a new token with `read:user` scope

### "Profile might be private"

**Cause**: Trying to scrape a private profile without token  
**Fix**: Set a GitHub personal access token

### "Rate limited"

**Cause**: Too many API requests  
**Fix**:

- Add authentication token (increases limit to 5000/hour)
- Wait for reset time shown in error
- Cache will help reduce requests

### Widget Not Visible

**Cause**: Behind other windows  
**Fix**: Check if `alwaysOnTop` is set to `false` in `tauri.conf.json`

### Build Errors

```bash
# Clean and rebuild
cd src-tauri
cargo clean
cd ..
npm run tauri:dev
```

---

## 📚 Additional Documentation

- **[GITHUB_API.md](./GITHUB_API.md)** - Detailed API integration guide
- **[CACHE_API.md](./CACHE_API.md)** - Cache system documentation

---

## 🔒 Security Best Practices

✅ **DO**:

- Use environment variables for tokens
- Limit token scope to `read:user` only
- Rotate tokens regularly
- Keep tokens in `.gitignore`

❌ **DON'T**:

- Commit tokens to version control
- Share tokens publicly
- Use tokens with write permissions
- Hard-code credentials

---

## 🏗️ Building for Production

```bash
# Build the application
npm run tauri:build

# Output location:
# src-tauri/target/release/github_widget.exe
```

The executable will be standalone and can be run without Node.js!

---

## 📝 License

This project is for personal use. GitHub® is a trademark of GitHub, Inc.

---

## 🤝 Contributing

Issues and pull requests welcome! Please ensure:

- Code follows existing patterns
- No sensitive data in commits
- Test with both token and scraping methods

---

## 💡 Tips

- **Performance**: The widget uses minimal CPU when idle
- **Privacy**: All API calls are encrypted (HTTPS)
- **Offline**: Shows cached data when offline
- **Multi-Account**: Clear cache and switch username in localStorage

---

Made with ❤️ for GitHub enthusiasts
