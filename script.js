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

let dbReady = false;

// ===== 高性能存储架构 (Dexie.js + Blob + OPFS) =====
const db = new Dexie('UChatDB');
db.version(1).stores({
    settings: 'id', // store configuration
    media: 'id', // store images/blobs
    agents: 'id', // store agents
    agentChats: 'id', // store chat messages
    favorites: 'id' // store favorites
});

async function initStorage() {
    try {
        if (navigator.storage && navigator.storage.persist) {
            const isPersisted = await navigator.storage.persist();
            console.log(`Persistent storage granted: ${isPersisted}`);
        }
    } catch (e) {
        console.warn('Storage persistence check failed:', e);
    }
}
initStorage();

const blobUrls = new Set();
function createObjURL(blob) {
    if (!blob) return '';
    const url = URL.createObjectURL(blob);
    blobUrls.add(url);
    return url;
}

// 帮助函数
async function saveSetting(key, val) { await db.settings.put({ id: key, value: val }); }
async function getSetting(key, def) { const r = await db.settings.get(key); return r ? r.value : def; }
async function saveMedia(key, blob) { if (blob) { await db.media.put({ id: key, data: blob }); } else { await db.media.delete(key); } }
async function getMedia(key) { const r = await db.media.get(key); return r ? createObjURL(r.data) : ''; }

// ===== 状态 =====
const STATE = {
    messages: [],
    isProcessing: false,
    settings: {
        apiEndpoint: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-4o-mini',
        customModel: '',
        systemPrompt: '你是一个乐于助人的AI助手。请用中文回答用户的问题，回答要详细、准确、有条理。',
        temperature: 0.7,
        maxTokens: 2048,
        avatarC1: '#667eea',
        avatarC2: '#764ba2',
        avatarImage: '', // Now stores ObjectURL
        userAvatarC1: '#007aff',
        userAvatarC2: '#5856d6',
        userAvatarImage: '', // ObjectURL
        userPrompt: '',
        theme: {
            wallpaper: 'gradient1',
            wallpaperImage: '', // ObjectURL
            customColorHex: '#e8e8ea',
            iconShape: 'rounded',
            iconSize: 58,
            iconImages: {} // ObjectURLs
        }
    },
    agents: [],
    currentAgentId: null,
    agentChats: {}
};;

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
let closeFromPopstate = false;

window.addEventListener('popstate', () => {
    if (currentApp) {
        closeFromPopstate = true;
        closeApp();
        closeFromPopstate = false;
    }
});

function openApp(appId, page) {
    const targetPage = page || pageMap[appId];
    if (!targetPage) return;
    currentApp = appId;
    appStack.push(appId);
    targetPage.classList.add('active');
    history.pushState({ appId }, '', '#' + appId);
}

function closeApp() {
    if (!currentApp) return;
    const page = pageMap[currentApp];
    if (page) page.classList.remove('active');
    currentApp = null;
    appStack = [];
    closeEmojiPanel();
    if (!closeFromPopstate) {
        history.back();
    }
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
// 收藏按钮（功能已移除）
// ===== 上下文菜单系统 =====
let ctxTargetMsg = null;
let ctxMenuVisible = false;
let longPressTimer = null;
const LONG_PRESS_DURATION = 500;

// 多选状态
let isMultiselectMode = false;
let selectedMsgs = new Set();

// 收藏状态
let favorites = [];

// 引用状态
let quoteTarget = null;

const bubbleContextMenu = $('bubbleContextMenu');
const multiselectBar = $('multiselectBar');
const editBubbleOverlay = $('editBubbleOverlay');
const forwardOverlay = $('forwardOverlay');
const quotePreviewBar = $('quotePreviewBar');
const favoritesPanel = $('favoritesPanel');

function getMsgById(id) {
    return STATE.messages.find(m => m.id === id);
}

function getMsgElement(el) {
    const msgEl = el.closest('.message');
    if (!msgEl) return null;
    return msgEl;
}

function cancelLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

// 显示上下文菜单
function showContextMenu(x, y, msgId) {
    const msg = getMsgById(msgId);
    if (!msg) return;
    ctxTargetMsg = msg;
    
    // 隐藏转发弹窗和编辑弹窗
    if (forwardOverlay) forwardOverlay.style.display = 'none';
    if (editBubbleOverlay) editBubbleOverlay.style.display = 'none';
    
    const menu = bubbleContextMenu;
    menu.style.display = 'block';
    menu.style.left = '0px';
    menu.style.top = '0px';
    
    // 调整菜单位置
    const rect = menu.getBoundingClientRect();
    const phoneRect = document.querySelector('.phone-body').getBoundingClientRect();
    const pageChatRect = pageChat.getBoundingClientRect();
    
    let left = x - pageChatRect.left;
    let top = y - pageChatRect.top;
    
    // 防止菜单超出右边界
    if (left + rect.width > pageChatRect.width - 10) {
        left = pageChatRect.width - rect.width - 10;
    }
    // 防止菜单超出左边界
    if (left < 10) left = 10;
    // 防止菜单超出下边界
    const pageChatHeight = pageChatRect.height;
    if (top + rect.height > pageChatHeight - 10) {
        top = top - rect.height - 5;
    }
    // 防止菜单超出上边界
    if (top < 50) top = 50;
    
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    ctxMenuVisible = true;
    
    // 根据消息角色调整可用操作
    updateContextMenuItems(msg);
}

function updateContextMenuItems(msg) {
    const items = bubbleContextMenu.querySelectorAll('.ctx-menu-item');
    items.forEach(item => {
        const action = item.dataset.action;
        if (action === 'edit' || action === 'recall') {
            // 编辑和撤回仅对自己发的消息可用
            item.style.display = 'flex';
        } else {
            item.style.display = 'flex';
        }
    });
    
    // 更新分隔线可见性
    const dividers = bubbleContextMenu.querySelectorAll('.ctx-menu-divider');
    // 简单处理：如果后续所有菜单项都隐藏了，隐藏前面的分隔线
    let lastVisible = true;
    for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].style.display === 'none') {
            // 检查前面是否是分隔线
            if (i > 0 && dividers.length > 0) {
                // 简化处理，保持分隔线可见
            }
        }
    }
}

function hideContextMenu() {
    if (bubbleContextMenu) bubbleContextMenu.style.display = 'none';
    ctxMenuVisible = false;
    ctxTargetMsg = null;
    cancelLongPress();
}

// 上下文菜单操作
function handleCtxAction(action) {
    if (!ctxTargetMsg) return;
    const msg = ctxTargetMsg;
    hideContextMenu();
    
    switch (action) {
        case 'copy':
            copyMessage(msg);
            break;
        case 'forward':
            openForwardDialog(msg);
            break;
        case 'favorite':
            favoriteMessage(msg);
            break;
        case 'delete':
            deleteMessage(msg);
            break;
        case 'quote':
            quoteMessage(msg);
            break;
        case 'edit':
            openEditBubble(msg);
            break;
        case 'screenshot':
            screenshotBubble(msg);
            break;
        case 'multiselect':
            enterMultiselectMode(msg);
            break;
        case 'recall':
            recallMessage(msg);
            break;
    }
}

// 1. 复制消息
function copyMessage(msg) {
    navigator.clipboard.writeText(msg.content).then(() => {
        showToast('已复制到剪贴板');
    }).catch(() => {
        showToast('复制失败');
    });
}

