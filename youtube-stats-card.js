/**
 * YouTube Stats Card for Home Assistant
 *
 * Installation:
 * 1. Copy this file to your HA config/www/ directory
 * 2. Settings → Dashboards → Resources → Add Resource
 *    URL: /local/youtube-stats-card.js   Type: JavaScript Module
 * 3. Hard-refresh the browser (Ctrl+Shift+R)
 *
 * ── API mode (recommended) ──────────────────────────────────────────────────
 *   type: custom:youtube-stats-card
 *   api_url: https://your-app.replit.app   # base URL of your Replit deployment
 *
 * ── Entity mode (legacy) ────────────────────────────────────────────────────
 *   type: custom:youtube-stats-card
 *   entity: sensor.youtube_channel
 *   channel_name: "My Channel"
 *   handle: "@mychannel"
 *   show_today_delta: true
 *
 * Expected sensor attributes (entity mode):
 *   subscriber_count  (number)   e.g. 1660
 *   view_count        (number)   e.g. 93479
 *   subscriber_delta  (number)   optional, daily gain
 *   view_delta        (number)   optional, daily gain
 */

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const styles = `
  :host {
    display: block;
    --yt-card-bg: #1e2433;
    --yt-card-bg2: #16202f;
    --yt-card-surface: rgba(255,255,255,0.04);
    --yt-card-border: rgba(255,255,255,0.07);
    --yt-card-border-inner: rgba(255,255,255,0.06);
    --yt-text-primary: #ffffff;
    --yt-text-secondary: #8b97a7;
    --yt-text-muted: #4b5563;
    --yt-accent-blue: #60a5fa;
    --yt-accent-purple: #a78bfa;
    --yt-accent-pink: #f472b6;
    --yt-accent-green: #34d399;
  }

  .card {
    border-radius: 16px;
    overflow: hidden;
    background: linear-gradient(145deg, var(--yt-card-bg) 0%, var(--yt-card-bg2) 100%);
    box-shadow: 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
    border: 1px solid var(--yt-card-border);
    font-family: var(--paper-font-body1_-_font-family, 'Roboto', sans-serif);
    color: var(--yt-text-primary);
  }

  /* Header */
  .header {
    padding: 16px 20px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255,255,255,0.1);
    flex-shrink: 0;
    background: rgba(255,255,255,0.08);
  }

  .avatar-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #ef4444, #f97316);
  }

  .channel-info { flex: 1; min-width: 0; }

  .channel-name {
    color: var(--yt-text-primary);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
  }

  .channel-handle {
    color: var(--yt-text-secondary);
    font-size: 11px;
    margin: 2px 0 0;
    line-height: 1;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--yt-accent-green);
    box-shadow: 0 0 6px rgba(52,211,153,0.8);
    animation: pulse 2s ease-in-out infinite;
  }
  .status-dot.unavailable { background: #6b7280; box-shadow: none; animation: none; }
  .status-dot.loading { background: #fbbf24; box-shadow: 0 0 6px rgba(251,191,36,0.6); }
  @keyframes pulse {
    0%,100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .status-label { color: var(--yt-text-secondary); font-size: 10px; }

  /* Divider */
  .divider { margin: 0 20px; height: 1px; background: var(--yt-card-border-inner); }

  /* Stats grid */
  .stats {
    padding: 16px 20px;
    display: grid;
    gap: 10px;
  }
  .stats.cols-2 { grid-template-columns: 1fr 1fr; }
  .stats.cols-3 { grid-template-columns: 1fr 1fr 1fr; }

  .stat-box {
    background: var(--yt-card-surface);
    border: 1px solid var(--yt-card-border-inner);
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stat-label-row { display: flex; align-items: center; gap: 6px; }
  .stat-icon { flex-shrink: 0; }
  .stat-label {
    color: var(--yt-text-secondary);
    font-size: 9px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .stat-value {
    color: var(--yt-text-primary);
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
    margin: 0;
  }
  .stat-delta {
    color: var(--yt-accent-green);
    font-size: 10px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .stat-delta.negative { color: #f87171; }

  /* Recent videos */
  .section-header {
    padding: 0 20px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .section-title {
    color: var(--yt-text-secondary);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .section-link {
    color: var(--yt-text-muted);
    font-size: 10px;
    text-decoration: none;
  }
  .section-link:hover { color: var(--yt-text-secondary); }

  .video-list { padding: 0 20px 4px; display: flex; flex-direction: column; gap: 2px; }

  .video-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 10px;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.15s;
  }
  .video-item:hover { background: rgba(255,255,255,0.04); }

  .video-thumb-wrap {
    position: relative;
    width: 72px;
    height: 40px;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
    background: rgba(255,255,255,0.06);
  }
  .video-thumb { width: 100%; height: 100%; object-fit: cover; }
  .video-duration {
    position: absolute;
    bottom: 2px;
    right: 3px;
    background: rgba(0,0,0,0.85);
    color: #fff;
    font-size: 8px;
    font-weight: 600;
    padding: 1px 3px;
    border-radius: 3px;
  }

  .video-info { flex: 1; min-width: 0; }
  .video-title {
    color: var(--yt-text-primary);
    font-size: 11px;
    font-weight: 500;
    line-height: 1.3;
    margin: 0 0 3px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .video-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--yt-text-secondary);
    font-size: 9px;
  }
  .video-meta-item { display: flex; align-items: center; gap: 3px; }

  /* Footer */
  .footer {
    padding: 10px 20px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .footer-updated { color: var(--yt-text-muted); font-size: 10px; }
  .footer-dots { display: flex; align-items: center; gap: 3px; }
  .footer-dot { width: 4px; height: 4px; border-radius: 50%; background: #374151; }
  .footer-dot.active { width: 12px; border-radius: 2px; background: #4b5563; }

  /* Loading / error states */
  .loading-wrap {
    padding: 24px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--yt-text-secondary);
    font-size: 12px;
  }
  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.15);
    border-top-color: var(--yt-accent-blue);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .error-wrap {
    padding: 16px 20px;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    color: #f87171;
    font-size: 11px;
    line-height: 1.4;
  }
  .error-icon { flex-shrink: 0; margin-top: 1px; }
`;

