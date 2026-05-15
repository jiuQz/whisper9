// ============================================================
//  AI Chat - 仿智能手机应用 v3.5
//  主界面 + iOS系统设置 + 聊天设置(三点菜单) + 主题 + API + 模型自拉取
//  + 全部应用页面 + 图标自定义图片上传
// ============================================================

const $ = id => document.getElementById(id);
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
            iconColors: JSON.parse(localStorage.getItem('theme_icon_colors') || '{}'),
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

// 聊天三点菜单 → 聊天设置
$('chatSettingsBtn').addEventListener('click', () => {
    loadSettingsUI();
    openApp('chatSettings', pageChatSettings);
});

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

    document.querySelectorAll('.icon-color-item').forEach(item => {
        const appName = item.dataset.appIcon;
        const colors = theme.iconColors[appName];
        item.querySelectorAll('.icon-preset').forEach(p => {
            if (colors) {
                p.classList.toggle('active', p.dataset.c1 === colors.c1 && p.dataset.c2 === colors.c2);
            } else {
                p.classList.remove('active');
            }
        });
        if (!colors) {
            const firstPreset = item.querySelector('.icon-preset');
            if (firstPreset) firstPreset.classList.add('active');
        }
    });
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
    const { iconColors } = STATE.settings.theme;
    if (iconColors[appName]) return iconColors[appName];
    const defaults = {
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
    return defaults[appName] || { c1: '#667eea', c2: '#764ba2' };
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

    document.querySelectorAll('.icon-color-item').forEach(item => {
        const appName = item.dataset.appIcon;
        const activePreset = item.querySelector('.icon-preset.active');
        if (activePreset) {
            theme.iconColors[appName] = { c1: activePreset.dataset.c1, c2: activePreset.dataset.c2 };
        }
    });

    localStorage.setItem('theme_wallpaper', theme.wallpaper);
    localStorage.setItem('theme_wallpaper_img', theme.wallpaperImage);
    localStorage.setItem('theme_custom_color', theme.customColorHex);
    localStorage.setItem('theme_icon_shape', theme.iconShape);
    localStorage.setItem('theme_icon_size', theme.iconSize);
    localStorage.setItem('theme_icon_colors', JSON.stringify(theme.iconColors));
    localStorage.setItem('theme_icon_images', JSON.stringify(theme.iconImages));

    applyTheme();
    showToast('主题已保存');
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
updateStatusColor();