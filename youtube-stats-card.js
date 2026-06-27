/**
 * YouTube Stats Card for Home Assistant
 *
 * Installation:
 * 1. Copy this file to your HA config/www/ directory
 * 2. Settings → Dashboards → Resources → Add Resource
 *    URL: /local/youtube-stats-card.js   Type: JavaScript Module
 * 3. Hard-refresh the browser (Ctrl+Shift+R)
 *
 * ── Direct mode (no server needed) ──────────────────────────────────────────
 *   type: custom:youtube-stats-card
 *   channel: "@3dpo-rick"              # YouTube handle
 *   api_key: YOUR_YOUTUBE_API_KEY      # YouTube Data API v3 key
 *   max_videos: 3                      # optional, default 3
 *
 *   Get a free API key: console.cloud.google.com
 *   → New project → Enable "YouTube Data API v3" → Credentials → API Key
 *
 * ── Server mode (Replit or self-hosted Express API) ──────────────────────────
 *   type: custom:youtube-stats-card
 *   api_url: https://your-app.replit.app
 *   max_videos: 3
 *
 * ── Entity mode (legacy HA sensor) ──────────────────────────────────────────
 *   type: custom:youtube-stats-card
 *   entity: sensor.youtube_channel
 *   channel_name: "My Channel"
 *   handle: "@mychannel"
 *   show_today_delta: true
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

  .header { padding: 16px 20px 14px; display: flex; align-items: center; gap: 12px; }

  .avatar {
    width: 40px; height: 40px; border-radius: 50%; object-fit: cover;
    border: 2px solid rgba(255,255,255,0.1); flex-shrink: 0;
    background: rgba(255,255,255,0.08);
  }
  .avatar-placeholder {
    width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #ef4444, #f97316);
  }

  .channel-info { flex: 1; min-width: 0; }
  .channel-name {
    color: var(--yt-text-primary); font-size: 13px; font-weight: 600;
    line-height: 1.2; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; margin: 0;
  }
  .channel-handle { color: var(--yt-text-secondary); font-size: 11px; margin: 2px 0 0; line-height: 1; }

  .status { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--yt-accent-green);
    box-shadow: 0 0 6px rgba(52,211,153,0.8);
    animation: pulse 2s ease-in-out infinite;
  }
  .status-dot.unavailable { background: #6b7280; box-shadow: none; animation: none; }
  .status-dot.loading { background: #fbbf24; box-shadow: 0 0 6px rgba(251,191,36,0.6); animation: pulse 1s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  .status-label { color: var(--yt-text-secondary); font-size: 10px; }

  .divider { margin: 0 20px; height: 1px; background: var(--yt-card-border-inner); }

  .stats { padding: 16px 20px; display: grid; gap: 10px; }
  .stats.cols-2 { grid-template-columns: 1fr 1fr; }
  .stats.cols-3 { grid-template-columns: 1fr 1fr 1fr; }

  .stat-box {
    background: var(--yt-card-surface); border: 1px solid var(--yt-card-border-inner);
    border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;
  }
  .stat-label-row { display: flex; align-items: center; gap: 6px; }
  .stat-icon { flex-shrink: 0; }
  .stat-label { color: var(--yt-text-secondary); font-size: 9px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; }
  .stat-value { color: var(--yt-text-primary); font-size: 20px; font-weight: 700; line-height: 1; letter-spacing: -0.02em; margin: 0; }
  .stat-delta { color: var(--yt-accent-green); font-size: 10px; font-weight: 500; display: flex; align-items: center; gap: 3px; }
  .stat-delta.negative { color: #f87171; }

  .section-header { padding: 0 20px 10px; display: flex; align-items: center; justify-content: space-between; }
  .section-title { color: var(--yt-text-secondary); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
  .section-link { color: var(--yt-text-muted); font-size: 10px; text-decoration: none; }
  .section-link:hover { color: var(--yt-text-secondary); }

  .video-list { padding: 0 20px 4px; display: flex; flex-direction: column; gap: 2px; }
  .video-item {
    display: flex; align-items: center; gap: 10px; padding: 8px 10px;
    border-radius: 10px; cursor: pointer; text-decoration: none; transition: background 0.15s;
  }
  .video-item:hover { background: rgba(255,255,255,0.04); }
  .video-thumb-wrap {
    position: relative; width: 72px; height: 40px; border-radius: 6px;
    overflow: hidden; flex-shrink: 0; background: rgba(255,255,255,0.06);
  }
  .video-thumb { width: 100%; height: 100%; object-fit: cover; }
  .video-duration {
    position: absolute; bottom: 2px; right: 3px; background: rgba(0,0,0,0.85);
    color: #fff; font-size: 8px; font-weight: 600; padding: 1px 3px; border-radius: 3px;
  }
  .video-info { flex: 1; min-width: 0; }
  .video-title {
    color: var(--yt-text-primary); font-size: 11px; font-weight: 500; line-height: 1.3;
    margin: 0 0 3px; display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .video-meta { display: flex; align-items: center; gap: 8px; color: var(--yt-text-secondary); font-size: 9px; }
  .video-meta-item { display: flex; align-items: center; gap: 3px; }

  .footer { padding: 10px 20px 14px; display: flex; align-items: center; justify-content: space-between; }
  .footer-updated { color: var(--yt-text-muted); font-size: 10px; }
  .footer-dots { display: flex; align-items: center; gap: 3px; }
  .footer-dot { width: 4px; height: 4px; border-radius: 50%; background: #374151; }
  .footer-dot.active { width: 12px; border-radius: 2px; background: #4b5563; }

  .loading-wrap {
    padding: 24px 20px; display: flex; align-items: center;
    justify-content: center; gap: 10px; color: var(--yt-text-secondary); font-size: 12px;
  }
  .spinner {
    width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.15);
    border-top-color: var(--yt-accent-blue); border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .error-wrap {
    padding: 16px 20px; display: flex; align-items: flex-start;
    gap: 8px; color: #f87171; font-size: 11px; line-height: 1.4;
  }
  .error-icon { flex-shrink: 0; margin-top: 1px; }
`;

/* ─── SVGs ───────────────────────────────────────────────────────────────── */