/* ─── SVGs ───────────────────────────────────────────────────────────────── */

const arrowUpSvg = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`;
const arrowDownSvg = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`;
const subscriberIconSvg = `<svg class="stat-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const viewIconSvg = `<svg class="stat-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const videoIconSvg = `<svg class="stat-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`;
const ytLogoSvg = `<svg width="32" height="23" viewBox="0 0 36 26" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="26" rx="7" fill="#FF0000"/><polygon points="14,7 14,19 25,13" fill="white"/></svg>`;
const eyeIconSvg = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const thumbIconSvg = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>`;
const errorIconSvg = `<svg class="error-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function fmt(n) {
  if (n == null || isNaN(n)) return "—";
  n = Number(n);
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

function fmtDelta(n) {
  if (n == null || isNaN(n)) return null;
  n = Number(n);
  return `${n >= 0 ? "+" : ""}${fmt(Math.abs(n))} today`;
}

function timeAgo(dateStr) {
  if (!dateStr) return "unknown";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ─── Card element ───────────────────────────────────────────────────────── */

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

class YoutubeStatsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._apiData = null;
    this._apiVideos = [];
    this._apiError = null;
    this._loading = false;
    this._lastFetch = 0;
    this._timer = null;
  }

  /* ── Config ── */
  setConfig(config) {
    if (!config.api_url && !config.entity) {
      throw new Error("Please define either api_url or entity");
    }
    this._config = config;
    if (config.api_url) {
      this._startApiMode();
    }
  }

  /* ── HA state (entity mode) ── */
  set hass(hass) {
    this._hass = hass;
    if (!this._config.api_url) {
      this._renderEntity();
    }
  }

  /* ── API mode ── */
  _startApiMode() {
    this._fetchApi();
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => this._fetchApi(), REFRESH_MS);
  }

  disconnectedCallback() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  async _fetchApi() {
    const base = this._config.api_url.replace(/\/$/, "");
    this._loading = true;
    this._apiError = null;
    this._renderApi();

    try {
      const [chRes, vidRes] = await Promise.all([
        fetch(`${base}/api/youtube/channel`),
        fetch(`${base}/api/youtube/videos`),
      ]);

      if (!chRes.ok) throw new Error(`Channel API returned ${chRes.status}`);
      if (!vidRes.ok) throw new Error(`Videos API returned ${vidRes.status}`);

      this._apiData = await chRes.json();
      const vidJson = await vidRes.json();
      this._apiVideos = vidJson.videos || [];
      this._lastFetch = Date.now();
    } catch (e) {
      this._apiError = e.message;
    } finally {
      this._loading = false;
      this._renderApi();
    }
  }

  /* ── Render: API mode ── */
  _renderApi() {
    const d = this._apiData;
    const cfg = this._config;
    const maxVideos = cfg.max_videos ?? 3;
    const videos = this._apiVideos.slice(0, maxVideos);

    const avatarHtml = d?.thumbnail
      ? `<img class="avatar" src="${d.thumbnail}" alt="${d?.name ?? ""}" />`
      : `<div class="avatar-placeholder">${ytLogoSvg}</div>`;

    const statusDotClass = this._loading ? "loading" : this._apiError ? "unavailable" : "";
    const statusLabel = this._loading ? "Fetching…" : this._apiError ? "Error" : "Live";

    let bodyHtml = "";

    if (this._loading && !d) {
      bodyHtml = `<div class="loading-wrap"><div class="spinner"></div> Loading channel data…</div>`;
    } else if (this._apiError && !d) {
      bodyHtml = `<div class="error-wrap">${errorIconSvg} ${this._apiError}</div>`;
    } else if (d) {
      bodyHtml = `
        <div class="divider"></div>
        <div class="stats cols-3">
          <div class="stat-box">
            <div class="stat-label-row">${subscriberIconSvg}<span class="stat-label">Subscribers</span></div>
            <p class="stat-value">${fmt(d.subscribers)}</p>
          </div>
          <div class="stat-box">
            <div class="stat-label-row">${viewIconSvg}<span class="stat-label">Total Views</span></div>
            <p class="stat-value">${fmt(d.totalViews)}</p>
          </div>
          <div class="stat-box">
            <div class="stat-label-row">${videoIconSvg}<span class="stat-label">Videos</span></div>
            <p class="stat-value">${fmt(d.videoCount)}</p>
          </div>
        </div>
        ${videos.length > 0 ? `
          <div class="divider"></div>
          <div class="section-header">
            <span class="section-title">Recent Uploads</span>
            <a class="section-link" href="https://www.youtube.com/${d.handle}/videos" target="_blank" rel="noopener">View all</a>
          </div>
          <div class="video-list">
            ${videos.map(v => `
              <a class="video-item" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">
                <div class="video-thumb-wrap">
                  ${v.thumbnail ? `<img class="video-thumb" src="${v.thumbnail}" alt="${v.title}" />` : ""}
                  <span class="video-duration">${v.duration}</span>
                </div>
                <div class="video-info">
                  <p class="video-title">${v.title}</p>
                  <div class="video-meta">
                    <span class="video-meta-item">${eyeIconSvg} ${fmt(v.views)}</span>
                    <span class="video-meta-item">${thumbIconSvg} ${fmt(v.likes)}</span>
                    <span>${v.timeAgo}</span>
                  </div>
                </div>
              </a>
            `).join("")}
          </div>
        ` : ""}
        <div class="footer">
          <span class="footer-updated">Updated ${this._lastFetch ? timeAgo(new Date(this._lastFetch).toISOString()) : "never"}</span>
          <div class="footer-dots">
            <div class="footer-dot"></div>
            <div class="footer-dot"></div>
            <div class="footer-dot active"></div>
          </div>
        </div>
      `;
    }

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <ha-card class="card">
        <div class="header">
          ${avatarHtml}
          <div class="channel-info">
            <p class="channel-name">${d?.name ?? cfg.channel_name ?? "YouTube Channel"}</p>
            ${(d?.handle ?? cfg.handle) ? `<p class="channel-handle">${d?.handle ?? cfg.handle}</p>` : ""}
          </div>
          <div class="status">
            <div class="status-dot ${statusDotClass}"></div>
            <span class="status-label">${statusLabel}</span>
          </div>
        </div>
        ${bodyHtml}
      </ha-card>
    `;
  }

  /* ── Render: entity mode ── */
  _renderEntity() {
    const hass = this._hass;
    const cfg = this._config;
    const stateObj = hass.states[cfg.entity];

    const available = stateObj && stateObj.state !== "unavailable";
    const attrs = stateObj ? stateObj.attributes : {};

    const channelName = cfg.channel_name || attrs.friendly_name || cfg.entity;
    const handle = cfg.handle || attrs.channel_handle || "";
    const subscribers = available ? fmt(attrs.subscriber_count) : "—";
    const views = available ? fmt(attrs.view_count) : "—";
    const subDelta = available ? attrs.subscriber_delta : null;
    const viewDelta = available ? attrs.view_delta : null;
    const showDelta = cfg.show_today_delta !== false;

    const subDeltaFmt = showDelta ? fmtDelta(subDelta) : null;
    const viewDeltaFmt = showDelta ? fmtDelta(viewDelta) : null;
    const subPos = subDelta == null || Number(subDelta) >= 0;
    const viewPos = viewDelta == null || Number(viewDelta) >= 0;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <ha-card class="card">
        <div class="header">
          <div class="avatar-placeholder">${ytLogoSvg}</div>
          <div class="channel-info">
            <p class="channel-name">${channelName}</p>
            ${handle ? `<p class="channel-handle">${handle}</p>` : ""}
          </div>
          <div class="status">
            <div class="status-dot ${available ? "" : "unavailable"}"></div>
            <span class="status-label">${available ? "Live" : "Off"}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="stats cols-2">
          <div class="stat-box">
            <div class="stat-label-row">${subscriberIconSvg}<span class="stat-label">Subscribers</span></div>
            <p class="stat-value">${subscribers}</p>
            ${subDeltaFmt ? `
              <div class="stat-delta ${subPos ? "" : "negative"}">
                ${subPos ? arrowUpSvg : arrowDownSvg} ${subDeltaFmt}
              </div>` : ""}
          </div>
          <div class="stat-box">
            <div class="stat-label-row">${viewIconSvg}<span class="stat-label">Total Views</span></div>
            <p class="stat-value">${views}</p>
            ${viewDeltaFmt ? `
              <div class="stat-delta ${viewPos ? "" : "negative"}">
                ${viewPos ? arrowUpSvg : arrowDownSvg} ${viewDeltaFmt}
              </div>` : ""}
          </div>
        </div>

        <div class="footer">
          <span class="footer-updated">Updated ${timeAgo(stateObj?.last_changed)}</span>
          <div class="footer-dots">
            <div class="footer-dot"></div>
            <div class="footer-dot"></div>
            <div class="footer-dot active"></div>
          </div>
        </div>
      </ha-card>
    `;
  }

  getCardSize() { return this._config?.api_url ? 5 : 3; }

  static getConfigElement() { return document.createElement("div"); }

  static getStubConfig() {
    return { api_url: "https://your-app.replit.app" };
  }
}

customElements.define("youtube-stats-card", YoutubeStatsCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "youtube-stats-card",
  name: "YouTube Stats Card",
  description: "Displays live YouTube channel stats and recent videos via your Replit API.",
  preview: true,
});