// 2. 转发消息
function openForwardDialog(msg) {
    if (!forwardOverlay) return;
    const preview = $('forwardDialogPreview');
    if (preview) {
        preview.textContent = msg.content;
    }
    forwardOverlay.style.display = 'flex';
    forwardOverlay._forwardMsg = msg;
}

function confirmForward() {
    if (!forwardOverlay || !forwardOverlay._forwardMsg) return;
    const msg = forwardOverlay._forwardMsg;
    addMsg(msg.content, 'user');
    forwardOverlay.style.display = 'none';
    forwardOverlay._forwardMsg = null;
    showToast('消息已转发');
}

// 3. 收藏消息
function favoriteMessage(msg) {
    // 检查是否已收藏
    const exists = favorites.find(f => f.id === msg.id);
    if (exists) {
        showToast('该消息已在收藏中');
        return;
    }
    favorites.unshift({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        time: msg.time,
        favTime: getTime()
    });
    // 最多保存50条
    if (favorites.length > 50) favorites = favorites.slice(0, 50);
    db.favorites.put({id:"favorites", data: favorites});
    showToast('已收藏');
}

function renderFavorites() {
    const list = $('favoritesList');
    if (!list) return;
    
    if (favorites.length === 0) {
        list.innerHTML = '<div class="favorites-empty">暂无收藏消息</div>';
        return;
    }
    
    list.innerHTML = favorites.map(f => `
        <div class="favorite-item">
            <div class="favorite-item-content">${esc(f.content)}</div>
            <div class="favorite-item-meta">
                <span>${f.role === 'user' ? '你' : 'AI'} · ${f.time}</span>
                <div class="favorite-item-actions">
                    <button class="favorite-item-btn" data-action="copy" data-id="${f.id}">复制</button>
                    <button class="favorite-item-btn" data-action="remove" data-id="${f.id}">移除</button>
                </div>
            </div>
        </div>
    `).join('');
    
    // 绑定收藏列表操作
    list.querySelectorAll('.favorite-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (action === 'remove') {
                favorites = favorites.filter(f => f.id !== id);
                db.favorites.put({id:"favorites", data: favorites});
                renderFavorites();
                showToast('已从收藏移除');
            } else if (action === 'copy') {
                const fav = favorites.find(f => f.id === id);
                if (fav) {
                    navigator.clipboard.writeText(fav.content).then(() => showToast('已复制'));
                }
            }
        });
    });
}

// 4. 删除消息
function deleteMessage(msg) {
    // 从消息列表移除
    STATE.messages = STATE.messages.filter(m => m.id !== msg.id);
    // 从 DOM 移除
    const msgEl = messagesArea.querySelector(`.message[data-id="${msg.id}"]`);
    if (msgEl) {
        msgEl.style.transition = 'all 0.3s ease-out';
        msgEl.style.opacity = '0';
        msgEl.style.transform = 'scale(0.8)';
        msgEl.style.maxHeight = msgEl.offsetHeight + 'px';
        requestAnimationFrame(() => {
            msgEl.style.maxHeight = '0';
            msgEl.style.padding = '0';
            msgEl.style.margin = '0';
        });
        setTimeout(() => msgEl.remove(), 300);
    }
    showToast('消息已删除');
}

// 5. 多选模式
function enterMultiselectMode(msg) {
    isMultiselectMode = true;
    selectedMsgs = new Set();
    selectedMsgs.add(msg.id);
    
    // 给消息区域添加多选样式
    messagesArea.classList.add('multiselect-mode');
    
    // 为每条消息添加选择标记
    messagesArea.querySelectorAll('.message').forEach(msgEl => {
        if (!msgEl.querySelector('.message-select-check')) {
            const check = document.createElement('div');
            check.className = 'message-select-check';
            msgEl.appendChild(check);
        }
        if (msgEl.dataset.id === msg.id) {
            msgEl.classList.add('selected');
        }
    });
    
    // 显示多选工具栏
    if (multiselectBar) {
        multiselectBar.style.display = 'flex';
    }
    updateMultiselectUI();
}

function toggleMsgSelect(msgEl) {
    if (!isMultiselectMode) return;
    const id = msgEl.dataset.id;
    if (selectedMsgs.has(id)) {
        selectedMsgs.delete(id);
        msgEl.classList.remove('selected');
    } else {
        selectedMsgs.add(id);
        msgEl.classList.add('selected');
    }
    updateMultiselectUI();
}

function updateMultiselectUI() {
    const count = $('multiselectCount');
    if (count) {
        count.textContent = `已选择 ${selectedMsgs.size} 条`;
    }
}

function selectAllMessages() {
    if (!isMultiselectMode) return;
    const allMsgEls = messagesArea.querySelectorAll('.message[data-id]');
    
    if (selectedMsgs.size === allMsgEls.length && allMsgEls.length > 0) {
        selectedMsgs.clear();
        allMsgEls.forEach(msgEl => msgEl.classList.remove('selected'));
        if ($('multiselectSelectAllBtn')) $('multiselectSelectAllBtn').textContent = '全选';
    } else {
        allMsgEls.forEach(msgEl => {
            const id = msgEl.dataset.id;
            selectedMsgs.add(id);
            msgEl.classList.add('selected');
        });
        if ($('multiselectSelectAllBtn')) $('multiselectSelectAllBtn').textContent = '取消全选';
    }
    updateMultiselectUI();
}

function exitMultiselectMode() {
    isMultiselectMode = false;
    selectedMsgs.clear();
    messagesArea.classList.remove('multiselect-mode');
    messagesArea.querySelectorAll('.message').forEach(msgEl => {
        msgEl.classList.remove('selected');
        const check = msgEl.querySelector('.message-select-check');
        if (check) check.remove();
    });
    if (multiselectBar) multiselectBar.style.display = 'none';
    if ($('multiselectSelectAllBtn')) $('multiselectSelectAllBtn').textContent = '全选';
}

