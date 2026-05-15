// ============================================================
//  AI Chat - 仿智能手机应用 v3.6
//  主界面 + iOS系统设置 + 聊天设置(三点菜单) + 主题 + API + 模型自拉取
//  + 全部应用页面 + 图标自定义图片上传 + 恢复默认图标
// ============================================================

const $ = id => document.getElementById(id);

// ===== Canvas roundRect polyfill (for older browsers) =====
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
        this.beginPath();
        this.moveTo(x + r.tl, y);
        this.lineTo(x + w - r.tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
        this.lineTo(x + w, y + h - r.br);
        this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
        this.lineTo(x + r.bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
        this.lineTo(x, y + r.tl);
        this.quadraticCurveTo(x, y, x + r.tl, y);
        this.closePath();
        return this;
    };
}
const pageContainer = $('pageContainer');
const pageHome = $('pageHome');
const pageChat = $('pageChat');
const pageTheme = $('pageTheme');
const pageSettings = $('pageSettings');
const pageChatSettings = $('pageChatSettings');
const pagePhotos = $('pagePhotos');
const pageMusic = $('pageMusic');
const pageSafari = $('pageSafari');
const pageWeather = $('pageWeather');
const pageNotes = $('pageNotes');
const pageClock = $('pageClock');
const messagesArea = $('messagesArea');
const messageInput = $('messageInput');
const sendBtn = $('sendBtn');
const toast = $('toast');

// ===== 壁纸渐变预设 =====
const WALLPAPERS = {
    gradient1: '#ffffff',
    gradient2: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    gradient3: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    gradient4: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradient5: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    gradient6: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    gradient7: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    gradient8: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    gradient9: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    gradient10: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
};
const DEFAULT_WALLPAPER = 'gradient1';
const DEFAULT_CUSTOM_COLOR = '#e8e8ea';

// ===== 默认图标颜色（供恢复使用） =====
const DEFAULT_ICON_COLORS = {
    chat: { c1: '#667eea', c2: '#764ba2' },
    settings: { c1: '#8e8e93', c2: '#636366' },
    theme: { c1: '#af52de', c2: '#5e5ce6' },
    photos: { c1: '#ff9500', c2: '#ffcc00' },
    music: { c1: '#ff2d55', c2: '#ff6b81' },
    safari: { c1: '#34c759', c2: '#30d158' },
    notes: { c1: '#ffd60a', c2: '#ffb800' },
    weather: { c1: '#5ac8fa', c2: '#007aff' },
    clock: { c1: '#1c1c1e', c2: '#2c2c2e' }
};

// ===== 状态 =====
const STATE = {
    messages: [],
    isProcessing: false,
    settings: {
        apiEndpoint: localStorage.getItem('ai_endpoint') || 'https://api.openai.com/v1',
        apiKey: localStorage.getItem('ai_api_key') || '',
        model: localStorage.getItem('ai_model') || 'gpt-4o-mini',
        customModel: localStorage.getItem('ai_custom_model') || '',
        systemPrompt: localStorage.getItem('ai_system') || '你是一个乐于助人的AI助手。请用中文回答用户的问题，回答要详细、准确、有条理。',
        temperature: parseFloat(localStorage.getItem('ai_temp')) || 0.7,
        maxTokens: parseInt(localStorage.getItem('ai_tokens')) || 2048,
        avatarC1: localStorage.getItem('ai_avatar_c1') || '#667eea',
        avatarC2: localStorage.getItem('ai_avatar_c2') || '#764ba2',
        avatarImage: localStorage.getItem('ai_avatar_img') || '',
        userAvatarC1: localStorage.getItem('user_avatar_c1') || '#007aff',
        userAvatarC2: localStorage.getItem('user_avatar_c2') || '#5856d6',
        userAvatarImage: localStorage.getItem('user_avatar_img') || '',
        userPrompt: localStorage.getItem('user_prompt') || '',
        theme: {
            wallpaper: localStorage.getItem('theme_wallpaper') || 'gradient1',
            wallpaperImage: localStorage.getItem('theme_wallpaper_img') || '',
            customColorHex: localStorage.getItem('theme_custom_color') || '#e8e8ea',
            iconShape: localStorage.getItem('theme_icon_shape') || 'rounded',
            iconSize: parseInt(localStorage.getItem('theme_icon_size')) || 58,
            iconImages: JSON.parse(localStorage.getItem('theme_icon_images') || '{}')
        }
    }
};

// ===== 工具 =====
function getTime() {
    const n = new Date();
    return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

function getDateStr() {
    const n = new Date();
    const week = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
    return `${n.getFullYear()}年${n.getMonth()+1}月${n.getDate()}日 ${week[n.getDay()]}`;
}

function scrollBottom() {
    requestAnimationFrame(() => { messagesArea.scrollTop = messagesArea.scrollHeight; });
}

function showToast(msg, dur = 2000) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), dur);
}

// ===== 主界面时钟 =====
function updateHomeClock() {
    const t = $('homeTime');
    const d = $('homeDate');
    if (t) t.textContent = getTime();
    if (d) d.textContent = getDateStr();
}
updateHomeClock();
setInterval(updateHomeClock, 1000);

// 状态栏时钟
function updateStatusClock() {
    const el = document.querySelector('.status-time');
    if (el) el.textContent = getTime();
}
updateStatusClock();
setInterval(updateStatusClock, 30000);

// ===== 页面导航 =====
let currentApp = null;
let appStack = []; // 支持从聊天页面进入聊天设置页

function openApp(appId, page) {
    const targetPage = page || pageMap[appId];
    if (!targetPage) return;
    currentApp = appId;
    appStack.push(appId);
    targetPage.classList.add('active');
}

function closeApp() {
    if (!currentApp) return;
    const page = pageMap[currentApp];
    if (page) page.classList.remove('active');
    currentApp = null;
    appStack = [];
    closeEmojiPanel();
}

function goBackToChat() {
    // 从聊天设置返回到聊天（不关闭聊天页面）
    const page = pageMap['chatSettings'];
    if (page) page.classList.remove('active');
    currentApp = 'chat';
    appStack = appStack.filter(a => a !== 'chatSettings');
}

const pageMap = { chat: pageChat, settings: pageSettings, theme: pageTheme, chatSettings: pageChatSettings, photos: pagePhotos, music: pageMusic, safari: pageSafari, weather: pageWeather, notes: pageNotes, clock: pageClock };

// 主界面应用图标点击
document.querySelectorAll('.app-icon[data-app]').forEach(icon => {
    icon.addEventListener('click', () => {
        const app = icon.dataset.app;
        if (app === 'chat') { openApp('chat'); setTimeout(() => messageInput.focus(), 400); }
        else if (app === 'settings') { openApp('settings'); }
        else if (app === 'theme') { loadThemeUI(); openApp('theme'); }
        else if (pageMap[app]) { openApp(app); }
        else showToast(`${icon.querySelector('.app-icon-name').textContent} (演示)`, 1200);
    });
});

// 返回按钮
$('closeChat').addEventListener('click', closeApp);
$('backSettings').addEventListener('click', closeApp);
$('backTheme').addEventListener('click', closeApp);
$('backChatSettings').addEventListener('click', goBackToChat);
$('backPhotos').addEventListener('click', closeApp);
$('backMusic').addEventListener('click', closeApp);
$('backSafari').addEventListener('click', closeApp);
$('backWeather').addEventListener('click', closeApp);
$('backNotes').addEventListener('click', closeApp);
$('backClock').addEventListener('click', closeApp);
// Home Indicator 点击返回主屏（模拟 iPhone 底部退出键）
const homeIndicator = document.querySelector('.home-indicator');
if (homeIndicator) {
    homeIndicator.addEventListener('click', () => {
        if (currentApp) closeApp();
    });
    homeIndicator.style.cursor = 'pointer';
}

// 聊天三点菜单 → 聊天设置
$('chatSettingsBtn').addEventListener('click', () => {
    loadSettingsUI();
    openApp('chatSettings', pageChatSettings);
});

// 收藏按钮 → 打开收藏面板
const favBtn = $('favoritesBtn');
if (favBtn) {
    favBtn.addEventListener('click', () => {
        const panel = document.getElementById('favoritesPanel');
        if (panel && panel.classList.contains('show')) {
            hideFavoritesPanel();
        } else {
            showFavoritesPanel();
        }
    });
}