const arrowUpSvg   = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`;
const arrowDownSvg = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`;
const subIconSvg   = `<svg class="stat-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const viewIconSvg  = `<svg class="stat-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const vidIconSvg   = `<svg class="stat-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;
const ytLogoSvg    = `<svg width="32" height="23" viewBox="0 0 36 26" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="26" rx="7" fill="#FF0000"/><polygon points="14,7 14,19 25,13" fill="white"/></svg>`;
const eyeSvg       = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const thumbSvg     = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>`;
const errIconSvg   = `<svg class="error-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

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

function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "?";
  const h = parseInt(m[1] || "0"), min = parseInt(m[2] || "0"), s = parseInt(m[3] || "0");
  return h > 0
    ? `${h}:${String(min).padStart(2,"0")}:${String(s).padStart(2,"0")}`
    : `${min}:${String(s).padStart(2,"0")}`;
}

/* ─── YouTube Data API v3 (direct, no server) ────────────────────────────── */

const YT = "https://www.googleapis.com/youtube/v3";

async function ytGet(path, key) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`${YT}${path}${sep}key=${encodeURIComponent(key)}`);
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j?.error?.message || `HTTP ${r.status}`);
  }
  return r.json();
}

async function fetchDirect(handle, key, maxVideos) {
  // 1. Resolve handle → channel
  const chRes = await ytGet(
    `/channels?part=snippet,statistics&forHandle=${encodeURIComponent(handle)}`, key
  );
  const ch = chRes?.items?.[0];
  if (!ch) throw new Error(`Channel "${handle}" not found`);

  const stats   = ch.statistics ?? {};
  const snippet = ch.snippet ?? {};
  const channel = {
    id:          ch.id,
    name:        snippet.title ?? "",
    handle,
    thumbnail:   snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url ?? "",
    subscribers: parseInt(stats.subscriberCount ?? "0", 10),
    totalViews:  parseInt(stats.viewCount        ?? "0", 10),
    videoCount:  parseInt(stats.videoCount       ?? "0", 10),
  };

  // 2. Fetch recent video IDs
  const searchRes = await ytGet(
    `/search?part=snippet&channelId=${ch.id}&order=date&type=video&maxResults=${maxVideos}`, key
  );
  const ids = (searchRes?.items ?? []).map(i => i?.id?.videoId).filter(Boolean);

  let videos = [];
  if (ids.length) {
    // 3. Fetch full video details
    const detailRes = await ytGet(
      `/videos?part=snippet,statistics,contentDetails&id=${ids.join(",")}`, key
    );
    const diffDays = d => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    const ago = d => {
      const n = diffDays(d);
      if (n === 0) return "Today";
      if (n === 1) return "Yesterday";
      if (n < 7)  return `${n} days ago`;
      if (n < 14) return "1 week ago";
      if (n < 30) return `${Math.floor(n/7)} weeks ago`;
      if (n < 60) return "1 month ago";
      return `${Math.floor(n/30)} months ago`;
    };
    videos = (detailRes?.items ?? []).map(v => ({
      id:          v.id,
      title:       v.snippet?.title ?? "",
      thumbnail:   v.snippet?.thumbnails?.medium?.url ?? "",
      views:       parseInt(v.statistics?.viewCount  ?? "0", 10),
      likes:       parseInt(v.statistics?.likeCount  ?? "0", 10),
      duration:    parseDuration(v.contentDetails?.duration ?? ""),
      publishedAt: v.snippet?.publishedAt ?? "",
      timeAgo:     ago(v.snippet?.publishedAt ?? ""),
    }));
  }

  return { channel, videos };
}