function screenshotSelectedMessages() {
    if (selectedMsgs.size === 0) return;
    
    const allMsgEls = Array.from(messagesArea.querySelectorAll('.message[data-id]'));
    const selectedEls = allMsgEls.filter(el => selectedMsgs.has(el.dataset.id));
    
    const msgs = selectedEls.map(el => getMsgById(el.dataset.id)).filter(Boolean);
    if (msgs.length === 0) return;
    
    const flash = document.createElement('div');
    flash.className = 'screenshot-flash';
    document.querySelector('.phone-body').appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 2;
    const padding = 20;
    const bubblePadding = 12;
    const lineHeight = 22;
    const maxWidth = 260; 
    const canvasWidth = 375; 
    
    let totalHeight = padding;
    const bubblesData = msgs.map(msg => {
        ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
        const lines = [];
        const paragraphs = msg.content.split('\n');
        paragraphs.forEach(p => {
            if (p === '') {
                lines.push('');
                return;
            }
            let currentLine = '';
            for (let i = 0; i < p.length; i++) {
                const char = p[i];
                const testLine = currentLine + char;
                if (ctx.measureText(testLine).width > maxWidth - bubblePadding * 2 && currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = char;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);
        });
        const bubbleHeight = lines.length * lineHeight + bubblePadding * 2;
        const data = { msg, lines, height: bubbleHeight, y: totalHeight };
        totalHeight += bubbleHeight + 15;
        return data;
    });
    totalHeight += padding;
    
    canvas.width = canvasWidth * scale;
    canvas.height = totalHeight * scale;
    ctx.scale(scale, scale);
    
    ctx.fillStyle = '#f2f2f7';
    ctx.fillRect(0, 0, canvasWidth, totalHeight);
    
    bubblesData.forEach(b => {
        const isUser = b.msg.role === 'user';
        const bgColor = isUser ? '#007aff' : '#ffffff';
        const textColor = isUser ? '#ffffff' : '#1a1a1a';
        
        ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
        
        let maxLineWidth = 0;
        b.lines.forEach(l => {
            const w = ctx.measureText(l).width;
            if (w > maxLineWidth) maxLineWidth = w;
        });
        const bubbleWidth = maxLineWidth + bubblePadding * 2;
        
        const x = isUser ? canvasWidth - padding - bubbleWidth : padding + 40;
        
        if (isUser) {
            ctx.fillStyle = '#007aff';
            ctx.beginPath();
            ctx.arc(canvasWidth - padding + 15, b.y + 15, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('我', canvasWidth - padding + 15, b.y + 15);
        } else {
            ctx.fillStyle = '#667eea';
            ctx.beginPath();
            ctx.arc(padding + 15, b.y + 15, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('AI', padding + 15, b.y + 15);
        }
        
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(x, b.y, bubbleWidth, b.height, 14);
        ctx.fill();
        
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
        b.lines.forEach((line, i) => {
            ctx.fillText(line, x + bubblePadding, b.y + bubblePadding + i * lineHeight);
        });
    });
    
    canvas.toBlob(blob => {
        if (blob) {
            navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]).then(() => {
                showToast('长截图已复制到剪贴板');
                exitMultiselectMode();
            }).catch(() => {
                showToast('截图失败');
            });
        }
    });
}

function deleteSelectedMessages() {
    if (selectedMsgs.size === 0) return;
    if (!confirm(`确定删除选中的 ${selectedMsgs.size} 条消息？`)) return;
    
    selectedMsgs.forEach(id => {
        STATE.messages = STATE.messages.filter(m => m.id !== id);
        const msgEl = messagesArea.querySelector(`[data-id="${id}"]`);
        if (msgEl) msgEl.remove();
    });
    
    exitMultiselectMode();
    showToast(`已删除 ${selectedMsgs.size} 条消息`);
}

function forwardSelectedMessages() {
    if (selectedMsgs.size === 0) return;
    const sortedIds = [...selectedMsgs];
    const msgs = sortedIds.map(id => getMsgById(id)).filter(Boolean);
    const content = msgs.map(m => m.content).join('\n\n---\n\n');
    addMsg(content, 'user');
    exitMultiselectMode();
    showToast(`已转发 ${msgs.length} 条消息`);
}

// 6. 引用消息
function quoteMessage(msg) {
    quoteTarget = msg;
    if (quotePreviewBar && $('quotePreviewContent')) {
        $('quotePreviewContent').textContent = msg.content.length > 50 ? msg.content.slice(0, 50) + '...' : msg.content;
        quotePreviewBar.style.display = 'flex';
    }
}

function clearQuote() {
    quoteTarget = null;
    if (quotePreviewBar) quotePreviewBar.style.display = 'none';
}

// 7. 截图气泡
function screenshotBubble(msg) {
    const msgEl = messagesArea.querySelector(`.message[data-id="${msg.id}"]`);
    if (!msgEl) {
        showToast('消息元素未找到');
        return;
    }
    
    const bubble = msgEl.querySelector('.message-bubble');
    if (!bubble) {
        showToast('气泡未找到');
        return;
    }
    
    // 创建闪光效果
    const flash = document.createElement('div');
    flash.className = 'screenshot-flash';
    document.querySelector('.phone-body').appendChild(flash);
    setTimeout(() => flash.remove(), 500);
    
    // 使用 Canvas 截图
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const rect = bubble.getBoundingClientRect();
    const padding = 12;
    const scale = 2;
    
    canvas.width = (rect.width + padding * 2) * scale;
    canvas.height = (rect.height + padding * 2) * scale;
    ctx.scale(scale, scale);
    
    // 绘制背景
    const bgColor = msg.role === 'user' ? '#007aff' : '#ffffff';
    const radius = 14;
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(padding, padding, rect.width, rect.height, radius);
    ctx.fill();
    
    // 绘制文字
    ctx.fillStyle = msg.role === 'user' ? '#ffffff' : '#1a1a1a';
    ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
    ctx.textBaseline = 'top';
    
    const maxWidth = rect.width - 20;
    const lineHeight = 22;
    const text = msg.content;
    const lines = wrapText(ctx, text, maxWidth);
    
    lines.forEach((line, i) => {
        ctx.fillText(line, padding + 10, padding + 10 + i * lineHeight);
    });
    
    // 复制到剪贴板
    canvas.toBlob(blob => {
        if (blob) {
            navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]).then(() => {
                showToast('截图已复制到剪贴板');
            }).catch(() => {
                showToast('截图失败');
            });
        }
    });
}

function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let currentLine = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const testLine = currentLine + char;
        if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = char;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

// 8. 编辑气泡
function openEditBubble(msg) {
    if (!editBubbleOverlay) return;
    const textarea = $('editBubbleTextarea');
    if (textarea) {
        textarea.value = msg.content;
    }
    editBubbleOverlay.style.display = 'flex';
    editBubbleOverlay._editMsg = msg;
}

function confirmEditBubble() {
    if (!editBubbleOverlay || !editBubbleOverlay._editMsg) return;
    const msg = editBubbleOverlay._editMsg;
    const textarea = $('editBubbleTextarea');
    const newContent = textarea ? textarea.value.trim() : '';
    
    if (!newContent) {
        showToast('内容不能为空');
        return;
    }
    
    // 更新消息内容
    msg.content = newContent;
    
    // 更新 DOM
    const bubble = messagesArea.querySelector(`.message[data-id="${msg.id}"] .message-bubble`);
    if (bubble) {
        bubble.textContent = newContent;
    }
    
    editBubbleOverlay.style.display = 'none';
    editBubbleOverlay._editMsg = null;
    showToast('消息已编辑');
}

// 9. 撤回消息
function recallMessage(msg) {
    // 撤回提示文本将根据角色动态生成
    
    // 检查是否在2分钟内
    const msgTime = msg.time;
    // 从消息列表中移除
    STATE.messages = STATE.messages.filter(m => m.id !== msg.id);
    
    // 从 DOM 移除消息气泡
    const msgEl = messagesArea.querySelector(`.message[data-id="${msg.id}"]`);
    if (msgEl) {
        msgEl.style.transition = 'all 0.3s ease-out';
        msgEl.style.opacity = '0';
        msgEl.style.transform = 'translateX(20px)';
        setTimeout(() => {
            msgEl.remove();
            // 添加撤回提示
            const tip = document.createElement('div');
            tip.className = 'message system';
            tip.style.cssText = 'justify-content:center;padding:4px 0';
            if (msg.role === 'user') {
                tip.innerHTML = `<span style="font-size:12px;color:#8e8e93">你撤回了一条消息 <span class="re-edit-btn" style="color:#576b95;cursor:pointer;margin-left:4px;">重新编辑</span></span>`;
                const reEditBtn = tip.querySelector('.re-edit-btn');
                reEditBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    messageInput.value = msg.content;
                    messageInput.focus();
                    updateBtn();
                });
            } else {
                tip.innerHTML = `<span style="font-size:12px;color:#8e8e93">对方撤回了一条消息</span>`;
            }
            messagesArea.appendChild(tip);
            scrollBottom();
        }, 300);
    }
    
    showToast('消息已撤回');
}