// ===== 用户头像系统 =====
function applyUserAvatar() {
    const { userAvatarC1, userAvatarC2, userAvatarImage } = STATE.settings;

    const preview = $('userAvatarPreview');
    if (preview) {
        if (userAvatarImage) {
            preview.innerHTML = `<img src="${userAvatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        } else {
            preview.innerHTML = `<svg viewBox="0 0 40 40" width="56" height="56">
                <defs><linearGradient id="uavP" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${userAvatarC1}"/><stop offset="100%" style="stop-color:${userAvatarC2}"/></linearGradient></defs>
                <circle cx="20" cy="20" r="20" fill="url(#uavP)"/>
                <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="Arial">我</text>
            </svg>`;
        }
    }

    document.querySelectorAll('.message-avatar.user-avatar').forEach(el => {
        const hasSvg = el.querySelector('svg');
        const hasImg = el.querySelector('img');
        if (hasSvg || hasImg || el.textContent === '我') {
            if (userAvatarImage) {
                el.innerHTML = `<img src="${userAvatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            } else {
                el.innerHTML = `<svg viewBox="0 0 40 40" width="32" height="32">
                    <defs><linearGradient id="uavM" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${userAvatarC1}"/><stop offset="100%" style="stop-color:${userAvatarC2}"/></linearGradient></defs>
                    <circle cx="20" cy="20" r="20" fill="url(#uavM)"/>
                    <text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">我</text>
                </svg>`;
            }
        }
    });

    document.querySelectorAll('.uav-color').forEach(el => {
        el.classList.toggle('active', el.dataset.c1 === userAvatarC1 && el.dataset.c2 === userAvatarC2);
    });
}

// 用户颜色选择
document.querySelectorAll('.uav-color').forEach(el => {
    el.addEventListener('click', () => {
        STATE.settings.userAvatarC1 = el.dataset.c1;
        STATE.settings.userAvatarC2 = el.dataset.c2;
        STATE.settings.userAvatarImage = '';
        localStorage.setItem('user_avatar_c1', STATE.settings.userAvatarC1);
        localStorage.setItem('user_avatar_c2', STATE.settings.userAvatarC2);
        localStorage.setItem('user_avatar_img', '');
        applyUserAvatar();
    });
});

// 用户图片上传
$('uploadUserAvatarBtn').addEventListener('click', () => $('userAvatarFileInput').click());
$('userAvatarFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        STATE.settings.userAvatarImage = ev.target.result;
        STATE.settings.userAvatarC1 = '#007aff';
        STATE.settings.userAvatarC2 = '#5856d6';
        localStorage.setItem('user_avatar_img', STATE.settings.userAvatarImage);
        localStorage.setItem('user_avatar_c1', '#007aff');
        localStorage.setItem('user_avatar_c2', '#5856d6');
        applyUserAvatar();
        showToast('用户头像已更新');
    };
    reader.readAsDataURL(file);
});

