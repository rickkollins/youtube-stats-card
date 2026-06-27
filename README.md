# YouTube Stats Card for Home Assistant

  A custom Lovelace card that displays live YouTube channel statistics and recent uploads, powered by your own Replit-hosted API.

  ![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Custom%20Card-blue?logo=home-assistant)

  ## Features

  - 🔴 Live subscriber count, total views, and video count
  - 🎬 Recent uploads with thumbnails, view/like counts, and direct links
  - 🔄 Auto-refreshes every 5 minutes
  - 📡 Fetches directly from your Replit API — no HA sensor required
  - 🎨 Dark theme designed to match HA dashboards

  ## Installation

  ### 1. Copy the card file

  Download `youtube-stats-card.js` from this repo and place it in your Home Assistant `config/www/` folder.

  ### 2. Register as a resource

  **Settings → Dashboards → (⋮ menu) → Resources → Add Resource**

  | Field | Value |
  |-------|-------|
  | URL | `/local/youtube-stats-card.js` |
  | Type | JavaScript Module |

  Hard-refresh your browser (Ctrl+Shift+R) after saving.

  ### 3. Add the card

  Edit a dashboard → **Add Card → Manual** and paste:

  ```yaml
  type: custom:youtube-stats-card
  api_url: https://your-app.replit.app
  ```

  Replace `https://your-app.replit.app` with your published Replit deployment URL.

  ## Configuration

  ### API mode (recommended)

  ```yaml
  type: custom:youtube-stats-card
  api_url: https://your-app.replit.app   # base URL of your Replit deployment
  max_videos: 3                           # number of recent videos to show (default: 3)
  ```

  ### Entity mode (legacy — uses an HA sensor instead)

  ```yaml
  type: custom:youtube-stats-card
  entity: sensor.youtube_channel
  channel_name: "My Channel"
  handle: "@mychannel"
  show_today_delta: true
  ```

  Expected sensor attributes: `subscriber_count`, `view_count`, `subscriber_delta`, `view_delta`

  ## License

  MIT
  