// ===== 长按检测 =====
function initLongPress(el) {
    let touchStartX = 0;
    let touchStartY = 0;
    let moved = false;
    
    el.addEventListener('touchstart', (e) => {
        if (isMultiselectMode) return;
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        moved = false;
        
        cancelLongPress();
        longPressTimer = setTimeout(() => {
            if (!moved) {
                const msgEl = getMsgElement(el);
                if (msgEl) {
                    const msgId = msgEl.dataset.id;
                    if (msgId) {
                        showContextMenu(touchStartX, touchStartY, msgId);
                    }
                }
            }
        }, LONG_PRESS_DURATION);
    });
    
    el.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        if (Math.abs(touch.clientX - touchStartX) > 10 || Math.abs(touch.clientY - touchStartY) > 10) {
            moved = true;
            cancelLongPress();
        }
    });
    
    el.addEventListener('touchend', () => {
        cancelLongPress();
        if (isMultiselectMode && !moved) {
            const msgEl = getMsgElement(el);
            if (msgEl) toggleMsgSelect(msgEl);
        }
    });
    
    // 桌面右键
    el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (isMultiselectMode) return;
        const msgEl = getMsgElement(el);
        if (msgEl) {
            const msgId = msgEl.dataset.id;
            if (msgId) {
                showContextMenu(e.clientX, e.clientY, msgId);
            }
        }
    });
}

// 点击任意位置关闭菜单
document.addEventListener('click', (e) => {
    if (ctxMenuVisible) {
        const menu = bubbleContextMenu;
        if (menu && !menu.contains(e.target)) {
            hideContextMenu();
        }
    }
});

document.addEventListener('touchstart', (e) => {
    if (ctxMenuVisible) {
        const menu = bubbleContextMenu;
        if (menu && !menu.contains(e.target)) {
            hideContextMenu();
        }
    }
});

// ===== 上下文菜单项点击 =====
document.addEventListener('DOMContentLoaded', () => {
    if (bubbleContextMenu) {
        bubbleContextMenu.querySelectorAll('.ctx-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                handleCtxAction(item.dataset.action);
            });
        });
    }
});

// 初始化时绑定（DOMContentLoaded 可能已触发，直接绑定）
if (bubbleContextMenu) {
    bubbleContextMenu.querySelectorAll('.ctx-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            handleCtxAction(item.dataset.action);
        });
    });
}

// ===== 多选工具栏事件 =====
if ($('multiselectCancelBtn')) {
    $('multiselectCancelBtn').addEventListener('click', exitMultiselectMode);
}
if ($('multiselectSelectAllBtn')) {
    $('multiselectSelectAllBtn').addEventListener('click', selectAllMessages);
}
if ($('multiselectScreenshotBtn')) {
    $('multiselectScreenshotBtn').addEventListener('click', screenshotSelectedMessages);
}
if ($('multiselectDeleteBtn')) {
    $('multiselectDeleteBtn').addEventListener('click', deleteSelectedMessages);
}
if ($('multiselectForwardBtn')) {
    $('multiselectForwardBtn').addEventListener('click', forwardSelectedMessages);
}

// ===== 编辑气泡弹窗事件 =====
if ($('editBubbleCancel')) {
    $('editBubbleCancel').addEventListener('click', () => {
        if (editBubbleOverlay) {
            editBubbleOverlay.style.display = 'none';
            editBubbleOverlay._editMsg = null;
        }
    });
}
if ($('editBubbleConfirm')) {
    $('editBubbleConfirm').addEventListener('click', confirmEditBubble);
}

// ===== 转发弹窗事件 =====
if ($('forwardDialogCancel')) {
    $('forwardDialogCancel').addEventListener('click', () => {
        if (forwardOverlay) {
            forwardOverlay.style.display = 'none';
            forwardOverlay._forwardMsg = null;
        }
    });
}
if ($('forwardDialogConfirm')) {
    $('forwardDialogConfirm').addEventListener('click', confirmForward);
}

// ===== 引用关闭事件 =====
if ($('closeQuote')) {
    $('closeQuote').addEventListener('click', clearQuote);
}

// ===== 收藏按钮事件 =====
const favoritesBtn = $('favoritesBtn');
if (favoritesBtn) {
    favoritesBtn.addEventListener('click', () => {
        renderFavorites();
        if (favoritesPanel) {
            favoritesPanel.style.display = 'flex';
        }
    });
}

// 关闭收藏面板
if ($('closeFavorites')) {
    $('closeFavorites').addEventListener('click', () => {
        if (favoritesPanel) {
            favoritesPanel.style.display = 'none';
        }
    });
}

// ===== 覆盖 handleSend 以支持引用 =====
const origHandleSend = handleSend;
handleSend = async function() {
    const text = messageInput.value.trim();
    if (!text || STATE.isProcessing) return;
    closeEmojiPanel();
    
    // 如果有引用，在消息前添加引用格式
    if (quoteTarget) {
        const quotedContent = quoteTarget.content.length > 50 ? quoteTarget.content.slice(0, 50) + '...' : quoteTarget.content;
        messageInput.value = `> ${quotedContent}\n${text}`;
        clearQuote();
    }
    
    addMsg(messageInput.value || text, 'user');
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
            avHtml = `<svg viewBox="0 0 40 40" width="32" height="32"><defs><linearGradient id="ast2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${avatarC1}"/><stop offset="100%" style="stop-color:${avatarC2}"/></linearGradient></defs><circle cx="20" cy="20" r="20" fill="url(#ast2)"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">AI</text></svg>`;
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
};

// ===== 为消息添加长按监听 =====
const origRenderMsg = renderMsg;
renderMsg = function(msg) {
    origRenderMsg(msg);
    // 等待 DOM 渲染完成后绑定长按
    requestAnimationFrame(() => {
        const msgEl = messagesArea.querySelector(`.message[data-id="${msg.id}"]`);
        if (msgEl && !msgEl._longPressBound) {
            initLongPress(msgEl);
            msgEl._longPressBound = true;
        }
    });
};

// ===== 为欢迎消息绑定长按 =====
document.addEventListener('DOMContentLoaded', () => {
    const welcomeMsg = messagesArea.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.dataset.id = 'welcome';
    }
});

// ===== 图片压缩工具 =====
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1080;
            const MAX_HEIGHT = 1920;
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Generate Blob instead of base64
            canvas.toBlob((blob) => {
                if (blob) {
                    callback(blob);
                } else {
                    callback(null);
                }
            }, 'image/jpeg', 0.85);
        };
        img.onerror = () => callback(null);
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
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
        STATE.settings.userAvatarImage = ''; saveMedia('user_avatar_img', null);
        
        
        
        applyUserAvatar(); saveSetting("settings", STATE.settings);
    });
});

// 用户图片上传
$('uploadUserAvatarBtn').addEventListener('click', () => $('userAvatarFileInput').click());
$('userAvatarFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    compressImage(file, (dataUrl) => {
        STATE.settings.userAvatarImage = dataUrl;
        STATE.settings.userAvatarC1 = '#007aff';
        STATE.settings.userAvatarC2 = '#5856d6';
        try {
            
            
            
        } catch(err) {
            console.error(err);
        }
        applyUserAvatar(); saveSetting("settings", STATE.settings);
        showToast('用户头像已更新');
        e.target.value = '';
    });
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
        STATE.settings.avatarImage = ''; saveMedia('ai_avatar_img', null);
        
        
        
        applyAvatar(); saveSetting("settings", STATE.settings);
    });
});