// ===== AI 头像系统 =====
function applyAvatar() {
    const { avatarC1, avatarC2, avatarImage } = STATE.settings;
    const headerAv = $('chatHeaderAvatar');
    if (headerAv) {
        if (avatarImage) {
            headerAv.innerHTML = `<img src="${avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        } else {
            headerAv.innerHTML = `<svg viewBox="0 0 40 40" width="34" height="34">
                <defs><linearGradient id="aiH" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${avatarC1}"/><stop offset="100%" style="stop-color:${avatarC2}"/></linearGradient></defs>
                <circle cx="20" cy="20" r="20" fill="url(#aiH)"/>
                <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="Arial">AI</text>
            </svg>`;
        }
        if (!headerAv.querySelector('.online-dot')) {
            const dot = document.createElement('span');
            dot.className = 'online-dot';
            headerAv.appendChild(dot);
        }
    }

    document.querySelectorAll('.message-avatar').forEach(el => {
        const svg = el.querySelector('svg');
        if (svg) {
            const txt = svg.querySelector('text');
            if (txt && txt.textContent === 'AI') {
                if (avatarImage) {
                    el.innerHTML = `<img src="${avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
                } else {
                    el.innerHTML = `<svg viewBox="0 0 40 40" width="32" height="32">
                        <defs><linearGradient id="aiM" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${avatarC1}"/><stop offset="100%" style="stop-color:${avatarC2}"/></linearGradient></defs>
                        <circle cx="20" cy="20" r="20" fill="url(#aiM)"/>
                        <text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">AI</text>
                    </svg>`;
                }
            }
        }
    });

    const preview = $('avatarPreview');
    if (preview) {
        if (avatarImage) {
            preview.innerHTML = `<img src="${avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        } else {
            preview.innerHTML = `<svg viewBox="0 0 40 40" width="56" height="56">
                <defs><linearGradient id="avP" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${avatarC1}"/><stop offset="100%" style="stop-color:${avatarC2}"/></linearGradient></defs>
                <circle cx="20" cy="20" r="20" fill="url(#avP)"/>
                <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="Arial">AI</text>
            </svg>`;
        }
    }

    document.querySelectorAll('.av-color').forEach(el => {
        el.classList.toggle('active', el.dataset.c1 === avatarC1 && el.dataset.c2 === avatarC2);
    });
}

// AI 颜色选择
document.querySelectorAll('.av-color').forEach(el => {
    el.addEventListener('click', () => {
        STATE.settings.avatarC1 = el.dataset.c1;
        STATE.settings.avatarC2 = el.dataset.c2;
        STATE.settings.avatarImage = '';
        localStorage.setItem('ai_avatar_c1', STATE.settings.avatarC1);
        localStorage.setItem('ai_avatar_c2', STATE.settings.avatarC2);
        localStorage.setItem('ai_avatar_img', '');
        applyAvatar();
    });
});

// AI 图片上传
$('uploadAvatarBtn').addEventListener('click', () => $('avatarFileInput').click());
$('avatarFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        STATE.settings.avatarImage = ev.target.result;
        STATE.settings.avatarC1 = '#667eea';
        STATE.settings.avatarC2 = '#764ba2';
        localStorage.setItem('ai_avatar_img', STATE.settings.avatarImage);
        localStorage.setItem('ai_avatar_c1', '#667eea');
        localStorage.setItem('ai_avatar_c2', '#764ba2');
        applyAvatar();
        showToast('AI 头像已更新');
    };
    reader.readAsDataURL(file);
});

// ===== Markdown =====
function renderMD(text) {
    let h = text.replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>');
    h = h.replace(/```(\w*)\n([\s\S]*?)```/g, (_,l,c) => `<pre><code${l?' class="language-'+l+'"':''}>${esc(c.trim())}</code></pre>`);
    h = h.replace(/`([^`]+)`/g,'<code>$1</code>');
    h = h.replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h2>$1</h2>').replace(/^# (.+)$/gm,'<h1>$1</h1>');
    h = h.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    h = h.replace(/\*(.+?)\*/g,'<em>$1</em>');
    h = h.replace(/^> (.+)$/gm,'<blockquote>$1</blockquote>');
    h = h.replace(/^- (.+)$/gm,'<li>$1</li>');
    h = h.replace(/(<li>.*<\/li>\n?)+/g,'<ul>$&</ul>');
    h = h.replace(/^\d+\. (.+)$/gm,'<li>$1</li>');
    h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank">$1</a>');
    const ps = h.split('\n\n').filter(p=>p.trim());
    if (ps.length>1) {
        h = ps.map(p=>{const t=p.trim();if(t.startsWith('<h')||t.startsWith('<pre')||t.startsWith('<ul')||t.startsWith('<blockquote'))return t;return `<p>${t.replace(/\n/g,'<br>')}</p>`;}).join('\n');
    } else { h = h.replace(/\n/g,'<br>'); }
    return h;
}
function esc(t){return t.replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>');}

// ===== 消息 =====
function addMsg(content, role) {
    const m = { id: Date.now().toString(36)+Math.random().toString(36).substr(2,5), content, role, time: getTime() };
    STATE.messages.push(m);
    renderMsg(m);
    scrollBottom();
    return m;
}

function renderMsg(msg) {
    const { avatarC1, avatarC2, avatarImage, userAvatarC1, userAvatarC2, userAvatarImage } = STATE.settings;
    const d = document.createElement('div');
    d.className = `message ${msg.role}`;
    d.dataset.id = msg.id;

    if (msg.role === 'ai') {
        const a = document.createElement('div');
        a.className = 'message-avatar';
        if (avatarImage) {
            a.innerHTML = `<img src="${avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        } else {
            a.innerHTML = `<svg viewBox="0 0 40 40" width="32" height="32"><defs><linearGradient id="am_${msg.id.slice(0,6)}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${avatarC1}"/><stop offset="100%" style="stop-color:${avatarC2}"/></linearGradient></defs><circle cx="20" cy="20" r="20" fill="url(#am_${msg.id.slice(0,6)})"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">AI</text></svg>`;
        }
        d.appendChild(a);
    }

    const cd = document.createElement('div');
    cd.className = 'message-content';
    const b = document.createElement('div');
    b.className = `message-bubble ${msg.role}`;
    b.innerHTML = msg.role === 'ai' ? renderMD(msg.content) : esc(msg.content);
    cd.appendChild(b);

    if (msg.role === 'user') {
        const a = document.createElement('div');
        a.className = 'message-avatar user-avatar';
        if (userAvatarImage) {
            a.innerHTML = `<img src="${userAvatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        } else {
            a.innerHTML = `<svg viewBox="0 0 40 40" width="32" height="32"><defs><linearGradient id="um_${msg.id.slice(0,6)}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${userAvatarC1}"/><stop offset="100%" style="stop-color:${userAvatarC2}"/></linearGradient></defs><circle cx="20" cy="20" r="20" fill="url(#um_${msg.id.slice(0,6)})"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">我</text></svg>`;
        }
        d.appendChild(a);
        d.appendChild(cd);
    } else { d.appendChild(cd); }

    const ts = document.createElement('span');
    ts.className = 'message-time';
    ts.textContent = msg.time;
    cd.appendChild(ts);
    messagesArea.appendChild(d);
}

// ===== 打字指示器 =====
function showTyping() {
    const ind = document.createElement('div');
    ind.className = 'typing-indicator';
    ind.id = 'typingInd';
    const { avatarC1, avatarC2, avatarImage } = STATE.settings;
    let avHtml;
    if (avatarImage) {
        avHtml = `<img src="${avatarImage}" style="width:32px;height:32px;object-fit:cover;border-radius:50%">`;
    } else {
        avHtml = `<svg viewBox="0 0 40 40" width="32" height="32"><defs><linearGradient id="aty" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${avatarC1}"/><stop offset="100%" style="stop-color:${avatarC2}"/></linearGradient></defs><circle cx="20" cy="20" r="20" fill="url(#aty)"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">AI</text></svg>`;
    }
    ind.innerHTML = `<div class="message-avatar">${avHtml}</div><div class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
    messagesArea.appendChild(ind);
    scrollBottom();
}
function hideTyping() { const i=$('typingInd'); if(i) i.remove(); }

// ===== 模型自拉取 =====
async function fetchModels() {
    const { apiEndpoint, apiKey } = STATE.settings;
    if (!apiKey) { showToast('请先填写 API Key'); return; }

    const btn = $('fetchModelsBtn');
    btn.textContent = '拉取中...';
    btn.disabled = true;

    try {
        let ep = apiEndpoint.replace(/\/+$/,'');
        if (!ep.endsWith('/models')) ep += '/models';
        const res = await fetch(ep, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) {
            let e = `拉取失败 (${res.status})`;
            try { const d = await res.json(); if (d.error?.message) e = d.error.message; } catch(ee) {}
            throw new Error(e);
        }
        const data = await res.json();
        const models = data.data || data.models || [];
        if (models.length === 0) { showToast('未找到可用模型'); return; }

        const modelIds = models.map(m => m.id || m.name || m).sort();

        const select = $('modelSelect');
        select.innerHTML = '';
        modelIds.forEach(id => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = id;
            if (id === STATE.settings.model) opt.selected = true;
            select.appendChild(opt);
        });
        const customOpt = document.createElement('option');
        customOpt.value = 'custom';
        customOpt.textContent = '自定义模型';
        select.appendChild(customOpt);

        if (!modelIds.includes(STATE.settings.model)) {
            select.value = modelIds[0];
        }

        showToast(`已拉取 ${modelIds.length} 个模型`);
    } catch (error) {
        showToast(error.message || '拉取失败', 3000);
    } finally {
        btn.textContent = '拉取模型';
        btn.disabled = false;
    }
}

$('fetchModelsBtn').addEventListener('click', fetchModels);

// ===== API =====
async function callAI(messages) {
    const { apiEndpoint, apiKey, model, customModel, systemPrompt, userPrompt, temperature, maxTokens } = STATE.settings;
    if (!apiKey) throw new Error('请先在设置中配置 API Key');
    let ep = apiEndpoint.replace(/\/+$/,'');
    if (!ep.endsWith('/chat/completions')) ep += '/chat/completions';
    let mn = model;
    if (model === 'custom' && customModel) mn = customModel;

    const msgs = [];
    let sysContent = systemPrompt;
    if (userPrompt) {
        sysContent += `\n\n以下是关于用户的信息，请在对话中参考：\n${userPrompt}`;
    }
    msgs.push({ role:'system', content:sysContent });
    messages.forEach(m => msgs.push({ role: m.role==='ai'?'assistant':'user', content:m.content }));

    const res = await fetch(ep, {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
        body:JSON.stringify({ model:mn, messages:msgs, temperature, max_tokens:maxTokens, stream:true })
    });
    if (!res.ok) {
        let e=`请求失败 (${res.status})`;
        try{const d=await res.json();if(d.error?.message)e=d.error.message;}catch(ee){}
        throw new Error(e);
    }
    return res;
}

async function handleSend() {
    const text = messageInput.value.trim();
    if (!text || STATE.isProcessing) return;
    closeEmojiPanel();
    addMsg(text, 'user');
    messageInput.value = '';
    updateBtn();
    STATE.isProcessing = true;
    showTyping();
    try {
        const response = await callAI(STATE.messages.map(m=>({role:m.role,content:m.content})));
        hideTyping();
        const mid = Date.now().toString(36)+Math.random().toString(36).substr(2,5);
        const aiMsg = { id:mid, content:'', role:'ai', time:getTime() };
        const { avatarC1, avatarC2, avatarImage } = STATE.settings;
        let avHtml;
        if (avatarImage) {
            avHtml = `<img src="${avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        } else {
            avHtml = `<svg viewBox="0 0 40 40" width="32" height="32"><defs><linearGradient id="ast" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${avatarC1}"/><stop offset="100%" style="stop-color:${avatarC2}"/></linearGradient></defs><circle cx="20" cy="20" r="20" fill="url(#ast)"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">AI</text></svg>`;
        }
        const div = document.createElement('div');
        div.className = 'message ai';
        div.dataset.id = mid;
        div.innerHTML = `<div class="message-avatar">${avHtml}</div><div class="message-content"><div class="message-bubble ai" id="sb_${mid}"></div><span class="message-time">${aiMsg.time}</span></div>`;
        messagesArea.appendChild(div);
        scrollBottom();

        const bubble = document.getElementById(`sb_${mid}`);
        let full = '';
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() || '';
            for (const line of lines) {
                const t = line.trim();
                if (!t || !t.startsWith('data: ')) continue;
                const d = t.slice(6);
                if (d === '[DONE]') break;
                try { const p=JSON.parse(d); const delta=p.choices?.[0]?.delta?.content; if (delta) { full+=delta; bubble.innerHTML=renderMD(full); scrollBottom(); } } catch(ee) {}
            }
        }
        if (buf) {
            const t=buf.trim();
            if (t.startsWith('data: ')) { const d=t.slice(6); if(d!=='[DONE]'){try{const p=JSON.parse(d);const delta=p.choices?.[0]?.delta?.content;if(delta){full+=delta;bubble.innerHTML=renderMD(full);}}catch(ee){}} }
        }
        aiMsg.content = full;
        STATE.messages.push(aiMsg);
        scrollBottom();
    } catch (error) {
        hideTyping();
        showToast(error.message || '请求失败', 3000);
        addMsg(`⚠️ 抱歉，发生错误：${error.message}`, 'ai');
    } finally {
        STATE.isProcessing = false;
        updateBtn();
    }
}