/* ─── Card ───────────────────────────────────────────────────────────────── */

const REFRESH_MS = 5 * 60 * 1000;

class YoutubeStatsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._data    = null;   // { channel, videos }
    this._error   = null;
    this._loading = false;
    this._fetched = 0;
    this._timer   = null;
  }

  setConfig(config) {
    const hasDirect = config.api_key && config.channel;
    const hasServer = !!config.api_url;
    const hasEntity = !!config.entity;
    if (!hasDirect && !hasServer && !hasEntity) {
      throw new Error(
        "Provide one of: (channel + api_key) for direct mode, api_url for server mode, or entity for sensor mode."
      );
    }
    this._config = config;
    if (hasDirect || hasServer) this._startFetch();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._config && !this._config.api_key && !this._config.api_url) {
      this._renderEntity();
    }
  }

  disconnectedCallback() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  _startFetch() {
    this._fetch();
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => this._fetch(), REFRESH_MS);
  }

  async _fetch() {
    const cfg = this._config;
    this._loading = true;
    this._error   = null;
    this._renderRemote();

    try {
      if (cfg.api_key) {
        // Direct mode — call YouTube Data API from the browser
        const maxVideos = cfg.max_videos ?? 3;
        this._data = await fetchDirect(cfg.channel, cfg.api_key, maxVideos);
      } else {
        // Server mode — call the Replit (or self-hosted) proxy API
        const base = cfg.api_url.replace(/\/$/, "");
        const maxVideos = cfg.max_videos ?? 3;
        const [chRes, vidRes] = await Promise.all([
          fetch(`${base}/api/youtube/channel`),
          fetch(`${base}/api/youtube/videos`),
        ]);
        if (!chRes.ok)  throw new Error(`Channel API returned ${chRes.status}`);
        if (!vidRes.ok) throw new Error(`Videos API returned ${vidRes.status}`);
        const channel = await chRes.json();
        const { videos: allVids } = await vidRes.json();
        this._data = { channel, videos: (allVids ?? []).slice(0, maxVideos) };
      }
      this._fetched = Date.now();
    } catch (e) {
      this._error = e.message;
    } finally {
      this._loading = false;
      this._renderRemote();
    }
  }

  /* ── Shared remote render (direct + server modes) ── */
  _renderRemote() {
    const { channel: ch, videos = [] } = this._data ?? {};
    const cfg = this._config;

    const avatarHtml = ch?.thumbnail
      ? `<img class="avatar" src="${ch.thumbnail}" alt="${ch?.name ?? ""}" />`
      : `<div class="avatar-placeholder">${ytLogoSvg}</div>`;

    const dotClass   = this._loading ? "loading" : this._error ? "unavailable" : "";
    const statusText = this._loading ? "Fetching…" : this._error ? "Error" : "Live";

    let body = "";
    if (this._loading && !ch) {
      body = `<div class="loading-wrap"><div class="spinner"></div> Loading channel data…</div>`;
    } else if (this._error && !ch) {
      body = `<div class="error-wrap">${errIconSvg} ${this._error}</div>`;
    } else if (ch) {
      const channelUrl = `https://www.youtube.com/${ch.handle ?? cfg.channel ?? ""}`;
      body = `
        <div class="divider"></div>
        <div class="stats cols-3">
          <div class="stat-box">
            <div class="stat-label-row">${subIconSvg}<span class="stat-label">Subscribers</span></div>
            <p class="stat-value">${fmt(ch.subscribers)}</p>
          </div>
          <div class="stat-box">
            <div class="stat-label-row">${viewIconSvg}<span class="stat-label">Total Views</span></div>
            <p class="stat-value">${fmt(ch.totalViews)}</p>
          </div>
          <div class="stat-box">
            <div class="stat-label-row">${vidIconSvg}<span class="stat-label">Videos</span></div>
            <p class="stat-value">${fmt(ch.videoCount)}</p>
          </div>
        </div>
        ${videos.length > 0 ? `
          <div class="divider"></div>
          <div class="section-header">
            <span class="section-title">Recent Uploads</span>
            <a class="section-link" href="${channelUrl}/videos" target="_blank" rel="noopener">View all</a>
          </div>
          <div class="video-list">
            ${videos.map(v => `
              <a class="video-item" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">
                <div class="video-thumb-wrap">
                  ${v.thumbnail ? `<img class="video-thumb" src="${v.thumbnail}" alt="" />` : ""}
                  <span class="video-duration">${v.duration}</span>
                </div>
                <div class="video-info">
                  <p class="video-title">${v.title}</p>
                  <div class="video-meta">
                    <span class="video-meta-item">${eyeSvg} ${fmt(v.views)}</span>
                    <span class="video-meta-item">${thumbSvg} ${fmt(v.likes)}</span>
                    <span>${v.timeAgo}</span>
                  </div>
                </div>
              </a>`).join("")}
          </div>` : ""}
        <div class="footer">
          <span class="footer-updated">Updated ${this._fetched ? timeAgo(new Date(this._fetched).toISOString()) : "never"}</span>
          <div class="footer-dots">
            <div class="footer-dot"></div><div class="footer-dot"></div>
            <div class="footer-dot active"></div>
          </div>
        </div>`;
    }

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <ha-card class="card">
        <div class="header">
          ${avatarHtml}
          <div class="channel-info">
            <p class="channel-name">${ch?.name ?? cfg.channel_name ?? cfg.channel ?? "YouTube Channel"}</p>
            ${(ch?.handle ?? cfg.handle ?? cfg.channel) ? `<p class="channel-handle">${ch?.handle ?? cfg.handle ?? cfg.channel}</p>` : ""}
          </div>
          <div class="status">
            <div class="status-dot ${dotClass}"></div>
            <span class="status-label">${statusText}</span>
          </div>
        </div>
        ${body}
      </ha-card>`;
  }

  /* ── Entity mode render ── */
  _renderEntity() {
    const hass = this._hass;
    const cfg  = this._config;
    if (!hass || !cfg) return;

    const stateObj = hass.states[cfg.entity];
    const available = stateObj && stateObj.state !== "unavailable";
    const attrs = stateObj?.attributes ?? {};

    const name      = cfg.channel_name || attrs.friendly_name || cfg.entity;
    const handle    = cfg.handle || attrs.channel_handle || "";
    const subs      = available ? fmt(attrs.subscriber_count) : "—";
    const views     = available ? fmt(attrs.view_count)       : "—";
    const showDelta = cfg.show_today_delta !== false;
    const subDelta  = showDelta ? fmtDelta(available ? attrs.subscriber_delta : null) : null;
    const viewDelta = showDelta ? fmtDelta(available ? attrs.view_delta       : null) : null;
    const subPos    = (attrs.subscriber_delta ?? 0) >= 0;
    const viewPos   = (attrs.view_delta       ?? 0) >= 0;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <ha-card class="card">
        <div class="header">
          <div class="avatar-placeholder">${ytLogoSvg}</div>
          <div class="channel-info">
            <p class="channel-name">${name}</p>
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
            <div class="stat-label-row">${subIconSvg}<span class="stat-label">Subscribers</span></div>
            <p class="stat-value">${subs}</p>
            ${subDelta ? `<div class="stat-delta ${subPos ? "" : "negative"}">${subPos ? arrowUpSvg : arrowDownSvg} ${subDelta}</div>` : ""}
          </div>
          <div class="stat-box">
            <div class="stat-label-row">${viewIconSvg}<span class="stat-label">Total Views</span></div>
            <p class="stat-value">${views}</p>
            ${viewDelta ? `<div class="stat-delta ${viewPos ? "" : "negative"}">${viewPos ? arrowUpSvg : arrowDownSvg} ${viewDelta}</div>` : ""}
          </div>
        </div>
        <div class="footer">
          <span class="footer-updated">Updated ${timeAgo(stateObj?.last_changed)}</span>
          <div class="footer-dots">
            <div class="footer-dot"></div><div class="footer-dot"></div>
            <div class="footer-dot active"></div>
          </div>
        </div>
      </ha-card>`;
  }

  getCardSize() { return this._config?.entity ? 3 : 5; }
  static getConfigElement() { return document.createElement("div"); }
  static getStubConfig() {
    return { channel: "@3dpo-rick", api_key: "YOUR_YOUTUBE_API_KEY" };
  }
}

customElements.define("youtube-stats-card", YoutubeStatsCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "youtube-stats-card",
  name: "YouTube Stats Card",
  description: "Live YouTube channel stats and recent videos. Works directly with a YouTube API key — no server required.",
  preview: true,
});