// AI 图片上传
$('uploadAvatarBtn').addEventListener('click', () => $('avatarFileInput').click());
$('avatarFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    compressImage(file, (dataUrl) => {
        STATE.settings.avatarImage = dataUrl;
        STATE.settings.avatarC1 = '#667eea';
        STATE.settings.avatarC2 = '#764ba2';
        try {
            
            
            
        } catch(err) {}
        applyAvatar(); saveSetting("settings", STATE.settings);
        showToast('AI 头像已更新');
        e.target.value = '';
    });
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
    applyUserAvatar(); saveSetting("settings", STATE.settings);
}

async function saveSettings() {
    STATE.settings.apiEndpoint = $('apiEndpoint').value.trim() || 'https://api.openai.com/v1';
    STATE.settings.apiKey = $('apiKey').value.trim();
    STATE.settings.model = $('modelSelect').value;
    STATE.settings.customModel = $('customModel').value.trim();
    STATE.settings.systemPrompt = $('systemPrompt').value.trim() || '你是一个乐于助人的AI助手。';
    STATE.settings.userPrompt = $('userPrompt').value.trim();
    STATE.settings.temperature = parseFloat($('temperature').value);
    STATE.settings.maxTokens = parseInt($('maxTokens').value);
    await saveSetting('settings', STATE.settings);
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

    // 更新自定义图片预览
    const customImgPreview = document.querySelector('.wallpaper-item[data-wallpaper="custom"] .wallpaper-preview');
    if (customImgPreview) {
        if (theme.wallpaperImage) {
            customImgPreview.style.background = `url('${theme.wallpaperImage}') center/cover no-repeat`;
            customImgPreview.innerHTML = '';
        } else {
            customImgPreview.style.background = '';
            customImgPreview.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="#8e8e93"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>`;
        }
    }

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

    bg.innerHTML = '';
    
    if (wallpaper === 'custom' && wallpaperImage) {
        bg.style.background = `url(${wallpaperImage}) center/cover no-repeat`;
    } else if (wallpaper === 'customColor') {
        bg.style.background = customColorHex;
    } else if (WALLPAPERS[wallpaper]) {
        bg.style.background = WALLPAPERS[wallpaper];
    } else {
        bg.style.background = WALLPAPERS[DEFAULT_WALLPAPER] || '#fff';
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
            compressImage(file, (dataUrl) => {
                STATE.settings.theme.iconImages[appName] = dataUrl;
                try {
                    
                } catch(err) {
                    showToast('空间不足，可能无法永久保存');
                }
                applyIconColors();
                showToast(`${appName} 图标已更新`);
                e.target.value = '';
            });
        });
    });
}

async function saveTheme() {
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

    
    
    
    await saveSetting('settings', STATE.settings);
    

    // 清理旧版 iconColors 数据
    

    applyTheme();
    showToast('主题已保存');
}

// ===== 恢复默认图标 =====
function resetIcons() {
    // 清空所有自定义图标图片
    STATE.settings.theme.iconImages = {};
    
    // 清理旧版 iconColors
    
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
    compressImage(file, (dataUrl) => {
        STATE.settings.theme.wallpaperImage = dataUrl;
        STATE.settings.theme.wallpaper = 'custom';
        try {
            
            
        } catch (err) {
            console.error(err);
            showToast('图片太大，部分存储可能失败');
        }
        applyWallpaper();
        loadThemeUI();
        showToast('壁纸已更换');
        e.target.value = ''; // 清空选中状态，以便下次可选同一张图
    });
});

// 图标大小滑块
$('iconSize').addEventListener('input', (e) => {
    $('iconSizeValue').textContent = e.target.value;
});

// 保存主题
$('saveThemeBtn').addEventListener('click', saveTheme);


async function bootApp() {
    try {
        // Load Settings
        const s = await db.settings.get('settings');
        if (s && s.value) {
            STATE.settings = { ...STATE.settings, ...s.value };
        }
        
        
        const uImg = await getMedia('user_avatar_img');
        if (uImg) STATE.settings.userAvatarImage = uImg;

        const aImg = await getMedia('ai_avatar_img');
        if (aImg) STATE.settings.avatarImage = aImg;

        const wImg = await getMedia('theme_wallpaper_img');
        if (wImg) STATE.settings.theme.wallpaperImage = wImg;

        const apps = ['chat', 'settings', 'theme', 'photos', 'music', 'safari', 'weather', 'notes', 'clock'];
        if (!STATE.settings.theme.iconImages) STATE.settings.theme.iconImages = {};
        for (const app of apps) {
            const m = await getMedia('icon_' + app);
            if (m) STATE.settings.theme.iconImages[app] = m;
        }

        // Load Agents
        const ag = await db.agents.get('agents');
        if (ag && ag.data) { STATE.agents = ag.data; }
        
        const ac = await db.agentChats.get('chats');
        if (ac && ac.data) { STATE.agentChats = ac.data; }
        
        const currId = await getSetting('current_agent_id', null);
        STATE.currentAgentId = currId;
        
        // Load Favorites
        const fav = await db.favorites.get('favorites');
        if (fav && fav.data) { favorites = fav.data; }

        // Select initial agent & messages
        if (STATE.currentAgentId && STATE.currentAgentId !== DEFAULT_AGENT_ID) {
            const agt = STATE.agents.find(a => a.id === STATE.currentAgentId);
            if (agt) {
                STATE.settings.systemPrompt = agt.systemPrompt;
                STATE.settings.avatarC1 = agt.avatarC1;
                STATE.settings.avatarC2 = agt.avatarC2;
                STATE.settings.avatarImage = agt.avatarImage;
                STATE.messages = (STATE.agentChats[agt.id] && STATE.agentChats[agt.id].messages) ? STATE.agentChats[agt.id].messages : [];
                updateChatHeaderForAgent(agt);
            } else {
                STATE.currentAgentId = DEFAULT_AGENT_ID;
            }
        }
        
        if (!STATE.currentAgentId || STATE.currentAgentId === DEFAULT_AGENT_ID) {
            STATE.currentAgentId = DEFAULT_AGENT_ID;
            const defMsgs = await db.agentChats.get('default_messages');
        const dm = (defMsgs && defMsgs.data) ? defMsgs.data : [];
        if (!STATE.agentChats[DEFAULT_AGENT_ID]) STATE.agentChats[DEFAULT_AGENT_ID] = { messages: dm };
        STATE.messages = dm;
        updateChatHeaderForAgent(getDefaultAgent());
        }

        // Initialize UI
        buildEmojis();
        updateBtn();
        applyAvatar();
        saveSetting("settings", STATE.settings);
applyUserAvatar();
saveSetting("settings", STATE.settings);
        applyTheme();
        bindIconUploads();
        rerenderMessages();
        scrollBottom();

    } catch (e) {
        console.error("Boot failure:", e);
    }
}
bootApp();


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
// ===== 智能体管理 =====
const pageAgents = $('pageAgents');

// 初始化 STATE.agents
STATE.agents = [];
STATE.currentAgentId = null;
STATE.agentChats = {};

// 注册 agents 页面到 pageMap
pageMap.agents = pageAgents;

// 保存 agents 到 localStorage
async function saveAgents() { await db.agents.put({id:"agents", data: STATE.agents}); }
async function saveAgentChats() { await db.agentChats.put({id:"chats", data: STATE.agentChats}); }

// 渲染智能体列表
// 默认 AI 助手的固定 ID
const DEFAULT_AGENT_ID = '__default__';

function getDefaultAgent() {
    return {
        id: DEFAULT_AGENT_ID,
        name: 'AI 助手',
        systemPrompt: STATE.settings.systemPrompt,
        avatarC1: STATE.settings.avatarC1,
        avatarC2: STATE.settings.avatarC2,
        avatarImage: STATE.settings.avatarImage
    };
}

function renderAgentList() {
    const list = $('agentsList');
    const wrap = $('agentsListWrap');
    if (!list || !wrap) return;
    
    const searchTerm = ($('agentsSearchInput')?.value || '').toLowerCase().trim();
    
    // 构建列表：仅自定义智能体
    let allChats = [];
    
    const customAgents = STATE.agents.filter(a => !searchTerm || a.name.toLowerCase().includes(searchTerm));
    customAgents.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });
    
    customAgents.forEach(agent => {
        allChats.push({ agent, isDefault: false, isPinned: agent.isPinned });
    });
    
    // 无结果时显示空状态
    if (allChats.length === 0) {
        list.innerHTML = '';
        const emptyState = $('agentsEmptyState');
        if (emptyState) list.appendChild(emptyState);
        return;
    }
    
    list.innerHTML = allChats.map(({ agent, isDefault, isPinned }) => {
        let chat, lastMsg = '', lastTime = '', unread = 0;
        if (isDefault) {
            // 从默认聊天记录获取
            const msgs = STATE.agentChats[DEFAULT_AGENT_ID] ? STATE.agentChats[DEFAULT_AGENT_ID].messages : [];
            if (msgs.length > 0) {
                const last = msgs[msgs.length - 1];
                lastMsg = last.content.length > 30 ? last.content.slice(0, 30) + '...' : last.content;
                lastTime = last.time;
            }
        } else {
            chat = STATE.agentChats[agent.id];
            if (chat && chat.messages && chat.messages.length > 0) {
                const last = chat.messages[chat.messages.length - 1];
                lastMsg = last.content.length > 30 ? last.content.slice(0, 30) + '...' : last.content;
                lastTime = last.time;
                unread = chat.unread || 0;
            }
        }
        
        const avatarHtml = agent.avatarImage
            ? `<img src="${agent.avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
            : `<span>${agent.name.charAt(0)}</span>`;
        
        const badgeHtml = unread > 0 ? `<span class="agent-badge">${unread > 99 ? '99+' : unread}</span>` : '';
        const pinnedIcon = isPinned ? `<svg class="agent-pinned" viewBox="0 0 24 24" width="14" height="14" fill="#8e8e93"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>` : '';
        
        return `
            <div class="agent-row-wrapper${isPinned ? ' agent-row-pinned' : ''}" data-agent-id="${agent.id}">
                <div class="agent-row-actions">
                    <button class="swipe-btn unread" onclick="handleSwipeAction(event, 'unread', '${agent.id}')">${unread > 0 ? '标为已读' : '标为未读'}</button>
                    <button class="swipe-btn pin" onclick="handleSwipeAction(event, 'pin', '${agent.id}')">${isPinned ? '取消置顶' : '置顶'}</button>
                    <button class="swipe-btn delete" onclick="handleSwipeAction(event, 'delete', '${agent.id}')">删除</button>
                </div>
                <div class="agent-row">
                    <div class="agent-avatar" style="background:linear-gradient(135deg,${agent.avatarC1},${agent.avatarC2})">${avatarHtml}</div>
                    <div class="agent-info">
                        <div class="agent-info-top">
                            <span class="agent-name">${pinnedIcon} ${escHTML(agent.name)}</span>
                            ${lastTime ? `<span class="agent-time">${lastTime}</span>` : ''}
                        </div>
                        <div class="agent-last-msg">${lastMsg || '点击开始对话'}</div>
                    </div>
                    ${badgeHtml}
                </div>
            </div>
        `;
    }).join('');
    
    // 绑定滑动事件
    initAgentSwipes(list);
}

function escHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// 选择聊天对象（默认 AI 助手或智能体）
function selectAgent(agentId) {
    const isDefault = agentId === DEFAULT_AGENT_ID;
    let agent;
    
    if (isDefault) {
        agent = getDefaultAgent();
    } else {
        agent = STATE.agents.find(a => a.id === agentId);
        if (!agent) return;
    }
    
    STATE.currentAgentId = agentId;
    saveSetting("current_agent_id", agentId);
    
    // 更新聊天头部
    updateChatHeaderForAgent(agent);
    
    // 加载聊天记录
    if (isDefault) {
        STATE.messages = STATE.agentChats[DEFAULT_AGENT_ID] ? STATE.agentChats[DEFAULT_AGENT_ID].messages : [];
    } else if (STATE.agentChats[agentId]) {
        STATE.messages = STATE.agentChats[agentId].messages || [];
        STATE.agentChats[agentId].unread = 0;
        saveAgentChats();
    } else {
        STATE.messages = [];
        STATE.agentChats[agentId] = { messages: [], unread: 0 };
        saveAgentChats();
    }
    
    // 更新系统提示词和头像
    STATE.settings.systemPrompt = agent.systemPrompt;
    STATE.settings.avatarC1 = agent.avatarC1;
    STATE.settings.avatarC2 = agent.avatarC2;
    STATE.settings.avatarImage = agent.avatarImage || '';
    applyAvatar(); saveSetting("settings", STATE.settings);
    
    // 关闭智能体页面，打开聊天页面
    if (pageAgents) pageAgents.classList.remove('active');
    currentApp = null;
    appStack = [];
    
    // 重新渲染消息区域
    rerenderMessages();
    
    // 打开聊天页面
    openApp('chat');
    setTimeout(() => {
        if (messageInput) messageInput.focus();
    }, 400);
    
    showToast(isDefault ? 'AI 助手' : `已切换到 ${agent.name}`);
}