// ===== 发送按钮 =====
function updateBtn() { sendBtn.classList.toggle('active', messageInput.value.trim().length > 0 && !STATE.isProcessing); }
sendBtn.addEventListener('click', handleSend);
messageInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
messageInput.addEventListener('input', updateBtn);

// ===== 表情 =====
const EMOJIS = ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','💀','☠️','👻','👽','🤖','💩','😺','😸','😹','😻','😼','😽','🙀','😿','😾','🙌','👏','👍','👎','👊','✊','🤛','🤜','🤞','✌️','🤟','🤘','👌','🤌','🤏','🫶','💪','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💕','💗','💖','💘','💝','💞','💓','🔥','✨','⭐','🌟','💫','⚡','🌈'];

function buildEmojis() {
    $('emojiGrid').innerHTML = '';
    EMOJIS.forEach(e => {
        const item = document.createElement('div');
        item.className = 'emoji-item';
        item.textContent = e;
        item.addEventListener('click', () => insertEmoji(e));
        $('emojiGrid').appendChild(item);
    });
}
function openEmojiPanel() { $('emojiPicker').classList.add('active'); }
function closeEmojiPanel() { $('emojiPicker').classList.remove('active'); }
function insertEmoji(e) {
    const inp = messageInput;
    const s = inp.selectionStart || 0, en = inp.selectionEnd || 0;
    inp.value = inp.value.substring(0, s) + e + inp.value.substring(en);
    inp.selectionStart = inp.selectionEnd = s + e.length;
    inp.focus();
    updateBtn();
}
$('emojiBtn').addEventListener('click', ee => { ee.stopPropagation(); $('emojiPicker').classList.contains('active') ? closeEmojiPanel() : openEmojiPanel(); });
$('closeEmoji').addEventListener('click', closeEmojiPanel);
document.addEventListener('click', ee => { if ($('emojiPicker').classList.contains('active') && !$('emojiPicker').contains(ee.target) && ee.target !== $('emojiBtn') && !$('emojiBtn').contains(ee.target)) closeEmojiPanel(); });

// ===== 聊天设置 =====
function loadSettingsUI() {
    $('apiEndpoint').value = STATE.settings.apiEndpoint;
    $('apiKey').value = STATE.settings.apiKey;
    $('modelSelect').value = STATE.settings.model;
    $('customModel').value = STATE.settings.customModel;
    $('systemPrompt').value = STATE.settings.systemPrompt;
    $('userPrompt').value = STATE.settings.userPrompt;
    $('temperature').value = STATE.settings.temperature;
    $('tempValue').textContent = STATE.settings.temperature;
    $('maxTokens').value = STATE.settings.maxTokens;
    $('tokensValue').textContent = STATE.settings.maxTokens;
    $('customModelRow').style.display = STATE.settings.model === 'custom' ? 'block' : 'none';
    applyUserAvatar();
}

function saveSettings() {
    STATE.settings.apiEndpoint = $('apiEndpoint').value.trim() || 'https://api.openai.com/v1';
    STATE.settings.apiKey = $('apiKey').value.trim();
    STATE.settings.model = $('modelSelect').value;
    STATE.settings.customModel = $('customModel').value.trim();
    STATE.settings.systemPrompt = $('systemPrompt').value.trim() || '你是一个乐于助人的AI助手。';
    STATE.settings.userPrompt = $('userPrompt').value.trim();
    STATE.settings.temperature = parseFloat($('temperature').value);
    STATE.settings.maxTokens = parseInt($('maxTokens').value);
    localStorage.setItem('ai_endpoint', STATE.settings.apiEndpoint);
    localStorage.setItem('ai_api_key', STATE.settings.apiKey);
    localStorage.setItem('ai_model', STATE.settings.model);
    localStorage.setItem('ai_custom_model', STATE.settings.customModel);
    localStorage.setItem('ai_system', STATE.settings.systemPrompt);
    localStorage.setItem('user_prompt', STATE.settings.userPrompt);
    localStorage.setItem('ai_temp', STATE.settings.temperature);
    localStorage.setItem('ai_tokens', STATE.settings.maxTokens);
    showToast('设置已保存');
}

$('saveSettingsBtn').addEventListener('click', saveSettings);
$('modelSelect').addEventListener('change', () => { $('customModelRow').style.display = $('modelSelect').value === 'custom' ? 'block' : 'none'; });
$('temperature').addEventListener('input', e => { $('tempValue').textContent = parseFloat(e.target.value).toFixed(1); });
$('maxTokens').addEventListener('input', e => { $('tokensValue').textContent = e.target.value; });
$('togglePassword').addEventListener('click', () => { const i=$('apiKey'); i.type=i.type==='password'?'text':'password'; });

// 清空聊天
$('clearChatBtn').addEventListener('click', () => {
    if (STATE.messages.length === 0) return;
    if (!confirm('确定清空所有聊天记录？')) return;
    STATE.messages = [];
    messagesArea.innerHTML = `<div class="message welcome-message"><div class="message-avatar"><svg viewBox="0 0 40 40" width="32" height="32"><circle cx="20" cy="20" r="20" fill="url(#aiAvatar)"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">AI</text></svg></div><div class="message-content ai"><div class="message-bubble ai">👋 你好！我是 AI 智能助手，有什么可以帮你的吗？</div><span class="message-time">刚刚</span></div></div>`;
    showToast('聊天记录已清空');
});

// ===== 主题系统 =====
function loadThemeUI() {
    const { theme } = STATE.settings;

    document.querySelectorAll('.wallpaper-item').forEach(el => {
        el.classList.toggle('active', el.dataset.wallpaper === theme.wallpaper);
    });

    // 显示/隐藏自定义纯色行
    const customColorRow = $('customColorRow');
    if (customColorRow) {
        customColorRow.style.display = theme.wallpaper === 'customColor' ? 'flex' : 'none';
    }
    // 更新颜色选择器
    const colorInput = $('customColorInput');
    const colorHex = $('customColorHex');
    if (colorInput) colorInput.value = theme.customColorHex;
    if (colorHex) colorHex.textContent = theme.customColorHex;
    // 更新自定义纯色预览
    const customColorPreview = $('customColorPreview');
    if (customColorPreview) customColorPreview.style.background = theme.customColorHex;

    $('iconShape').value = theme.iconShape;
    $('iconSize').value = theme.iconSize;
    $('iconSizeValue').textContent = theme.iconSize;
}

function applyTheme() {
    applyWallpaper();
    applyIconShape();
    applyIconSize();
    applyIconColors();
}

function applyWallpaper() {
    const { wallpaper, wallpaperImage, customColorHex } = STATE.settings.theme;
    const bg = $('wallpaperBg');
    if (!bg) return;

    if (wallpaperImage && wallpaper === 'custom') {
        bg.innerHTML = `<div class="wallpaper-custom" style="width:100%;height:100%;background:url(${wallpaperImage}) center/cover no-repeat"></div>`;
    } else if (wallpaper === 'customColor') {
        bg.innerHTML = `<div class="wallpaper-gradient" style="background:${customColorHex}"></div>`;
    } else if (WALLPAPERS[wallpaper]) {
        bg.innerHTML = `<div class="wallpaper-gradient" style="background:${WALLPAPERS[wallpaper]}"></div>`;
    } else {
        bg.innerHTML = `<div class="wallpaper-gradient"></div>`;
    }
}

function applyIconShape() {
    const shape = STATE.settings.theme.iconShape;
    document.querySelectorAll('.app-icon-bg').forEach(el => {
        el.classList.remove('shape-rounded', 'shape-circle', 'shape-square');
        el.classList.add(`shape-${shape}`);
    });
}

function applyIconSize() {
    const size = STATE.settings.theme.iconSize;
    const dockSize = Math.max(48, size - 4);
    document.querySelectorAll('.home-apps .app-icon-bg').forEach(el => {
        el.style.width = size + 'px';
        el.style.height = size + 'px';
    });
    document.querySelectorAll('.home-dock .app-icon-bg').forEach(el => {
        el.style.width = dockSize + 'px';
        el.style.height = dockSize + 'px';
    });
}

function getIconColor(appName) {
    return DEFAULT_ICON_COLORS[appName] || { c1: '#667eea', c2: '#764ba2' };
}

function applyIconColors() {
    const { iconImages } = STATE.settings.theme;
    document.querySelectorAll('.app-icon[data-app]').forEach(el => {
        const appName = el.dataset.app;
        const bg = el.querySelector('.app-icon-bg');
        if (!bg) return;
        const img = iconImages[appName];
        if (img) {
            bg.style.background = `url(${img}) center/cover no-repeat`;
        } else {
            const { c1, c2 } = getIconColor(appName);
            bg.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
        }
    });
}

// ===== 图标上传事件绑定 =====
function bindIconUploads() {
    document.querySelectorAll('.icon-upload-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const appUpload = btn.dataset.upload;
            const fileInput = document.querySelector(`input[data-app-upload="${appUpload}"]`);
            if (fileInput) fileInput.click();
        });
    });

    document.querySelectorAll('input[data-app-upload]').forEach(input => {
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const appName = input.dataset.appUpload;
            const reader = new FileReader();
            reader.onload = (ev) => {
                STATE.settings.theme.iconImages[appName] = ev.target.result;
                localStorage.setItem('theme_icon_images', JSON.stringify(STATE.settings.theme.iconImages));
                applyIconColors();
                showToast(`${appName} 图标已更新`);
            };
            reader.readAsDataURL(file);
        });
    });
}

function saveTheme() {
    const { theme } = STATE.settings;

    const activeWp = document.querySelector('.wallpaper-item.active');
    if (activeWp) {
        theme.wallpaper = activeWp.dataset.wallpaper;
    }
    // 保存自定义纯色
    const colorInput = $('customColorInput');
    if (colorInput) {
        theme.customColorHex = colorInput.value;
    }

    theme.iconShape = $('iconShape').value;
    theme.iconSize = parseInt($('iconSize').value);

    localStorage.setItem('theme_wallpaper', theme.wallpaper);
    localStorage.setItem('theme_wallpaper_img', theme.wallpaperImage);
    localStorage.setItem('theme_custom_color', theme.customColorHex);
    localStorage.setItem('theme_icon_shape', theme.iconShape);
    localStorage.setItem('theme_icon_size', theme.iconSize);
    localStorage.setItem('theme_icon_images', JSON.stringify(theme.iconImages));

    // 清理旧版 iconColors 数据
    localStorage.removeItem('theme_icon_colors');

    applyTheme();
    showToast('主题已保存');
}

// ===== 恢复默认图标 =====
function resetIcons() {
    // 清空所有自定义图标图片
    STATE.settings.theme.iconImages = {};
    localStorage.setItem('theme_icon_images', '{}');
    // 清理旧版 iconColors
    localStorage.removeItem('theme_icon_colors');
    applyIconColors();
    showToast('所有图标已恢复默认');
}

// 壁纸选择
document.querySelectorAll('.wallpaper-item').forEach(el => {
    el.addEventListener('click', () => {
        document.querySelectorAll('.wallpaper-item').forEach(w => w.classList.remove('active'));
        el.classList.add('active');
        const wp = el.dataset.wallpaper;
        // 显示/隐藏自定义纯色行
        const customColorRow = $('customColorRow');
        if (customColorRow) {
            customColorRow.style.display = wp === 'customColor' ? 'flex' : 'none';
        }
        if (wp === 'custom') {
            $('wallpaperFileInput').click();
        }
    });
});

// 自定义纯色颜色选择器
const customColorInput = $('customColorInput');
const customColorHex = $('customColorHex');
const customColorPreview = $('customColorPreview');
if (customColorInput) {
    customColorInput.addEventListener('input', (e) => {
        const hex = e.target.value;
        if (customColorHex) customColorHex.textContent = hex;
        if (customColorPreview) customColorPreview.style.background = hex;
    });
}

// 恢复默认壁纸按钮
const resetWallpaperBtn = $('resetWallpaperBtn');
if (resetWallpaperBtn) {
    resetWallpaperBtn.addEventListener('click', () => {
        STATE.settings.theme.wallpaper = DEFAULT_WALLPAPER;
        STATE.settings.theme.wallpaperImage = '';
        STATE.settings.theme.customColorHex = DEFAULT_CUSTOM_COLOR;
        localStorage.setItem('theme_wallpaper', DEFAULT_WALLPAPER);
        localStorage.setItem('theme_wallpaper_img', '');
        localStorage.setItem('theme_custom_color', DEFAULT_CUSTOM_COLOR);
        applyWallpaper();
        loadThemeUI();
        showToast('壁纸已恢复默认');
    });
}

// 恢复默认图标按钮
const resetIconsBtn = $('resetIconsBtn');
if (resetIconsBtn) {
    resetIconsBtn.addEventListener('click', resetIcons);
}

// 壁纸图片上传
$('wallpaperFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        STATE.settings.theme.wallpaperImage = ev.target.result;
        STATE.settings.theme.wallpaper = 'custom';
        localStorage.setItem('theme_wallpaper_img', ev.target.result);
        localStorage.setItem('theme_wallpaper', 'custom');
        applyWallpaper();
        showToast('壁纸已更换');
    };
    reader.readAsDataURL(file);
});

// 图标大小滑块
$('iconSize').addEventListener('input', (e) => {
    $('iconSizeValue').textContent = e.target.value;
});

// 保存主题
$('saveThemeBtn').addEventListener('click', saveTheme);

// ===== 初始化 =====
buildEmojis();
updateBtn();
applyAvatar();
applyUserAvatar();
applyTheme();
bindIconUploads();
scrollBottom();

// 处理状态栏颜色
const statusBar = document.querySelector('.status-bar');
function updateStatusColor() {
    statusBar.style.color = '#1a1a1a';
}
const origOpen = openApp;
openApp = function(appId, page) {
    origOpen(appId, page);
    setTimeout(updateStatusColor, 50);
};
const origClose = closeApp;
closeApp = function() {
    origClose();
    setTimeout(updateStatusColor, 50);
};
const origGoBack = goBackToChat;
goBackToChat = function() {
    origGoBack();
    setTimeout(updateStatusColor, 50);
};

// ===== 聊天气泡长按菜单系统 =====
const contextMenu = document.getElementById('bubbleContextMenu');
if (!contextMenu) {
    // fallback: 动态创建
    const cm = document.createElement('div');
    cm.className = 'bubble-context-menu';
    cm.id = 'bubbleContextMenu';
    cm.innerHTML = `
        <div class="ctx-menu-item" data-action="copy"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/></svg><span>复制</span></div>
        <div class="ctx-menu-item" data-action="forward"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm4 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-.5 11.5L17 19l-4.5-4.5H15v-5h2v5h2.5z" fill="currentColor"/></svg><span>转发</span></div>
        <div class="ctx-menu-item" data-action="quote"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" fill="currentColor"/></svg><span>引用</span></div>
        <div class="ctx-menu-item" data-action="favorite"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/></svg><span>收藏</span></div>
        <div class="ctx-menu-item" data-action="screenshot"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/></svg><span>截图</span></div>
        <div class="ctx-menu-item" data-action="edit"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg><span>编辑</span></div>
        <div class="ctx-menu-item" data-action="multiselect"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg><span>多选</span></div>
        <div class="ctx-menu-item ctx-menu-danger" data-action="delete"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg><span>删除</span></div>
    `;
    document.querySelector('.phone-body').appendChild(cm);
}

let contextTargetMsg = null; // 当前长按目标消息
let longPressTimer = null;
let contextMenuShown = false;

// 多选状态
let multiSelectMode = false;
let selectedMsgs = new Set();

// 收藏列表
let favorites = JSON.parse(localStorage.getItem('chat_favorites') || '[]');

// 引用状态
let quoteTarget = null;

// ===== 获取消息气泡的纯文本 =====
function getBubbleText(bubble) {
    if (!bubble) return '';
    return bubble.textContent || bubble.innerText || '';
}

function getBubbleHTML(bubble) {
    if (!bubble) return '';
    return bubble.innerHTML || '';
}