function updateChatHeaderForAgent(agent) {
    const headerAv = $('chatHeaderAvatar');
    const headerName = document.querySelector('.header-name');
    const headerStatus = document.querySelector('.header-status');
    
    if (headerName) headerName.textContent = agent.name;
    if (headerStatus) headerStatus.textContent = '在线';
    
    if (headerAv) {
        if (agent.avatarImage) {
            headerAv.innerHTML = `<img src="${agent.avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        } else {
            headerAv.innerHTML = `<svg viewBox="0 0 40 40" width="34" height="34">
                <defs><linearGradient id="agH" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${agent.avatarC1}"/><stop offset="100%" style="stop-color:${agent.avatarC2}"/></linearGradient></defs>
                <circle cx="20" cy="20" r="20" fill="url(#agH)"/>
                <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="Arial">${agent.name.charAt(0)}</text>
            </svg>`;
        }
        if (!headerAv.querySelector('.online-dot')) {
            const dot = document.createElement('span');
            dot.className = 'online-dot';
            headerAv.appendChild(dot);
        }
    }
}

function rerenderMessages() {
    // 只移除消息和打字指示器，保留面板（收藏面板等）
    messagesArea.querySelectorAll('.message, .typing-indicator').forEach(el => el.remove());
    STATE.messages.forEach(msg => {
        renderMsg(msg);
    });
    // 重新绑定长按
    requestAnimationFrame(() => {
        messagesArea.querySelectorAll('.message').forEach(msgEl => {
            if (!msgEl._longPressBound && msgEl.dataset.id) {
                initLongPress(msgEl);
                msgEl._longPressBound = true;
            }
        });
    });
    scrollBottom();
}

// 长按智能体
function initAgentLongPress(row) {
    let touchStartX = 0, touchStartY = 0, moved = false, timer = null;
    
    row.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        moved = false;
        timer = setTimeout(() => {
            if (!moved) {
                showAgentActionMenu(touchStartX, touchStartY, row.dataset.agentId);
            }
        }, 500);
    });
    
    row.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        if (Math.abs(touch.clientX - touchStartX) > 10 || Math.abs(touch.clientY - touchStartY) > 10) {
            moved = true;
            if (timer) { clearTimeout(timer); timer = null; }
        }
    });
    
    row.addEventListener('touchend', () => {
        if (timer) { clearTimeout(timer); timer = null; }
    });
    
    row.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showAgentActionMenu(e.clientX, e.clientY, row.dataset.agentId);
    });
}

function showAgentActionMenu(x, y, agentId) {
    const menu = $('agentActionMenu');
    if (!menu) return;
    menu.style.display = 'block';
    menu.dataset.agentId = agentId;
    
    // 更新置顶文本
    const agent = STATE.agents.find(a => a.id === agentId);
    const pinText = $('agentActionPinText');
    if (pinText && agent) {
        pinText.textContent = agent.isPinned ? '取消置顶' : '置顶聊天';
    }
    
    // 调整位置
    const rect = menu.getBoundingClientRect();
    const phoneRect = document.querySelector('.phone-body').getBoundingClientRect();
    
    let left = x - phoneRect.left;
    let top = y - phoneRect.top;
    
    if (left + rect.width > phoneRect.width - 10) left = phoneRect.width - rect.width - 10;
    if (left < 10) left = 10;
    if (top + rect.height > phoneRect.height - 10) top = top - rect.height;
    if (top < 60) top = 60;
    
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
}

function hideAgentActionMenu() {
    const menu = $('agentActionMenu');
    if (menu) {
        menu.style.display = 'none';
        menu.dataset.agentId = '';
    }
}

// 智能体操作菜单（仅对非默认智能体生效）
function handleAgentAction(action) {
    const menu = $('agentActionMenu');
    if (!menu) return;
    const agentId = menu.dataset.agentId;
    if (agentId === DEFAULT_AGENT_ID) { hideAgentActionMenu(); return; }
    const agent = STATE.agents.find(a => a.id === agentId);
    if (!agent) { hideAgentActionMenu(); return; }
    hideAgentActionMenu();
    
    switch (action) {
        case 'rename':
            openAgentEditOverlay(agent, 'rename');
            break;
        case 'edit':
            openAgentEditOverlay(agent, 'edit');
            break;
        case 'delete':
            if (confirm(`确定删除"${agent.name}"及其所有聊天记录？`)) {
                deleteAgent(agentId);
            }
            break;
        case 'pin':
            agent.isPinned = !agent.isPinned;
            saveAgents();
            renderAgentList();
            break;
    }
}

function openAgentEditOverlay(agent, mode) {
    const overlay = $('agentEditOverlay');
    const title = $('agentEditTitle');
    const nameInput = $('agentEditName');
    const promptTextarea = $('agentEditPrompt');
    const colorsContainer = $('agentAvatarColors');
    
    if (!overlay) return;
    
    if (mode === 'edit' || mode === 'rename') {
        if (title) title.textContent = mode === 'rename' ? '重命名智能体' : '编辑智能体';
        if (nameInput) nameInput.value = agent.name;
        if (promptTextarea) promptTextarea.value = agent.systemPrompt || '';
        if (colorsContainer) {
            colorsContainer.querySelectorAll('.agent-acolor').forEach(c => {
                c.classList.toggle('active', c.dataset.c1 === agent.avatarC1 && c.dataset.c2 === agent.avatarC2);
            });
        }
        overlay.dataset.editId = agent.id;
    } else {
        if (title) title.textContent = '新建智能体';
        if (nameInput) nameInput.value = '';
        if (promptTextarea) promptTextarea.value = '';
        if (colorsContainer) {
            colorsContainer.querySelectorAll('.agent-acolor').forEach((c, i) => {
                c.classList.toggle('active', i === 0);
            });
        }
        overlay.dataset.editId = '';
    }
    
    overlay.style.display = 'flex';
    setTimeout(() => { if (nameInput) nameInput.focus(); }, 100);
}

function saveAgentEdit() {
    const overlay = $('agentEditOverlay');
    if (!overlay) return;
    const agentId = overlay.dataset.editId;
    const name = ($('agentEditName')?.value || '').trim();
    const systemPrompt = ($('agentEditPrompt')?.value || '').trim();
    const activeColor = document.querySelector('.agent-acolor.active');
    const avatarC1 = activeColor?.dataset.c1 || '#667eea';
    const avatarC2 = activeColor?.dataset.c2 || '#764ba2';
    
    if (!name) {
        showToast('请输入智能体名称');
        return;
    }
    
    if (agentId) {
        // 编辑已有智能体
        const agent = STATE.agents.find(a => a.id === agentId);
        if (agent) {
            agent.name = name;
            agent.systemPrompt = systemPrompt;
            agent.avatarC1 = avatarC1;
            agent.avatarC2 = avatarC2;
            // 如果当前正在使用这个智能体，更新聊天头部和头像
            if (STATE.currentAgentId === agentId) {
                updateChatHeaderForAgent(agent);
                STATE.settings.avatarC1 = avatarC1;
                STATE.settings.avatarC2 = avatarC2;
                STATE.settings.avatarImage = '';
                STATE.settings.systemPrompt = systemPrompt;
                applyAvatar(); saveSetting("settings", STATE.settings);
            }
        }
    } else {
        // 新建智能体
        const newAgent = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            name: name,
            systemPrompt: systemPrompt,
            avatarC1: avatarC1,
            avatarC2: avatarC2,
            avatarImage: '',
            createdAt: getTime()
        };
        STATE.agents.push(newAgent);
        STATE.agentChats[newAgent.id] = { messages: [], unread: 0 };
        saveAgentChats();
    }
    
    saveAgents();
    hideAgentEditOverlay();
    renderAgentList();
    showToast(agentId ? '智能体已更新' : '智能体已创建');
}

function hideAgentEditOverlay() {
    const overlay = $('agentEditOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.dataset.editId = '';
    }
}

function deleteAgent(agentId) {
    if (agentId === DEFAULT_AGENT_ID) {
        showToast('默认 AI 助手不能删除');
        return;
    }
    STATE.agents = STATE.agents.filter(a => a.id !== agentId);
    delete STATE.agentChats[agentId];
    saveAgents();
    saveAgentChats();
    
    if (STATE.currentAgentId === agentId) {
        // 当前智能体被删除，切换到默认 AI
        STATE.currentAgentId = DEFAULT_AGENT_ID;
        saveSetting("current_agent_id", DEFAULT_AGENT_ID);
        const def = getDefaultAgent();
        STATE.settings.systemPrompt = def.systemPrompt;
        STATE.settings.avatarC1 = def.avatarC1;
        STATE.settings.avatarC2 = def.avatarC2;
        STATE.settings.avatarImage = def.avatarImage;
        STATE.messages = STATE.agentChats[DEFAULT_AGENT_ID] ? STATE.agentChats[DEFAULT_AGENT_ID].messages : [];
        applyAvatar(); saveSetting("settings", STATE.settings);
        rerenderMessages();
    }
    
    renderAgentList();
    showToast('智能体已删除');
}

// 保存当前聊天消息（默认 AI 或智能体）
function saveCurrentChatToAgent() {
    if (!STATE.currentAgentId) return;
    if (STATE.currentAgentId === DEFAULT_AGENT_ID) {
        // 保存默认 AI 助手的聊天记录
        db.agentChats.put({id:"default_messages", data: STATE.messages});
        return;
    }
    if (!STATE.agentChats[STATE.currentAgentId]) {
        STATE.agentChats[STATE.currentAgentId] = { messages: [], unread: 0 };
    }
    STATE.agentChats[STATE.currentAgentId].messages = [...STATE.messages];
    saveAgentChats();
}

// 修改 addMsg 以自动保存到当前智能体
const origAddMsgAgent = addMsg;
addMsg = function(content, role) {
    const msg = origAddMsgAgent(content, role);
    // 保存到智能体聊天记录
    if (STATE.currentAgentId) {
        saveCurrentChatToAgent();
    }
    return msg;
};

// 修改 deleteMessage 以保存
const origDeleteMsgAgent = deleteMessage;
deleteMessage = function(msg) {
    origDeleteMsgAgent(msg);
    if (STATE.currentAgentId) {
        saveCurrentChatToAgent();
    }
};

// 修改 recallMessage 以保存
const origRecallMsgAgent = recallMessage;
recallMessage = function(msg) {
    origRecallMsgAgent(msg);
    if (STATE.currentAgentId) {
        // 延迟等待 DOM 移除完成
        setTimeout(() => saveCurrentChatToAgent(), 50);
    }
};

// 修改 confirmEditBubble 以保存
const origConfirmEditAgent = confirmEditBubble;
confirmEditBubble = function() {
    origConfirmEditAgent();
    if (STATE.currentAgentId) {
        saveCurrentChatToAgent();
    }
};

// ===== 事件监听注册 =====
// 打开智能体页面
// 微信风格：点击 Uchat 始终先进入聊天列表
document.querySelectorAll('.app-icon[data-app="chat"]').forEach(icon => {
    icon.addEventListener('click', (e) => {
        if (e._agentHandled) return;
        e._agentHandled = true;
        e.stopImmediatePropagation();
        renderAgentList();
        openApp('agents');
    }, true); // 使用捕获阶段先执行
});

// 智能体页面返回按钮
if ($('backAgents')) {
    $('backAgents').addEventListener('click', () => {
        if (pageAgents) pageAgents.classList.remove('active');
        currentApp = null;
        appStack = [];
    });
}

// 新建智能体按钮
if ($('agentAddBtn')) {
    $('agentAddBtn').addEventListener('click', () => {
        openAgentEditOverlay(null, 'create');
    });
}

// 搜索过滤
if ($('agentsSearchInput')) {
    $('agentsSearchInput').addEventListener('input', () => {
        renderAgentList();
    });
}

// 编辑弹窗操作
if ($('agentEditCancel')) {
    $('agentEditCancel').addEventListener('click', hideAgentEditOverlay);
}
if ($('agentEditConfirm')) {
    $('agentEditConfirm').addEventListener('click', saveAgentEdit);
}

// 头像颜色选择
document.querySelectorAll('#agentAvatarColors .agent-acolor').forEach(el => {
    el.addEventListener('click', () => {
        document.querySelectorAll('#agentAvatarColors .agent-acolor').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    });
});

// 关闭智能体编辑弹窗（点击背景）
if ($('agentEditOverlay')) {
    $('agentEditOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            hideAgentEditOverlay();
        }
    });
}

// 智能体操作菜单项点击
if ($('agentActionMenu')) {
    $('agentActionMenu').querySelectorAll('.agent-action-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            handleAgentAction(item.dataset.action);
        });
    });
}

// 点击其他地方关闭智能体操作菜单
document.addEventListener('click', (e) => {
    const menu = $('agentActionMenu');
    if (menu && menu.style.display === 'block' && !menu.contains(e.target)) {
        hideAgentActionMenu();
    }
});
document.addEventListener('touchstart', (e) => {
    const menu = $('agentActionMenu');
    if (menu && menu.style.display === 'block' && !menu.contains(e.target)) {
        hideAgentActionMenu();
    }
});

// 修改 closeApp，关闭智能体页面同时重置
const origCloseAppAgent = closeApp;
closeApp = function() {
    if (currentApp === 'agents') {
        if (pageAgents) pageAgents.classList.remove('active');
        currentApp = null;
        appStack = [];
        if (!closeFromPopstate) {
            history.back();
        }
        return;
    }
    origCloseAppAgent();
};

// 修改 handleSend 以在发送 AI 回复后保存到智能体
const origHandleSendAgent = handleSend;
handleSend = async function() {
    await origHandleSendAgent();
    if (STATE.currentAgentId) {
        saveCurrentChatToAgent();
    }
};

// 左滑菜单处理
window.handleSwipeAction = function(e, action, agentId) {
    e.stopPropagation();
    const agent = STATE.agents.find(a => a.id === agentId);
    if (!agent) return;
    
    switch (action) {
        case 'unread':
            if (!STATE.agentChats[agentId]) STATE.agentChats[agentId] = { unread: 0, messages: [] };
            const chat = STATE.agentChats[agentId];
            chat.unread = (chat.unread && chat.unread > 0) ? 0 : 1;
            saveAgentChats();
            renderAgentList();
            break;
        case 'pin':
            agent.isPinned = !agent.isPinned;
            saveAgents();
            renderAgentList();
            break;
        case 'delete':
            if (confirm(`确定删除"${agent.name}"及其所有聊天记录？`)) {
                deleteAgent(agentId);
            }
            break;
    }
};

function initAgentSwipes(list) {
    list.querySelectorAll('.agent-row-wrapper').forEach(wrapper => {
        const row = wrapper.querySelector('.agent-row');
        let startX = 0;
        let startY = 0;
        let isSwiping = false;
        
        // 点击进入聊天
        row.addEventListener('click', (e) => {
            if (wrapper.classList.contains('swiped')) {
                // 如果是展开状态，点击内容区域则收起
                wrapper.classList.remove('swiped');
                return;
            }
            selectAgent(wrapper.dataset.agentId);
        });

        row.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwiping = false;
            // 收起其他已展开的项
            list.querySelectorAll('.agent-row-wrapper.swiped').forEach(w => {
                if (w !== wrapper) w.classList.remove('swiped');
            });
        }, {passive: true});

        row.addEventListener('touchmove', e => {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = startX - currentX;
            const diffY = Math.abs(startY - currentY);
            
            // 如果纵向滑动大于横向滑动，认为是滚动列表，不处理
            if (diffY > Math.abs(diffX)) return;
            
            if (diffX > 30) {
                // 左滑展开
                wrapper.classList.add('swiped');
                isSwiping = true;
            } else if (diffX < -30) {
                // 右滑收起
                wrapper.classList.remove('swiped');
                isSwiping = true;
            }
        }, {passive: true});
    });
}