// 通过消息DOM获取消息数据
function getMessageFromEl(el) {
    const msgDiv = el.closest('.message');
    if (!msgDiv) return null;
    const id = msgDiv.dataset.id;
    return STATE.messages.find(m => m.id === id) || null;
}

// ===== 长按事件处理 =====
function attachLongPress(msgDiv) {
    const bubble = msgDiv.querySelector('.message-bubble');
    if (!bubble) return;
    if (bubble.dataset.longPressAttached === '1') return;
    bubble.dataset.longPressAttached = '1';

    bubble.addEventListener('touchstart', (e) => {
        if (multiSelectMode) return;
        longPressTimer = setTimeout(() => {
            showContextMenu(msgDiv, bubble, e);
        }, 500);
    }, { passive: true });

    bubble.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
    });

    bubble.addEventListener('touchmove', () => {
        clearTimeout(longPressTimer);
    });

    // PC端右键菜单
    bubble.addEventListener('contextmenu', (e) => {
        if (multiSelectMode) return;
        e.preventDefault();
        showContextMenu(msgDiv, bubble, e);
    });
}

function showContextMenu(msgDiv, bubble, event) {
    if (contextMenuShown) {
        hideContextMenu();
        return;
    }
    contextTargetMsg = msgDiv;
    contextMenuShown = true;

    // 获取触摸/点击坐标
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX || event.pageX;
        clientY = event.clientY || event.pageY;
    }

    // 定位菜单 - 在手机body内
    const phoneBody = document.querySelector('.phone-body');
    const phoneRect = phoneBody.getBoundingClientRect();
    const menuW = 170;
    const menuH = 320;
    let left = clientX - phoneRect.left;
    let top = clientY - phoneRect.top;

    if (left + menuW > phoneRect.width) left = phoneRect.width - menuW - 8;
    if (top + menuH > phoneRect.height) top = clientY - phoneRect.top - menuH - 10;
    if (left < 8) left = 8;
    if (top < 60) top = 60;

    contextMenu.style.left = left + 'px';
    contextMenu.style.top = top + 'px';
    contextMenu.classList.add('show');

    // 高亮当前气泡
    msgDiv.style.zIndex = '30';
    msgDiv.querySelector('.message-bubble')?.classList.add('screenshot-flash');

    // 点击其他地方关闭
    setTimeout(() => {
        document.addEventListener('click', hideContextMenuOnClick, { once: true });
        document.addEventListener('touchend', hideContextMenuOnTouch, { once: true });
    }, 100);
}

function hideContextMenu() {
    contextMenu.classList.remove('show');
    contextMenuShown = false;
    if (contextTargetMsg) {
        contextTargetMsg.style.zIndex = '';
        contextTargetMsg.querySelector('.message-bubble')?.classList.remove('screenshot-flash');
        contextTargetMsg = null;
    }
}

function hideContextMenuOnClick(e) {
    if (!contextMenu.contains(e.target)) {
        hideContextMenu();
    } else {
        document.addEventListener('click', hideContextMenuOnClick, { once: true });
    }
}

function hideContextMenuOnTouch(e) {
    if (!contextMenu.contains(e.target)) {
        hideContextMenu();
    } else {
        document.addEventListener('touchend', hideContextMenuOnTouch, { once: true });
    }
}

// ===== 上下文菜单动作 =====
contextMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.ctx-menu-item');
    if (!item) return;
    const action = item.dataset.action;
    const msgDiv = contextTargetMsg;
    hideContextMenu();

    if (!msgDiv) return;

    switch (action) {
        case 'copy': copyMessage(msgDiv); break;
        case 'forward': forwardMessage(msgDiv); break;
        case 'quote': quoteMessage(msgDiv); break;
        case 'favorite': favoriteMessage(msgDiv); break;
        case 'screenshot': screenshotBubble(msgDiv); break;
        case 'edit': editBubble(msgDiv); break;
        case 'multiselect': enterMultiSelect(msgDiv); break;
        case 'delete': deleteMessage(msgDiv); break;
    }
});

// ===== 1. 复制 =====
function copyMessage(msgDiv) {
    const text = getBubbleText(msgDiv.querySelector('.message-bubble'));
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast('已复制'));
    } else {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showToast('已复制'); } catch (ee) { showToast('复制失败', 2000); }
        document.body.removeChild(ta);
    }
}

// ===== 2. 转发 =====
function forwardMessage(msgDiv) {
    const text = getBubbleText(msgDiv.querySelector('.message-bubble'));
    if (!text) return;

    // 创建转发对话框
    const overlay = document.createElement('div');
    overlay.className = 'forward-overlay';
    overlay.innerHTML = `
        <div class="forward-dialog">
            <div class="forward-dialog-title">转发消息</div>
            <div class="forward-dialog-preview">${escapeHTML(text.substring(0, 200))}${text.length > 200 ? '...' : ''}</div>
            <div class="forward-dialog-actions">
                <button class="forward-dialog-btn cancel">取消</button>
                <button class="forward-dialog-btn confirm">发送到当前对话</button>
            </div>
        </div>
    `;
    const phoneBody = document.querySelector('.phone-body');
    phoneBody.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);

    overlay.querySelector('.cancel').addEventListener('click', () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
    });

    overlay.querySelector('.confirm').addEventListener('click', () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
        // 将消息作为用户消息发送
        addMsg(`[转发] ${text}`, 'user');
        // 触发AI回复
        if (!STATE.isProcessing) {
            setTimeout(() => handleSendForward(), 100);
        }
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
    });
}

function escapeHTML(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function handleSendForward() {
    if (STATE.isProcessing) return;
    STATE.isProcessing = true;
    showTyping();
    callAI(STATE.messages.map(m => ({ role: m.role, content: m.content })))
        .then(response => {
            hideTyping();
            const mid = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            const aiMsg = { id: mid, content: '', role: 'ai', time: getTime() };
            const { avatarC1, avatarC2, avatarImage } = STATE.settings;
            let avHtml;
            if (avatarImage) {
                avHtml = `<img src="${avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            } else {
                avHtml = `<svg viewBox="0 0 40 40" width="32" height="32"><defs><linearGradient id="ast_fw_${mid.slice(0,6)}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${avatarC1}"/><stop offset="100%" style="stop-color:${avatarC2}"/></linearGradient></defs><circle cx="20" cy="20" r="20" fill="url(#ast_fw_${mid.slice(0,6)})"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">AI</text></svg>`;
            }
            const div = document.createElement('div');
            div.className = 'message ai';
            div.dataset.id = mid;
            div.innerHTML = `<div class="message-avatar">${avHtml}</div><div class="message-content"><div class="message-bubble ai" id="sb_${mid}"></div><span class="message-time">${aiMsg.time}</span></div>`;
            messagesArea.appendChild(div);
            attachLongPress(div);
            scrollBottom();

            const bubble = document.getElementById(`sb_${mid}`);
            let full = '';
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buf = '';
            return (async () => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buf += decoder.decode(value, { stream: true });
                    const lines = buf.split('\n');
                    buf = lines.pop() || '';
                    for (const line of lines) {
                        const t = line.trim();
                        if (!t || !t.startsWith('data: ')) continue;
                        const d = t.slice(6);
                        if (d === '[DONE]') return;
                        try { const p = JSON.parse(d); const delta = p.choices?.[0]?.delta?.content; if (delta) { full += delta; bubble.innerHTML = renderMD(full); scrollBottom(); } } catch (ee) { }
                    }
                }
                if (buf) {
                    const t = buf.trim();
                    if (t.startsWith('data: ')) {
                        const d = t.slice(6);
                        if (d !== '[DONE]') {
                            try { const p = JSON.parse(d); const delta = p.choices?.[0]?.delta?.content; if (delta) { full += delta; bubble.innerHTML = renderMD(full); } } catch (ee) { }
                        }
                    }
                }
                aiMsg.content = full;
                STATE.messages.push(aiMsg);
                scrollBottom();
                STATE.isProcessing = false;
                updateBtn();
            })();
        })
        .catch(error => {
            hideTyping();
            showToast(error.message || '请求失败', 3000);
            addMsg(`⚠️ 抱歉，发生错误：${error.message}`, 'ai');
            STATE.isProcessing = false;
            updateBtn();
        });
}

// ===== 3. 引用 =====
function quoteMessage(msgDiv) {
    const text = getBubbleText(msgDiv.querySelector('.message-bubble'));
    if (!text) return;
    quoteTarget = { text: text.substring(0, 300), id: msgDiv.dataset.id };

    // 在输入框上方显示引用预览
    removeQuotePreview();
    const preview = document.createElement('div');
    preview.className = 'quote-preview-bar';
    preview.id = 'quotePreviewBar';
    preview.innerHTML = `
        <span class="quote-preview-text">${escapeHTML(text.substring(0, 80))}${text.length > 80 ? '...' : ''}</span>
        <button class="quote-preview-close" id="quotePreviewClose">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
        </button>
    `;
    const inputArea = document.querySelector('.input-area');
    inputArea.parentNode.insertBefore(preview, inputArea);
    document.getElementById('quotePreviewClose').addEventListener('click', removeQuotePreview);
    showToast('已添加引用，输入内容后发送即可');
}

function removeQuotePreview() {
    const preview = document.getElementById('quotePreviewBar');
    if (preview) preview.remove();
    quoteTarget = null;
}

function getQuoteHTML() {
    if (!quoteTarget) return '';
    return `<div class="quote-content">${escapeHTML(quoteTarget.text)}</div>`;
}

// ===== 4. 收藏 =====
function favoriteMessage(msgDiv) {
    const msg = getMessageFromEl(msgDiv);
    if (!msg) return;

    const exists = favorites.findIndex(f => f.id === msg.id);
    if (exists >= 0) {
        favorites.splice(exists, 1);
        showToast('已取消收藏');
    } else {
        favorites.push({
            id: msg.id,
            content: msg.content,
            role: msg.role,
            time: msg.time,
            savedAt: new Date().toISOString()
        });
        showToast('已收藏');
    }
    localStorage.setItem('chat_favorites', JSON.stringify(favorites));
    renderFavorites();
}

function showFavoritesPanel() {
    renderFavorites();
    const panel = document.getElementById('favoritesPanel');
    if (panel) panel.classList.add('show');
}

function hideFavoritesPanel() {
    const panel = document.getElementById('favoritesPanel');
    if (panel) panel.classList.remove('show');
}

function renderFavorites() {
    const list = document.getElementById('favoritesList');
    if (!list) return;
    if (favorites.length === 0) {
        list.innerHTML = '<div class="favorites-empty">暂无收藏消息</div>';
    } else {
        list.innerHTML = favorites.map((f, idx) => `
            <div class="favorite-item" data-index="${idx}">
                <div class="favorite-item-content">${escapeHTML(f.content.substring(0, 200))}${f.content.length > 200 ? '...' : ''}</div>
                <div class="favorite-item-meta">
                    <span>${f.role === 'ai' ? 'AI' : '我'} · ${f.time || ''}</span>
                    <div class="favorite-item-actions">
                        <button class="favorite-item-btn" data-action="send" data-index="${idx}">发送</button>
                        <button class="favorite-item-btn danger" data-action="remove" data-index="${idx}">删除</button>
                    </div>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.favorite-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                if (btn.dataset.action === 'send') {
                    const f = favorites[idx];
                    if (f) {
                        hideFavoritesPanel();
                        addMsg(f.content, f.role === 'ai' ? 'ai' : 'user');
                    }
                } else if (btn.dataset.action === 'remove') {
                    favorites.splice(idx, 1);
                    localStorage.setItem('chat_favorites', JSON.stringify(favorites));
                    renderFavorites();
                    showToast('已删除收藏');
                }
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeFavorites');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideFavoritesPanel);
    }
});

// 收藏按钮（可以在输入区添加一个收藏入口）
// 通过三点菜单或输入框旁按钮进入收藏

// ===== 5. 截图 =====
function screenshotBubble(msgDiv) {
    const bubble = msgDiv.querySelector('.message-bubble');
    if (!bubble) return;

    // 使用canvas截图
    bubble.classList.add('screenshot-flash');
    const rect = bubble.getBoundingClientRect();

    // 使用html2canvas概念简化版 - clone后绘制到canvas
    const cloned = bubble.cloneNode(true);
    cloned.style.position = 'fixed';
    cloned.style.left = '-9999px';
    cloned.style.top = '0';
    cloned.style.width = rect.width + 'px';
    cloned.style.maxWidth = rect.width + 'px';
    cloned.style.whiteSpace = 'pre-wrap';
    cloned.style.wordBreak = 'break-word';
    document.body.appendChild(cloned);

    // 使用简易canvas渲染
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 2;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    ctx.scale(scale, scale);

    // 绘制背景
    const style = getComputedStyle(bubble);
    const bgColor = style.backgroundColor;
    const borderRadius = parseFloat(style.borderRadius) || 18;
    const textColor = style.color;

    // 画圆角矩形
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(0, 0, rect.width, rect.height, borderRadius);
    ctx.fill();

    // 画阴影
    ctx.shadowColor = 'rgba(0,0,0,0.06)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 1;

    // 画文字
    ctx.fillStyle = textColor;
    ctx.font = '15px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    const text = getBubbleText(bubble);
    const lines = wrapText(ctx, text, rect.width - 28, 15);
    let y = 14;
    lines.forEach(line => {
        ctx.fillText(line, 14, y + 18);
        y += 22;
    });

    // 下载截图
    const link = document.createElement('a');
    link.download = `chat_screenshot_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    document.body.removeChild(cloned);
    showToast('截图已保存');
}

function wrapText(ctx, text, maxWidth, fontSize) {
    ctx.font = `15px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif`;
    const chars = text.split('');
    const lines = [];
    let cur = '';
    for (let i = 0; i < chars.length; i++) {
        const test = cur + chars[i];
        if (ctx.measureText(test).width > maxWidth && cur.length > 0) {
            lines.push(cur);
            cur = chars[i];
        } else {
            cur = test;
        }
    }
    if (cur) lines.push(cur);
    return lines;
}

// ===== 6. 编辑气泡 =====
function editBubble(msgDiv) {
    const bubble = msgDiv.querySelector('.message-bubble');
    if (!bubble) return;
    const msg = getMessageFromEl(msgDiv);
    if (!msg) return;

    const overlay = document.getElementById('editBubbleOverlay');
    const textarea = document.getElementById('editBubbleTextarea');
    if (!overlay || !textarea) return;

    textarea.value = msg.content;
    overlay.classList.add('show');

    const confirmBtn = document.getElementById('editBubbleConfirm');
    const cancelBtn = document.getElementById('editBubbleCancel');

    const closeEdit = () => {
        overlay.classList.remove('show');
    };

    const confirmEdit = () => {
        const newContent = textarea.value.trim();
        if (!newContent) {
            showToast('消息内容不能为空');
            return;
        }
        msg.content = newContent;
        bubble.innerHTML = msg.role === 'ai' ? renderMD(newContent) : escapeHTML(newContent);
        closeEdit();
        showToast('消息已更新');
    };

    // 移除旧事件（防止重复绑定）
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));

    document.getElementById('editBubbleConfirm').addEventListener('click', confirmEdit);
    document.getElementById('editBubbleCancel').addEventListener('click', closeEdit);

    // ESC关闭
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeEdit();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    setTimeout(() => textarea.focus(), 200);
}

// ===== 7. 多选 =====
function enterMultiSelect(msgDiv) {
    multiSelectMode = true;
    selectedMsgs.clear();
    if (msgDiv) {
        selectedMsgs.add(msgDiv.dataset.id);
    }

    const bar = document.getElementById('multiselectBar');
    if (bar) bar.classList.add('show');

    document.querySelectorAll('#messagesArea .message').forEach(m => {
        m.classList.add('multiselect-mode');
        // 添加选择圆圈
        if (!m.querySelector('.message-select-check')) {
            const check = document.createElement('div');
            check.className = 'message-select-check';
            check.innerHTML = '<div class="message-select-check-inner"></div>';
            const content = m.querySelector('.message-content');
            if (content) {
                if (m.classList.contains('user')) {
                    m.insertBefore(check, m.firstChild);
                } else {
                    m.insertBefore(check, content);
                }
            }
        }
        updateSelectUI(m);
    });

    updateMultiSelectCount();
    showToast('多选模式已开启，点击消息选择');
}

function exitMultiSelect() {
    multiSelectMode = false;
    selectedMsgs.clear();

    const bar = document.getElementById('multiselectBar');
    if (bar) bar.classList.remove('show');

    document.querySelectorAll('#messagesArea .message').forEach(m => {
        m.classList.remove('multiselect-mode', 'selected');
        const check = m.querySelector('.message-select-check');
        if (check) check.remove();
    });
}

function updateSelectUI(msgDiv) {
    if (selectedMsgs.has(msgDiv.dataset.id)) {
        msgDiv.classList.add('selected');
    } else {
        msgDiv.classList.remove('selected');
    }
}

function updateMultiSelectCount() {
    const count = document.getElementById('multiselectCount');
    if (count) count.textContent = `已选 ${selectedMsgs.size} 条`;
}

// 在消息区域代理点击处理多选
messagesArea.addEventListener('click', (e) => {
    if (!multiSelectMode) return;
    const msgDiv = e.target.closest('.message');
    if (!msgDiv) return;

    // 切换选中状态
    if (selectedMsgs.has(msgDiv.dataset.id)) {
        selectedMsgs.delete(msgDiv.dataset.id);
    } else {
        selectedMsgs.add(msgDiv.dataset.id);
    }
    updateSelectUI(msgDiv);
    updateMultiSelectCount();
});

// 多选工具栏按钮
document.addEventListener('DOMContentLoaded', () => {
    const cancelBtn = document.getElementById('multiselectCancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', exitMultiSelect);
    }

    const delBtn = document.getElementById('multiselectDelete');
    if (delBtn) {
        delBtn.addEventListener('click', () => {
            if (selectedMsgs.size === 0) return;
            if (!confirm(`确定删除选中的 ${selectedMsgs.size} 条消息？`)) return;

            selectedMsgs.forEach(id => {
                STATE.messages = STATE.messages.filter(m => m.id !== id);
                const msgDiv = messagesArea.querySelector(`.message[data-id="${id}"]`);
                if (msgDiv) msgDiv.remove();
            });
            exitMultiSelect();
            showToast('已删除选中消息');
        });
    }

    const favBtn = document.getElementById('multiselectFavorite');
    if (favBtn) {
        favBtn.addEventListener('click', () => {
            if (selectedMsgs.size === 0) return;
            selectedMsgs.forEach(id => {
                const msg = STATE.messages.find(m => m.id === id);
                if (msg && !favorites.find(f => f.id === msg.id)) {
                    favorites.push({
                        id: msg.id,
                        content: msg.content,
                        role: msg.role,
                        time: msg.time,
                        savedAt: new Date().toISOString()
                    });
                }
            });
            localStorage.setItem('chat_favorites', JSON.stringify(favorites));
            showToast(`已收藏 ${selectedMsgs.size} 条消息`);
            exitMultiSelect();
        });
    }
});

// ===== 8. 删除 =====
function deleteMessage(msgDiv) {
    const msg = getMessageFromEl(msgDiv);
    if (!msg) return;
    if (!confirm('确定删除这条消息？')) return;

    STATE.messages = STATE.messages.filter(m => m.id !== msg.id);
    msgDiv.style.transition = 'all 0.3s ease';
    msgDiv.style.opacity = '0';
    msgDiv.style.transform = 'scale(0.8)';
    setTimeout(() => msgDiv.remove(), 300);
    showToast('消息已删除');
}

// ===== 为所有消息附加长按 =====
function attachLongPressToAll() {
    messagesArea.querySelectorAll('.message').forEach(m => attachLongPress(m));
}

// 消息渲染后自动附加长按
const origRenderMsg = renderMsg;
renderMsg = function(msg) {
    origRenderMsg(msg);
    // 延迟附加长按（等待DOM插入）
    setTimeout(() => {
        const el = messagesArea.querySelector(`.message[data-id="${msg.id}"]`);
        if (el) attachLongPress(el);
    }, 50);
};

// 初始附加
setTimeout(attachLongPressToAll, 100);

// ===== 修改发送逻辑以支持引用 =====
const origHandleSend = handleSend;
handleSend = async function() {
    if (quoteTarget) {
        const quoteHTML = getQuoteHTML();
        const text = messageInput.value.trim();
        if (!text || STATE.isProcessing) return;
        closeEmojiPanel();
        
        const msg = { id: Date.now().toString(36)+Math.random().toString(36).substr(2,5), content: text, role: 'user', time: getTime(), quoted: quoteTarget.text };
        STATE.messages.push(msg);
        
        const { userAvatarC1, userAvatarC2, userAvatarImage } = STATE.settings;
        const d = document.createElement('div');
        d.className = 'message user';
        d.dataset.id = msg.id;
        const bubbleHTML = quoteHTML + escapeHTML(text);
        const avHTML = userAvatarImage 
            ? `<img src="${userAvatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
            : `<svg viewBox="0 0 40 40" width="32" height="32"><defs><linearGradient id="uq_${msg.id.slice(0,6)}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${userAvatarC1}"/><stop offset="100%" style="stop-color:${userAvatarC2}"/></linearGradient></defs><circle cx="20" cy="20" r="20" fill="url(#uq_${msg.id.slice(0,6)})"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">我</text></svg>`;
        d.innerHTML = `<div class="message-content"><div class="message-bubble user">${bubbleHTML}</div><span class="message-time">${msg.time}</span></div><div class="message-avatar user-avatar">${avHTML}</div>`;
        messagesArea.appendChild(d);
        attachLongPress(d);
        scrollBottom();
        
        messageInput.value = '';
        removeQuotePreview();
        updateBtn();
        STATE.isProcessing = true;
        showTyping();
        
        try {
            const response = await callAI(STATE.messages.map(m=>({role:m.role,content:m.content})));
            hideTyping();
            // ... same streaming logic as handleSend
            const mid = Date.now().toString(36)+Math.random().toString(36).substr(2,5);
            const aiMsg = { id:mid, content:'', role:'ai', time:getTime() };
            const { avatarC1, avatarC2, avatarImage } = STATE.settings;
            let avHtml2;
            if (avatarImage) {
                avHtml2 = `<img src="${avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            } else {
                avHtml2 = `<svg viewBox="0 0 40 40" width="32" height="32"><defs><linearGradient id="ast_q_${mid.slice(0,6)}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${avatarC1}"/><stop offset="100%" style="stop-color:${avatarC2}"/></linearGradient></defs><circle cx="20" cy="20" r="20" fill="url(#ast_q_${mid.slice(0,6)})"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">AI</text></svg>`;
            }
            const div2 = document.createElement('div');
            div2.className = 'message ai';
            div2.dataset.id = mid;
            div2.innerHTML = `<div class="message-avatar">${avHtml2}</div><div class="message-content"><div class="message-bubble ai" id="sb_${mid}"></div><span class="message-time">${aiMsg.time}</span></div>`;
            messagesArea.appendChild(div2);
            attachLongPress(div2);
            scrollBottom();

            const bubble = document.getElementById(`sb_${mid}`);
            let full = '';
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buf = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split('\n');
                buf = lines.pop() || '';
                for (const line of lines) {
                    const t = line.trim();
                    if (!t || !t.startsWith('data: ')) continue;
                    const d = t.slice(6);
                    if (d === '[DONE]') break;
                    try { const p=JSON.parse(d); const delta=p.choices?.[0]?.delta?.content; if (delta) { full+=delta; bubble.innerHTML=renderMD(full); scrollBottom(); } } catch(ee) {}
                }
            }
            if (buf) {
                const t=buf.trim();
                if (t.startsWith('data: ')) { const d=t.slice(6); if(d!=='[DONE]'){try{const p=JSON.parse(d);const delta=p.choices?.[0]?.delta?.content;if(delta){full+=delta;bubble.innerHTML=renderMD(full);}}catch(ee){}} }
            }
            aiMsg.content = full;
            STATE.messages.push(aiMsg);
            scrollBottom();
        } catch (error) {
            hideTyping();
            showToast(error.message || '请求失败', 3000);
            addMsg(`⚠️ 抱歉，发生错误：${error.message}`, 'ai');
        } finally {
            STATE.isProcessing = false;
            updateBtn();
        }
        return;
    }
    return origHandleSend();
};
updateStatusColor();