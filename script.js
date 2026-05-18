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
const toast = $('toast');
const getMessagesArea = () => $('messagesArea');

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

/**
 * ===== 高性能存储架构 (Dexie.js + Blob + OPFS) =====
 * GitHub Pages 上外链 Dexie 可能因为网络、CDN、浏览器插件等原因加载失败。
 * 如果没有兜底，`new Dexie()` 会直接中断整个 script.js，导致所有 App 图标点击失效。
 */
(function ensureDexieFallback() {
    if (typeof window.Dexie !== 'undefined') return;

    console.warn('Dexie 未加载，已启用 localStorage 降级存储。图片/Blob 仅在当前会话中可用。');

    class LocalStore {
        constructor(dbName, storeName) {
            this.key = `${dbName}:${storeName}`;
            this.memory = new Map();
        }

        _read() {
            try {
                return JSON.parse(localStorage.getItem(this.key) || '{}');
            } catch (_) {
                return {};
            }
        }

        _write(data) {
            try {
                localStorage.setItem(this.key, JSON.stringify(data));
            } catch (_) {}
        }

        async put(record) {
            if (!record || record.id === undefined) return;
            if (record.data instanceof Blob || record.value instanceof Blob) {
                this.memory.set(record.id, record);
                return;
            }
            const data = this._read();
            data[record.id] = record;
            this._write(data);
        }

        async get(id) {
            if (this.memory.has(id)) return this.memory.get(id);
            return this._read()[id];
        }

        async delete(id) {
            this.memory.delete(id);
            const data = this._read();
            delete data[id];
            this._write(data);
        }
    }

    window.Dexie = class DexieFallback {
        constructor(name) {
            this.name = name;
        }

        version() {
            return {
                stores: (schema) => {
                    Object.keys(schema || {}).forEach(storeName => {
                        this[storeName] = new LocalStore(this.name, storeName);
                    });
                    return this;
                }
            };
        }
    };
})();

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
        apiPresets: [], // [{name:'OpenAI', endpoint:'', key:''}]
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
        onlineMode: true,
        theme: {
            wallpaper: 'gradient1',
            wallpaperImage: '', // ObjectURL
            customColorHex: '#e8e8ea',
            iconShape: 'rounded',
            iconSize: 58,
            iconImages: {}, // ObjectURLs
            iconColors: {}, // 自定义图标纯色 {appName: '#hex'}
            iconStroke: true, // 图标是否显示描边
            iconStrokeColor: '#1a1a1a', // 描边颜色
            hideCustomIconText: false, // 是否隐藏自定义图标的文字
            chatPreset: 'default', // default | dark | sakura
            globalTheme: 'default', // default | mint | midnight
            bubbleStyle: 'classic', // classic | gradient | glass | minimal | candy
            bubbleCustomEnable: false,
            bubbleUserBg: '#0a84ff',
            bubbleUserText: '#ffffff',
            bubbleAiBg: '#ffffff',
            bubbleAiText: '#1a1a1a',
            chatBgImage: '' // ObjectURL
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
    requestAnimationFrame(() => {
        const ma = getMessagesArea();
        if (ma) ma.scrollTop = ma.scrollHeight;
    });
}

function showToast(msg, dur = 2000) {
    // 清理已存在的 toast 弹窗
    const existing = document.getElementById('toastOverlay');
    if (existing) {
        clearTimeout(existing._t);
        existing.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'toastOverlay';
    overlay.className = 'toast-overlay';
    overlay.innerHTML = `<div class="toast-popup"></div>`;
    overlay.querySelector('.toast-popup').textContent = msg;

    const phoneBody = document.querySelector('.phone-body');
    if (phoneBody) {
        phoneBody.appendChild(overlay);
    } else {
        document.body.appendChild(overlay);
    }

    // 触发重排后添加 show 类以启动动画
    overlay.offsetHeight;
    overlay.classList.add('show');

    overlay._t = setTimeout(() => {
        overlay.classList.remove('show');
        setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 300);
    }, dur);
}

// ===== 自定义输入弹窗（iOS Alert 带输入框风格） =====
function showPrompt(msg, title = '请输入', placeholder = '') {
    return new Promise(resolve => {
        let overlay = document.getElementById('customPromptOverlay');
        if (overlay) overlay.remove();

        overlay = document.createElement('div');
        overlay.id = 'customPromptOverlay';
        overlay.className = 'custom-prompt-overlay';
        overlay.innerHTML = `
            <div class="custom-prompt-dialog">
                <div class="custom-prompt-title"></div>
                <div class="custom-prompt-msg"></div>
                <div class="custom-prompt-input-wrap">
                    <input type="text" class="custom-prompt-input" autocomplete="off">
                </div>
                <div class="custom-prompt-actions">
                    <button class="custom-prompt-btn cancel">取消</button>
                    <button class="custom-prompt-btn confirm">确定</button>
                </div>
            </div>
        `;
        const phoneBody = document.querySelector('.phone-body');
        if (phoneBody) {
            phoneBody.appendChild(overlay);
        } else {
            document.body.appendChild(overlay);
        }

        const titleEl = overlay.querySelector('.custom-prompt-title');
        const msgEl = overlay.querySelector('.custom-prompt-msg');
        const inputEl = overlay.querySelector('.custom-prompt-input');
        
        titleEl.textContent = title;
        msgEl.textContent = msg || '';
        inputEl.placeholder = placeholder;
        
        if (!title) titleEl.style.display = 'none';
        if (!msg) msgEl.style.display = 'none';

        const btnCancel = overlay.querySelector('.custom-prompt-btn.cancel');
        const btnConfirm = overlay.querySelector('.custom-prompt-btn.confirm');

        const cleanup = () => {
            btnCancel.removeEventListener('click', onCancel);
            btnConfirm.removeEventListener('click', onConfirm);
            overlay.classList.remove('show');
            setTimeout(() => {
                if (overlay.parentNode) overlay.remove();
            }, 300);
        };

        const onCancel = () => { cleanup(); resolve(null); };
        const onConfirm = () => { cleanup(); resolve(inputEl.value); };

        btnCancel.addEventListener('click', onCancel);
        btnConfirm.addEventListener('click', onConfirm);
        
        // 自动聚焦 & 回车确认
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') onConfirm();
        });

        overlay.style.display = 'flex';
        overlay.offsetHeight;
        overlay.classList.add('show');
        
        setTimeout(() => inputEl.focus(), 300);
    });
}

// ===== 自定义确认弹窗（iOS ActionSheet 底部弹出风格） =====
// options: { title, confirmText, cancelText, danger }
function showConfirm(msg, titleOrOptions = '提示') {
    // 兼容旧调用：第二个参数若是字符串则作为 title
    const opts = typeof titleOrOptions === 'string'
        ? { title: titleOrOptions }
        : (titleOrOptions || {});
    const title = opts.title ?? '提示';
    const confirmText = opts.confirmText ?? '确定';
    const cancelText = opts.cancelText ?? '取消';
    const danger = opts.danger !== false; // 默认作为危险操作（红色），可显式 false 关闭

    return new Promise(resolve => {
        let overlay = document.getElementById('customConfirmOverlay');
        if (overlay) overlay.remove(); // 移除旧的，确保结构正确

        overlay = document.createElement('div');
        overlay.id = 'customConfirmOverlay';
        overlay.className = 'custom-confirm-overlay';
        overlay.innerHTML = `
            <div class="custom-confirm-sheet">
                <div class="custom-confirm-card">
                    <div class="custom-confirm-header">
                        <div class="custom-confirm-title"></div>
                        <div class="custom-confirm-msg"></div>
                    </div>
                    <button class="custom-confirm-btn confirm${danger ? ' danger' : ''}"></button>
                </div>
                <button class="custom-confirm-btn cancel"></button>
            </div>
        `;
        const phoneBody = document.querySelector('.phone-body');
        if (phoneBody) {
            phoneBody.appendChild(overlay);
        } else {
            document.body.appendChild(overlay);
        }

        const titleEl = overlay.querySelector('.custom-confirm-title');
        const msgEl = overlay.querySelector('.custom-confirm-msg');
        titleEl.textContent = title;
        msgEl.textContent = msg || '';
        // 标题/消息任一为空时隐藏对应元素，避免空白
        if (!title) titleEl.style.display = 'none';
        if (!msg) msgEl.style.display = 'none';

        const btnCancel = overlay.querySelector('.custom-confirm-btn.cancel');
        const btnConfirm = overlay.querySelector('.custom-confirm-btn.confirm');
        btnCancel.textContent = cancelText;
        btnConfirm.textContent = confirmText;

        const cleanup = () => {
            overlay.removeEventListener('click', onOverlayClick);
            btnCancel.removeEventListener('click', onCancel);
            btnConfirm.removeEventListener('click', onConfirm);

            overlay.classList.remove('show');
            setTimeout(() => {
                if (overlay.parentNode) overlay.remove();
            }, 300);
        };

        const onCancel = () => { cleanup(); resolve(false); };
        const onConfirm = () => { cleanup(); resolve(true); };
        // 点击灰色背景关闭（视为取消）
        const onOverlayClick = (e) => {
            if (e.target === overlay) onCancel();
        };

        btnCancel.addEventListener('click', onCancel);
        btnConfirm.addEventListener('click', onConfirm);
        overlay.addEventListener('click', onOverlayClick);

        overlay.style.display = 'flex';
        // Force a reflow to trigger the animation
        overlay.offsetHeight;
        overlay.classList.add('show');
    });
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

const getPage = (appId) => {
    const map = {
        chat: 'pageChat', settings: 'pageSettings', theme: 'pageTheme',
        chatSettings: 'pageChatSettings', photos: 'pagePhotos', music: 'pageMusic',
        safari: 'pageSafari', weather: 'pageWeather', notes: 'pageNotes', clock: 'pageClock',
        agents: 'pageAgents'
    };
    return map[appId] ? $(map[appId]) : null;
};

function openApp(appId, page) {
    const targetPage = page || getPage(appId);
    if (!targetPage) return;
    
    if (currentApp) {
        const prevPage = getPage(currentApp);
        if (prevPage) prevPage.classList.remove('active');
    }
    
    currentApp = appId;
    appStack.push(appId);
    targetPage.classList.add('active');
    history.pushState({ appId }, '', '#' + appId);
}

function closeApp(e) {
    const forceAll = e === true;
    if (!currentApp) return;

    if (forceAll) {
        appStack.forEach(app => {
            const p = getPage(app);
            if (p) p.classList.remove('active');
        });
        const steps = appStack.length;
        currentApp = null;
        appStack = [];
        closeEmojiPanel();
        if (!closeFromPopstate && steps > 0) {
            history.go(-steps);
        }
        return;
    }

    if (!closeFromPopstate) {
        history.back();
        return;
    }

    const page = getPage(currentApp);
    if (page) page.classList.remove('active');
    
    closeEmojiPanel();
    
    if (appStack.length > 0 && appStack[appStack.length - 1] === currentApp) {
        appStack.pop();
    } else {
        appStack = appStack.filter(a => a !== currentApp);
    }
    
    if (appStack.length > 0) {
        currentApp = appStack[appStack.length - 1];
        const prevPage = getPage(currentApp);
        if (prevPage) prevPage.classList.add('active');
    } else {
        currentApp = null;
    }
}

function goBackToChat() {
    // 从聊天设置返回到聊天（不关闭聊天页面）
    const page = getPage('chatSettings');
    if (page) page.classList.remove('active');
    currentApp = 'chat';
    appStack = appStack.filter(a => a !== 'chatSettings');
    const chatPage = getPage('chat');
    if (chatPage) chatPage.classList.add('active');
}

// 主界面应用图标点击
document.querySelectorAll('.app-icon[data-app]').forEach(icon => {
    icon.addEventListener('click', () => {
        const app = icon.dataset.app;
        if (app === 'chat') {
            openApp('chat');
            setTimeout(() => {
                const inp = $('messageInput');
                if (inp) inp.focus();
            }, 400);
        }
        else if (app === 'settings') { openApp('settings'); }
        else if (app === 'theme') { loadThemeUI(); openApp('theme'); }
        else if (getPage(app)) { openApp(app); }
        else showToast(`${icon.querySelector('.app-icon-name').textContent} (演示)`, 1200);
    });
});

// 返回按钮
// $('closeChat').addEventListener('click', closeApp);
// $('backSettings').addEventListener('click', closeApp);
// $('backTheme').addEventListener('click', closeApp);
// $('backChatSettings').addEventListener('click', goBackToChat);
// $('backPhotos').addEventListener('click', closeApp);
// $('backMusic').addEventListener('click', closeApp);
// $('backSafari').addEventListener('click', closeApp);
// $('backWeather').addEventListener('click', closeApp);
// $('backNotes').addEventListener('click', closeApp);
// $('backClock').addEventListener('click', closeApp);
// Home Indicator 点击返回主屏（模拟 iPhone 底部退出键）
const homeIndicator = document.querySelector('.home-indicator');
if (homeIndicator) {
    homeIndicator.addEventListener('click', () => {
        if (currentApp) closeApp(true);
    });
    homeIndicator.style.cursor = 'pointer';
}

// 聊天三点菜单 → 聊天设置
$('chatSettingsBtn').addEventListener('click', () => {
    loadSettingsUI();
    openApp('chatSettings');
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
    const pChat = getPage('chat');
    const pageChatRect = pChat ? pChat.getBoundingClientRect() : phoneRect;
    
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
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (action === 'remove') {
                if (!(await showConfirm('确定要移除这条收藏吗？'))) return;
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
async function deleteMessage(msg) {
    if (!(await showConfirm('确定要删除这条消息吗？'))) return;
    // 从消息列表移除
    STATE.messages = STATE.messages.filter(m => m.id !== msg.id);
    // 从 DOM 移除
    const ma = getMessagesArea();
    const msgEl = ma ? ma.querySelector(`.message[data-id="${msg.id}"]`) : null;
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
    const ma = getMessagesArea();
    if(!ma) return;
    ma.classList.add('multiselect-mode');

    // 为每条消息添加选择标记
    ma.querySelectorAll('.message').forEach(msgEl => {
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
    const ma = getMessagesArea();
    const allMsgEls = ma ? ma.querySelectorAll('.message[data-id]') : [];
    
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
    const ma = getMessagesArea();
    if(ma) {
        ma.classList.remove('multiselect-mode');
        ma.querySelectorAll('.message').forEach(msgEl => {
            msgEl.classList.remove('selected');
            const check = msgEl.querySelector('.message-select-check');
            if (check) check.remove();
        });
    }
    if (multiselectBar) multiselectBar.style.display = 'none';
    if ($('multiselectSelectAllBtn')) $('multiselectSelectAllBtn').textContent = '全选';
}

function screenshotSelectedMessages() {
    if (selectedMsgs.size === 0) return;
    
    const ma = getMessagesArea();
    const allMsgEls = ma ? Array.from(ma.querySelectorAll('.message[data-id]')) : [];
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

async function deleteSelectedMessages() {
    if (selectedMsgs.size === 0) return;
    if (!(await showConfirm(`确定删除选中的 ${selectedMsgs.size} 条消息？`))) return;
    
    selectedMsgs.forEach(id => {
        STATE.messages = STATE.messages.filter(m => m.id !== id);
        const ma = getMessagesArea();
        const msgEl = ma ? ma.querySelector(`[data-id="${id}"]`) : null;
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
    const ma = getMessagesArea();
    const msgEl = ma ? ma.querySelector(`.message[data-id="${msg.id}"]`) : null;
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
    const ma = getMessagesArea();
    const bubble = ma ? ma.querySelector(`.message[data-id="${msg.id}"] .message-bubble`) : null;
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
    const ma = getMessagesArea();
    const msgEl = ma ? ma.querySelector(`.message[data-id="${msg.id}"]`) : null;
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
                    const inp = $('messageInput');
                    if(inp) {
                        inp.value = msg.content;
                        inp.focus();
                    }
                    updateBtn();
                });
            } else {
                tip.innerHTML = `<span style="font-size:12px;color:#8e8e93">对方撤回了一条消息</span>`;
            }
            const ma = getMessagesArea();
            if(ma) ma.appendChild(tip);
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

// ===== 覆盖 handleSend 以支持引用 + 后台消息生成 + 通知弹窗 =====
const origHandleSend = handleSend;

let currentInputMode = 'text';

handleSend = async function(e, forceText = null, forceProxy = null) {
    const isForceText = typeof forceText === 'string' ? forceText : (typeof e === 'string' ? e : null);
    const isForceProxy = (forceProxy && typeof forceProxy === 'object') ? forceProxy : (typeof forceText === 'object' ? forceText : null);

    const inp = $('messageInput');
    const text = isForceText || (inp ? inp.value.trim() : '');
    if (!text || STATE.isProcessing) return;
    closeEmojiPanel();
    
    let proxy = isForceProxy;
    if (!proxy && currentInputMode !== 'text') {
        proxy = { type: currentInputMode };
        exitInputMode();
    }

    if (inp && !isForceText) {
        inp.style.height = 'auto';
    }
    
    // 捕获发送时的状态（供后台生成完成时使用）
    const sendAgentId = STATE.currentAgentId;
    const sendAgent = sendAgentId === DEFAULT_AGENT_ID
        ? getDefaultAgent()
        : STATE.agents.find(a => a.id === sendAgentId);
    
    // 如果有引用，在消息前添加引用格式
    let finalText = text;
    if (quoteTarget) {
        const quotedContent = quoteTarget.content.length > 50 ? quoteTarget.content.slice(0, 50) + '...' : quoteTarget.content;
        finalText = `> ${quotedContent}\n${text}`;
        if (!isForceText && inp) inp.value = finalText;
        clearQuote();
    }

    addMsg(isForceText || (inp ? inp.value : text) || text, 'user', proxy);
    if (inp && !isForceText) inp.value = '';
    updateBtn();
    STATE.isProcessing = true;
    showTyping();
    
    // 在 STATE.messages 仍然指向当前 agent 时，复制上下文
    const ctxMessages = STATE.messages.map(m => ({ role: m.role, content: m.content }));
    
    const mid = Date.now().toString(36) + Math.random().toString(36).substr(2,5);
    const aiMsg = { id: mid, content: '', role: 'ai', time: getTime() };
    
    // 用户是否仍处于原 agent 上下文（可能在 chat 页或已离开）
    const isStillOriginalAgent = () => STATE.currentAgentId === sendAgentId;
    // 用户是否仍在原聊天页面（用于决定是否更新 DOM）
    const isStillOnChat = () => currentApp === 'chat' && isStillOriginalAgent();
    
    let bubble = null;
    let div = null;
    
    function setupBubble() {
        if (bubble) return;
        let avHtml;
        if (sendAgent && sendAgent.avatarImage) {
            avHtml = `<img src="${sendAgent.avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        } else if (sendAgent) {
            avHtml = `<svg viewBox="0 0 40 40" width="32" height="32"><circle cx="20" cy="20" r="20" fill="${sendAgent.avatarC1 || '#667eea'}"/></svg>`;
        } else {
            const c1 = STATE.settings.avatarC1 || '#667eea';
            avHtml = `<svg viewBox="0 0 40 40" width="32" height="32"><circle cx="20" cy="20" r="20" fill="${c1}"/></svg>`;
        }
        div = document.createElement('div');
        div.className = 'message ai';
        div.dataset.id = mid;
        div.innerHTML = `<div class="message-avatar">${avHtml}</div><div class="message-content"><div class="message-bubble ai" id="sb_${mid}"></div><span class="message-time">${aiMsg.time}</span></div>`;
        const ma = getMessagesArea();
        if(ma) ma.appendChild(div);
        scrollBottom();
        bubble = document.getElementById(`sb_${mid}`);
    }
    
    function teardownBubble() {
        if (div && div.parentNode) div.parentNode.removeChild(div);
        div = null;
        bubble = null;
    }
    
    try {
        const response = await callAI(ctxMessages);
        hideTyping();
        
        if (isStillOnChat()) setupBubble();
        
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
                try {
                    const p = JSON.parse(d);
                    const delta = p.choices?.[0]?.delta?.content;
                    if (delta) {
                        full += delta;
                        if (isStillOnChat()) {
                            if (!bubble) setupBubble();
                            if (bubble) { bubble.innerHTML = renderMD(full); scrollBottom(); }
                        } else if (bubble) {
                            // 用户已离开聊天页 - 移除残留的 DOM 气泡
                            teardownBubble();
                        }
                    }
                } catch(ee) {}
            }
        }
        if (buf) {
            const t = buf.trim();
            if (t.startsWith('data: ')) {
                const d = t.slice(6);
                if (d !== '[DONE]') {
                    try {
                        const p = JSON.parse(d);
                        const delta = p.choices?.[0]?.delta?.content;
                        if (delta) {
                            full += delta;
                            if (isStillOnChat() && bubble) bubble.innerHTML = renderMD(full);
                        }
                    } catch(ee) {}
                }
            }
        }
        aiMsg.content = full;
        const voiceMatch = full.match(/\[Voice:(.*?)\]/is);
        if (voiceMatch) {
            aiMsg.content = voiceMatch[1].trim();
            aiMsg.proxy = { type: 'voice' };
            if (isStillOnChat() && bubble) {
                bubble.innerHTML = getMsgInnerHtml(aiMsg);
            }
        }
        
        if (isStillOriginalAgent()) {
            // 当前 agent 未变 - 直接 push 到 STATE.messages，外层 wrapper 会保存
            STATE.messages.push(aiMsg);
            if (isStillOnChat()) {
                scrollBottom();
            } else {
                // 不在聊天页：清理可能残留的气泡，未读+1，弹通知
                teardownBubble();
                if (sendAgentId && sendAgentId !== DEFAULT_AGENT_ID) {
                    if (!STATE.agentChats[sendAgentId]) STATE.agentChats[sendAgentId] = { messages: [], unread: 0 };
                    STATE.agentChats[sendAgentId].unread = (STATE.agentChats[sendAgentId].unread || 0) + 1;
                    await saveAgentChats();
                    if (currentApp === 'agents') renderAgentList();
                }
                if (sendAgent) showAgentNotification(sendAgent, full, sendAgentId);
            }
        } else {
            // 用户已切到其他 agent - STATE.messages 不再属于本次发送
            // 直接写入原 agent 的聊天记录，并加未读
            teardownBubble();
            await saveAiMsgToAgentChat(sendAgentId, aiMsg);
            if (sendAgentId && sendAgentId !== DEFAULT_AGENT_ID) {
                if (!STATE.agentChats[sendAgentId]) STATE.agentChats[sendAgentId] = { messages: [], unread: 0 };
                STATE.agentChats[sendAgentId].unread = (STATE.agentChats[sendAgentId].unread || 0) + 1;
                await saveAgentChats();
                if (currentApp === 'agents') renderAgentList();
            }
            if (sendAgent) showAgentNotification(sendAgent, full, sendAgentId);
        }
    } catch (error) {
        hideTyping();
        if (isStillOnChat()) {
            showToast(error.message || '请求失败', 3000);
            addMsg(`⚠️ 抱歉，发生错误：${error.message}`, 'ai');
        } else {
            console.error('后台 AI 生成出错:', error);
            teardownBubble();
        }
    } finally {
        STATE.isProcessing = false;
        updateBtn();
    }
};

// ===== 后台消息：保存 AI 消息到指定 agent 的聊天 =====
function saveAiMsgToAgentChat(agentId, aiMsg) {
    if (!agentId) return;
    if (agentId === DEFAULT_AGENT_ID) {
        if (!STATE.agentChats[DEFAULT_AGENT_ID]) {
            STATE.agentChats[DEFAULT_AGENT_ID] = { messages: [], unread: 0 };
        }
        STATE.agentChats[DEFAULT_AGENT_ID].messages.push(aiMsg);
        try { db.agentChats.put({ id: 'default_messages', data: STATE.agentChats[DEFAULT_AGENT_ID].messages }); } catch(e) {}
        return;
    }
    if (!STATE.agentChats[agentId]) {
        STATE.agentChats[agentId] = { messages: [], unread: 0 };
    }
    STATE.agentChats[agentId].messages.push(aiMsg);
    saveAgentChats();
}

// ===== 通知弹窗：iOS 风格顶部横幅 =====
function showAgentNotification(agent, content, agentId) {
    if (!agent) return;
    
    // 移除已存在的通知
    document.querySelectorAll('.notification-banner').forEach(n => n.remove());
    
    const banner = document.createElement('div');
    banner.className = 'notification-banner';
    
    let avatarHtml;
    if (agent.avatarImage) {
        avatarHtml = `<img src="${agent.avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:10px">`;
    } else {
        avatarHtml = `<svg viewBox="0 0 40 40" width="38" height="38" style="display:block"><rect width="40" height="40" rx="10" fill="${agent.avatarC1 || '#667eea'}"/></svg>`;
    }
    
    // 简化内容预览（去除 markdown 标记和换行）
    const cleanContent = (content || '').replace(/```[\s\S]*?```/g, '[代码]').replace(/!\[.*?\]\(.*?\)/g, '[图片]').replace(/\[(.*?)\]\(.*?\)/g, '$1').replace(/[#*_`>~]/g, '').replace(/\n+/g, ' ').trim();
    const previewContent = cleanContent || '收到新消息';
    
    banner.innerHTML = `
        <div class="notif-icon">${avatarHtml}</div>
        <div class="notif-body">
            <div class="notif-header">
                <span class="notif-title"></span>
                <span class="notif-time">现在</span>
            </div>
            <div class="notif-message"></div>
        </div>
    `;
    banner.querySelector('.notif-title').textContent = agent.name || 'Uchat';
    banner.querySelector('.notif-message').textContent = previewContent;
    
    // 点击进入对应聊天
    banner.addEventListener('click', () => {
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 300);
        
        // 关闭当前 app（如果有，且不是聊天页）
        if (currentApp && currentApp !== 'chat') {
            const page = getPage(currentApp);
            if (page) page.classList.remove('active');
            currentApp = null;
            appStack = [];
        }
        
        // 切到对应聊天
        if (typeof selectAgent === 'function' && agentId) {
            if (!appStack.includes('agents')) {
                openApp('agents');
            }
            selectAgent(agentId);
        }
    });
    
    // 添加到 phone-body 内（保证位置相对手机屏幕）
    const phoneBody = document.querySelector('.phone-body');
    if (phoneBody) {
        phoneBody.appendChild(banner);
    } else {
        document.body.appendChild(banner);
    }
    
    requestAnimationFrame(() => banner.classList.add('show'));
    
    // 5 秒后自动消失
    setTimeout(() => {
        if (banner.parentNode) {
            banner.classList.remove('show');
            setTimeout(() => { if (banner.parentNode) banner.remove(); }, 350);
        }
    }, 5000);
}

// ===== 为消息添加长按监听 =====
const origRenderMsg = renderMsg;
renderMsg = function(msg) {
    origRenderMsg(msg);
    // 等待 DOM 渲染完成后绑定长按
    requestAnimationFrame(() => {
        const ma = getMessagesArea();
        const msgEl = ma ? ma.querySelector(`.message[data-id="${msg.id}"]`) : null;
        if (msgEl && !msgEl._longPressBound) {
            initLongPress(msgEl);
            msgEl._longPressBound = true;
        }
    });
};


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
                <circle cx="20" cy="20" r="20" fill="${userAvatarC1}"/>
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
                    <circle cx="20" cy="20" r="20" fill="${userAvatarC1}"/>
                </svg>`;
            }
        }
    });

    document.querySelectorAll('.uav-color').forEach(el => {
        el.classList.toggle('active', el.dataset.c1 === userAvatarC1);
    });
    const uavCustom = document.getElementById('uavColorCustom');
    if (uavCustom) {
        uavCustom.value = userAvatarC1;
        // 如果当前色不在预设中，则标记为 active
        const presetMatch = Array.from(document.querySelectorAll('.uav-color')).some(el => el.dataset.c1 === userAvatarC1);
        uavCustom.classList.toggle('active', !presetMatch);
    }
}

// 用户颜色选择
document.querySelectorAll('.uav-color').forEach(el => {
    el.addEventListener('click', () => {
        STATE.settings.userAvatarC1 = el.dataset.c1;
        STATE.settings.userAvatarC2 = el.dataset.c1;
        STATE.settings.userAvatarImage = ''; saveMedia('user_avatar_img', null);
        applyUserAvatar(); saveSetting("settings", STATE.settings);
    });
});

// 用户自定义颜色拾色器
(function bindUavCustomColor() {
    const uavCustom = document.getElementById('uavColorCustom');
    if (!uavCustom) return;
    uavCustom.addEventListener('input', async (e) => {
        const hex = e.target.value;
        STATE.settings.userAvatarC1 = hex;
        STATE.settings.userAvatarC2 = hex;
        STATE.settings.userAvatarImage = '';
        await saveMedia('user_avatar_img', null);
        applyUserAvatar();
        await saveSetting('settings', STATE.settings);
    });
})();

// 用户图片上传
$('uploadUserAvatarBtn').addEventListener('click', () => $('userAvatarFileInput').click());
$('userAvatarFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    compressImage(file, async (blob) => {
        if (!blob) { showToast('图片处理失败'); return; }
        await saveMedia('user_avatar_img', blob);
        const objUrl = createObjURL(blob);
        STATE.settings.userAvatarImage = objUrl;
        STATE.settings.userAvatarC1 = '#007aff';
        STATE.settings.userAvatarC2 = '#007aff';
        applyUserAvatar();
        await saveSetting("settings", STATE.settings);
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
                <circle cx="20" cy="20" r="20" fill="${avatarC1}"/>
            </svg>`;
        }
        if (!headerAv.querySelector('.online-dot')) {
            const dot = document.createElement('span');
            dot.className = 'online-dot';
            headerAv.appendChild(dot);
        }
    }

    document.querySelectorAll('.message-avatar').forEach(el => {
        // 跳过用户头像，仅处理 AI 头像
        if (el.classList.contains('user-avatar')) return;
        const svg = el.querySelector('svg');
        if (svg) {
            // 仅对默认（非自定义图片占位）的头像进行重新着色
            if (avatarImage) {
                el.innerHTML = `<img src="${avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            } else {
                el.innerHTML = `<svg viewBox="0 0 40 40" width="32" height="32">
                    <circle cx="20" cy="20" r="20" fill="${avatarC1}"/>
                </svg>`;
            }
        }
    });

    const preview = $('avatarPreview');
    if (preview) {
        if (avatarImage) {
            preview.innerHTML = `<img src="${avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        } else {
            preview.innerHTML = `<svg viewBox="0 0 40 40" width="56" height="56">
                <circle cx="20" cy="20" r="20" fill="${avatarC1}"/>
            </svg>`;
        }
    }

    document.querySelectorAll('.av-color').forEach(el => {
        el.classList.toggle('active', el.dataset.c1 === avatarC1);
    });
    const avCustom = document.getElementById('avColorCustom');
    if (avCustom) {
        avCustom.value = avatarC1;
        const presetMatch = Array.from(document.querySelectorAll('.av-color')).some(el => el.dataset.c1 === avatarC1);
        avCustom.classList.toggle('active', !presetMatch);
    }
}

// 辅助函数：判断当前是否在和某个自定义智能体聊天（非默认 AI 助手）
function getCurrentAgent() {
    if (!STATE.currentAgentId || STATE.currentAgentId === DEFAULT_AGENT_ID) return null;
    return STATE.agents.find(a => a.id === STATE.currentAgentId) || null;
}

// AI 颜色选择
async function applyAiColor(c1) {
    STATE.settings.avatarC1 = c1;
    STATE.settings.avatarC2 = c1;
    STATE.settings.avatarImage = '';

    // 同步到当前正在聊天的智能体（如果有）
    const agent = getCurrentAgent();
    if (agent) {
        agent.avatarC1 = c1;
        agent.avatarC2 = c1;
        agent.avatarImage = '';
        await saveMedia(agent.id + '_avatar', null);
        await saveAgents();
        updateChatHeaderForAgent(agent);
    } else {
        await saveMedia('ai_avatar_img', null);
    }

    applyAvatar();
    await saveSetting("settings", STATE.settings);
}

document.querySelectorAll('.av-color').forEach(el => {
    el.addEventListener('click', async () => {
        await applyAiColor(el.dataset.c1);
    });
});

// AI 自定义颜色拾色器
(function bindAvCustomColor() {
    const avCustom = document.getElementById('avColorCustom');
    if (!avCustom) return;
    avCustom.addEventListener('input', async (e) => {
        await applyAiColor(e.target.value);
    });
})();

// AI 图片上传
$('uploadAvatarBtn').addEventListener('click', () => $('avatarFileInput').click());
$('avatarFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    compressImage(file, async (blob) => {
        if (!blob) { showToast('图片处理失败'); return; }
        const objUrl = createObjURL(blob);

        // 同步到当前正在聊天的智能体（如果有），否则存到全局默认 AI
        const agent = getCurrentAgent();
        if (agent) {
            await saveMedia(agent.id + '_avatar', blob);
            agent.avatarImage = objUrl;
            await saveAgents();
            updateChatHeaderForAgent(agent);
        } else {
            await saveMedia('ai_avatar_img', blob);
        }

        STATE.settings.avatarImage = objUrl;
        applyAvatar();
        await saveSetting("settings", STATE.settings);
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
function getMsgInnerHtml(msg) {
    let innerContent = '';
    if (msg.proxy) {
        if (msg.proxy.type === 'voice') {
            const sec = Math.max(1, Math.min(60, Math.ceil((msg.content || '').length / 4)));
            const width = 50 + (sec * 2);
            const barCount = 5 + Math.floor(sec / 2);
            let bars = '';
            for(let i=0; i<barCount; i++) {
                bars += `<div class="proxy-voice-bar" style="animation: bounce ${0.5 + Math.random()}s infinite alternate"></div>`;
            }
            const voiceHtml = `<div class="proxy-voice" style="width: ${width}px; display:flex; align-items:center; box-sizing:border-box;"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="flex-shrink:0;"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg><div style="display:flex;flex:1;overflow:hidden;margin-left:4px;">${bars}</div><span style="font-size:12px; margin-left:5px;">${sec}"</span></div>`;
            const translationHtml = `<div class="voice-text-translation" style="margin-top:4px; font-size:12px; color:#666; word-break:break-all;">${esc(msg.content)}</div>`;
            innerContent = `<div style="display:flex; flex-direction:column; align-items:flex-start;">${voiceHtml}${translationHtml}</div>`;
        } else if (msg.proxy.type === 'image') {
            const escapedText = esc(msg.content || '').replace(/"/g, '"');
            innerContent = `<img src="./image/yata.png" class="proxy-image-content" style="max-width: 150px; border-radius: 8px; cursor: pointer; display: block;" data-text="${escapedText}" onclick="showConfirm(this.getAttribute('data-text'), {title: '图片描述', danger: false})">`;
        } else if (msg.proxy.type === 'emoji') {
            innerContent = `<div class="proxy-emoji" style="background-image:url('${msg.proxy.url}')"></div>`;
        }
    } else {
        innerContent = msg.role === 'ai' ? renderMD(msg.content) : esc(msg.content).replace(/\n/g, '<br>');
    }
    return innerContent;
}

function addMsg(content, role, proxy = null) {
    const m = { id: Date.now().toString(36)+Math.random().toString(36).substr(2,5), content, role, time: getTime(), proxy };
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
            a.innerHTML = `<svg viewBox="0 0 40 40" width="32" height="32"><circle cx="20" cy="20" r="20" fill="${avatarC1}"/></svg>`;
        }
        d.appendChild(a);
    }

    const cd = document.createElement('div');
    cd.className = 'message-content';
    const b = document.createElement('div');
    b.className = `message-bubble ${msg.role}`;
    
    if (msg.proxy && msg.proxy.type === 'image') {
        b.style.background = 'transparent';
        b.style.padding = '0';
        b.style.boxShadow = 'none';
    }
    
    let innerContent = getMsgInnerHtml(msg);
    b.innerHTML = innerContent;
    cd.appendChild(b);

    if (msg.role === 'user') {
        const a = document.createElement('div');
        a.className = 'message-avatar user-avatar';
        if (userAvatarImage) {
            a.innerHTML = `<img src="${userAvatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        } else {
            a.innerHTML = `<svg viewBox="0 0 40 40" width="32" height="32"><circle cx="20" cy="20" r="20" fill="${userAvatarC1}"/></svg>`;
        }
        d.appendChild(a);
        d.appendChild(cd);
    } else { d.appendChild(cd); }

    const ts = document.createElement('span');
    ts.className = 'message-time';
    ts.textContent = msg.time;
    cd.appendChild(ts);
    const ma = getMessagesArea();
    if(ma) ma.appendChild(d);
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
        avHtml = `<svg viewBox="0 0 40 40" width="32" height="32"><circle cx="20" cy="20" r="20" fill="${avatarC1}"/></svg>`;
    }
    ind.innerHTML = `<div class="message-avatar">${avHtml}</div><div class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
    const ma = getMessagesArea();
    if(ma) ma.appendChild(ind);
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
    if (STATE.settings.onlineMode) {
        sysContent += `\n\n【重要设定：线上模式】你和用户目前正在通过手机聊天软件进行文字交流。你不能做出任何现实中的肢体动作、神态描写或环境描写，就像一个真人在发消息一样。`;
    }
    sysContent += `\n\n【系统能力】如果你想发送一段长语音给用户，你可以输出特定的格式 [Voice:这里是你说的内容]，系统将拦截它并自动转为语音消息。如果是发普通文字消息，则不要包含该标记。`;
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

// ===== 非流式 LLM 调用（摇一摇等功能使用） =====
// overrides: { apiEndpoint, apiKey, model } 可选，用于摇一摇独立 API 配置
async function callLLM(messages, overrides) {
    const ov = overrides || {};
    const apiEndpoint = ov.apiEndpoint || STATE.settings.apiEndpoint;
    const apiKey = ov.apiKey || STATE.settings.apiKey;
    const modelRaw = ov.model || STATE.settings.model;
    const customModel = STATE.settings.customModel;
    if (!apiKey) throw new Error('请先在设置中配置 API Key');
    let ep = apiEndpoint.replace(/\/+$/,'');
    if (!ep.endsWith('/chat/completions')) ep += '/chat/completions';
    let mn = modelRaw;
    if (modelRaw === 'custom' && customModel) mn = customModel;
    const res = await fetch(ep, {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
        body:JSON.stringify({ model:mn, messages, temperature:0.9, max_tokens:1024, stream:false })
    });
    if (!res.ok) {
        let e=`请求失败 (${res.status})`;
        try{const d=await res.json();if(d.error?.message)e=d.error.message;}catch(ee){}
        throw new Error(e);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

async function handleSend() {
    const inp = $('messageInput');
    const text = inp ? inp.value.trim() : '';
    if (!text || STATE.isProcessing) return;
    closeEmojiPanel();
    addMsg(text, 'user');
    $('messageInput').value = '';
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
            avHtml = `<svg viewBox="0 0 40 40" width="32" height="32"><circle cx="20" cy="20" r="20" fill="${avatarC1}"/></svg>`;
        }
        const div = document.createElement('div');
        div.className = 'message ai';
        div.dataset.id = mid;
        div.innerHTML = `<div class="message-avatar">${avHtml}</div><div class="message-content"><div class="message-bubble ai" id="sb_${mid}"></div><span class="message-time">${aiMsg.time}</span></div>`;
        const ma = getMessagesArea();
        if(ma) ma.appendChild(div);
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
        const voiceMatch = full.match(/\[Voice:(.*?)\]/is);
        if (voiceMatch) {
            aiMsg.content = voiceMatch[1].trim();
            aiMsg.proxy = { type: 'voice' };
            if (bubble) {
                bubble.innerHTML = getMsgInnerHtml(aiMsg);
            }
        }
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
function updateBtn() {
    const inp = $('messageInput');
    const sBtn = $('sendBtn');
    const pBtn = $('plusBtn');
    if (!inp || !sBtn) return;
    const hasText = inp.value.trim().length > 0;
    
    if (hasText) {
        if (pBtn) pBtn.style.display = 'none';
        sBtn.style.display = 'flex';
        sBtn.classList.toggle('active', !STATE.isProcessing);
    } else {
        if (pBtn) pBtn.style.display = 'flex';
        sBtn.style.display = 'none';
        sBtn.classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sBtn = $('sendBtn');
    if(sBtn) sBtn.addEventListener('click', handleSend);
});

function syncOnlineModeSwitch() {
    const sw = $('onlineModeSwitch');
    if (sw) sw.checked = !!STATE.settings.onlineMode;
}

document.addEventListener('change', async (e) => {
    if (e.target && e.target.id === 'onlineModeSwitch') {
        STATE.settings.onlineMode = e.target.checked;
        await saveSetting('settings', STATE.settings);
    }
});
// 这里改到 DOMContentLoaded 绑定的方式更安全
document.addEventListener('DOMContentLoaded', () => {
    const inp = $('messageInput');
    if (inp) {
        inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
        inp.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            updateBtn();
        });
    }

    // Ext Panel Toggle
    const plusBtn = $('plusBtn');
    if (plusBtn) {
        plusBtn.addEventListener('click', () => {
            const ext = $('extPanel');
            if (ext.style.display === 'none') {
                ext.style.display = 'block';
                const ep = $('emojiPicker');
                if (ep) ep.classList.remove('active');
            } else {
                ext.style.display = 'none';
                if($('customEmojiPanel')) $('customEmojiPanel').style.display = 'none';
                if($('extGrid')) $('extGrid').style.display = 'grid';
            }
        });
    }
    document.addEventListener('click', (e) => {
        const ext = $('extPanel');
        const pb = $('plusBtn');
        if (ext && ext.style.display === 'block' && !ext.contains(e.target) && pb && e.target !== pb && !pb.contains(e.target)) {
            ext.style.display = 'none';
            if($('customEmojiPanel')) $('customEmojiPanel').style.display = 'none';
            if($('extGrid')) $('extGrid').style.display = 'grid';
        }
    });

    // Input Mode Switching
    window.enterInputMode = function(mode, text) {
        currentInputMode = mode;
        const mt = $('inputModeText');
        const mi = $('inputModeIndicator');
        if (mt) mt.textContent = text;
        if (mi) mi.style.display = 'flex';
    };
    window.exitInputMode = function() {
        currentInputMode = 'text';
        const mi = $('inputModeIndicator');
        if (mi) mi.style.display = 'none';
        const inp = $('messageInput');
        if (inp) { inp.placeholder = '输入消息...'; }
    };

    if ($('extVoiceBtn')) {
        $('extVoiceBtn').addEventListener('click', () => {
            enterInputMode('voice', '语音输入模式 (将发送语音气泡)');
            $('extPanel').style.display = 'none';
            const inp = $('messageInput');
            if (inp) { inp.placeholder = '输入要发给 AI 的语音描述...'; inp.focus(); }
        });
    }
    if ($('extImageBtn')) {
        $('extImageBtn').addEventListener('click', () => {
            enterInputMode('image', '图片发送模式 (将发送图片气泡)');
            $('extPanel').style.display = 'none';
            const inp = $('messageInput');
            if (inp) { inp.placeholder = '输入要发给 AI 的图片描述...'; inp.focus(); }
        });
    }
    if ($('cancelInputModeBtn')) {
        $('cancelInputModeBtn').addEventListener('click', () => {
            exitInputMode();
            const inp = $('messageInput');
            if (inp) { inp.placeholder = '输入消息...'; }
        });
    }

    // Custom Emoji Panel
    if ($('extCustomEmojiBtn')) {
        $('extCustomEmojiBtn').addEventListener('click', () => {
            if($('extGrid')) $('extGrid').style.display = 'none';
            if($('customEmojiPanel')) $('customEmojiPanel').style.display = 'block';
            renderCustomEmojis();
        });
    }
    if ($('customEmojiBackBtn')) {
        $('customEmojiBackBtn').addEventListener('click', () => {
            if($('customEmojiPanel')) $('customEmojiPanel').style.display = 'none';
            if($('extGrid')) $('extGrid').style.display = 'grid';
        });
    }
    if ($('customEmojiAddBtn')) {
        $('customEmojiAddBtn').addEventListener('click', async () => {
            const url = await showPrompt('请输入图片 URL (或 Base64)', '添加自定义表情');
            if (!url) return;
            const keyword = await showPrompt('请输入表情对应的文字描述 (发给AI的关键词)', '表情描述');
            if (!keyword) return;
            
            let emojis = [];
            try { emojis = JSON.parse(localStorage.getItem('customEmojis')) || []; } catch(e){}
            emojis.push({ id: Date.now().toString(), url, keyword });
            localStorage.setItem('customEmojis', JSON.stringify(emojis));
            renderCustomEmojis();
        });
    }
});

function renderCustomEmojis() {
    const grid = $('customEmojiGrid');
    if (!grid) return;
    grid.innerHTML = '';
    let emojis = [];
    try { emojis = JSON.parse(localStorage.getItem('customEmojis')) || []; } catch(e){}
    
    emojis.forEach(em => {
        const item = document.createElement('div');
        item.style.cssText = `width:100%; aspect-ratio:1; background:url('${em.url}') center/contain no-repeat; border-radius:8px; cursor:pointer; position:relative;`;
        
        item.addEventListener('click', () => {
            handleSend(null, `[发送了表情: ${em.keyword}]`, { type: 'emoji', url: em.url });
            if($('extPanel')) $('extPanel').style.display = 'none';
        });
        
        let timer;
        item.addEventListener('touchstart', () => {
            timer = setTimeout(() => { deleteCustomEmoji(em.id); }, 800);
        });
        item.addEventListener('touchend', () => clearTimeout(timer));
        item.addEventListener('contextmenu', (e) => { e.preventDefault(); deleteCustomEmoji(em.id); });
        
        grid.appendChild(item);
    });
}

async function deleteCustomEmoji(id) {
    if (await showConfirm('删除此自定义表情？')) {
        let emojis = [];
        try { emojis = JSON.parse(localStorage.getItem('customEmojis')) || []; } catch(e){}
        emojis = emojis.filter(e => e.id !== id);
        localStorage.setItem('customEmojis', JSON.stringify(emojis));
        renderCustomEmojis();
    }
}

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
    const inp = $('messageInput');
    if (!inp) return;
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
function renderApiPresets() {
    const sel = $('apiPresetSelect');
    if(!sel) return;
    sel.innerHTML = '<option value="">自定义...</option>';
    if (STATE.settings.apiPresets && STATE.settings.apiPresets.length) {
        STATE.settings.apiPresets.forEach((p, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = p.name;
            sel.appendChild(opt);
        });
    }
    
    // 检查当前输入是否匹配某一个预设
    const currentEp = STATE.settings.apiEndpoint;
    const currentKey = STATE.settings.apiKey;
    let matchedIdx = "";
    if (STATE.settings.apiPresets) {
        const idx = STATE.settings.apiPresets.findIndex(p => p.endpoint === currentEp && p.key === currentKey);
        if (idx >= 0) matchedIdx = idx;
    }
    sel.value = matchedIdx;
}

function loadSettingsUI() {
    if (!STATE.settings.apiPresets) STATE.settings.apiPresets = [];
    renderApiPresets();
    
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

    // 气泡风格 & 自定义颜色 & 聊天背景
    const t = STATE.settings.theme || {};
    const bubbleStyle = t.bubbleStyle || 'classic';
    document.querySelectorAll('.bubble-style-item').forEach(el => {
        el.classList.toggle('active', el.dataset.bubbleStyle === bubbleStyle);
    });
    if ($('bubbleUserBgPick'))   $('bubbleUserBgPick').value   = t.bubbleUserBg   || '#0a84ff';
    if ($('bubbleUserTextPick')) $('bubbleUserTextPick').value = t.bubbleUserText || '#ffffff';
    if ($('bubbleAiBgPick'))     $('bubbleAiBgPick').value     = t.bubbleAiBg     || '#ffffff';
    if ($('bubbleAiTextPick'))   $('bubbleAiTextPick').value   = t.bubbleAiText   || '#1a1a1a';
    if ($('bubbleCustomEnable')) $('bubbleCustomEnable').checked = !!t.bubbleCustomEnable;
    applyChatBg(); // 刷新缩略图

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

if ($('saveSettingsBtn')) $('saveSettingsBtn').addEventListener('click', saveSettings);
if ($('saveSettingsBtnTop')) $('saveSettingsBtnTop').addEventListener('click', saveSettings);
$('modelSelect').addEventListener('change', () => { $('customModelRow').style.display = $('modelSelect').value === 'custom' ? 'block' : 'none'; });
$('temperature').addEventListener('input', e => { $('tempValue').textContent = parseFloat(e.target.value).toFixed(1); });
$('maxTokens').addEventListener('input', e => { $('tokensValue').textContent = e.target.value; });
$('togglePassword').addEventListener('click', () => { const i=$('apiKey'); i.type=i.type==='password'?'text':'password'; });

if ($('apiPresetSelect')) {
    $('apiPresetSelect').addEventListener('change', (e) => {
        const val = e.target.value;
        if (val !== "") {
            const preset = STATE.settings.apiPresets[val];
            $('apiEndpoint').value = preset.endpoint;
            $('apiKey').value = preset.key;
        }
    });

    $('apiSaveBtn').addEventListener('click', async () => {
        const ep = $('apiEndpoint').value.trim();
        const key = $('apiKey').value.trim();
        if (!ep) return showToast("API端点不能为空");
        
        const name = await showPrompt("例如：OpenAI, Claude, 本地Ollama", "请输入此 API 配置的名称");
        if (!name || !name.trim()) return;
        
        if (!STATE.settings.apiPresets) STATE.settings.apiPresets = [];
        STATE.settings.apiPresets.push({ name: name.trim(), endpoint: ep, key: key });
        await saveSetting('settings', STATE.settings);
        renderApiPresets();
        showToast("已保存为预设");
    });

    $('apiDelBtn').addEventListener('click', async () => {
        const val = $('apiPresetSelect').value;
        if (val === "") return showToast("当前为自定义状态，无法删除");
        
        if (!await showConfirm("确定删除该预设吗？", { danger: true })) return;
        
        STATE.settings.apiPresets.splice(val, 1);
        await saveSetting('settings', STATE.settings);
        renderApiPresets();
        showToast("预设已删除");
    });
}

// 清空聊天
$('clearChatBtn').addEventListener('click', async () => {
    if (STATE.messages.length === 0) return;
    if (!(await showConfirm('确定清空所有聊天记录？'))) return;
    STATE.messages = [];
    rerenderMessages();
    saveCurrentChatToAgent();
    showToast('聊天记录已清空');
});

// 删除好友
if ($('deleteFriendBtn')) {
    $('deleteFriendBtn').addEventListener('click', async () => {
        if (!STATE.currentAgentId) return;
        if (!(await showConfirm('确定要删除这个好友吗？删除后将无法恢复。', { danger: true }))) return;
        
        // 从数据源中移除
        STATE.agents = STATE.agents.filter(a => a.id !== STATE.currentAgentId);
        await db.agents.delete(STATE.currentAgentId);
        
        // 清除对应的聊天记录
        delete STATE.agentChats[STATE.currentAgentId];
        await db.agentChats.delete(STATE.currentAgentId);
        
        STATE.currentAgentId = null;
        
        // 关闭当前可能打开的所有相关应用
        if (typeof closeApp === 'function') {
            closeApp('pageChatSettings');
            closeApp('chat');
        }
        
        // 刷新列表
        if (typeof renderAgentsList === 'function') {
            renderAgentsList();
        }
        
        showToast('已删除好友');
    });
}

// ===== 气泡风格 & 自定义气泡颜色 & 聊天背景图 =====
// 气泡风格点击
document.addEventListener('click', async (e) => {
    const item = e.target.closest('.bubble-style-item');
    if (!item) return;
    const style = item.dataset.bubbleStyle;
    if (!style) return;
    if (!STATE.settings.theme) STATE.settings.theme = {};
    STATE.settings.theme.bubbleStyle = style;
    applyBubbleStyle();
    await saveSetting('settings', STATE.settings);
});

// 自定义气泡颜色 - 实时预览 + 持久化
function bindBubbleCustomColors() {
    const handler = async () => {
        if (!STATE.settings.theme) STATE.settings.theme = {};
        const t = STATE.settings.theme;
        if ($('bubbleUserBgPick'))   t.bubbleUserBg   = $('bubbleUserBgPick').value;
        if ($('bubbleUserTextPick')) t.bubbleUserText = $('bubbleUserTextPick').value;
        if ($('bubbleAiBgPick'))     t.bubbleAiBg     = $('bubbleAiBgPick').value;
        if ($('bubbleAiTextPick'))   t.bubbleAiText   = $('bubbleAiTextPick').value;
        applyBubbleStyle();
        await saveSetting('settings', STATE.settings);
    };
    ['bubbleUserBgPick','bubbleUserTextPick','bubbleAiBgPick','bubbleAiTextPick'].forEach(id => {
        const el = $(id);
        if (el) el.addEventListener('input', handler);
    });

    const enableSw = $('bubbleCustomEnable');
    if (enableSw) {
        enableSw.addEventListener('change', async () => {
            if (!STATE.settings.theme) STATE.settings.theme = {};
            STATE.settings.theme.bubbleCustomEnable = enableSw.checked;
            applyBubbleStyle();
            await saveSetting('settings', STATE.settings);
        });
    }

    const resetBtn = $('bubbleColorResetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (!await showConfirm('重置自定义气泡颜色？', { danger: false })) return;
            const t = STATE.settings.theme || (STATE.settings.theme = {});
            t.bubbleUserBg = '#0a84ff';
            t.bubbleUserText = '#ffffff';
            t.bubbleAiBg = '#ffffff';
            t.bubbleAiText = '#1a1a1a';
            t.bubbleCustomEnable = false;
            if ($('bubbleUserBgPick'))   $('bubbleUserBgPick').value   = t.bubbleUserBg;
            if ($('bubbleUserTextPick')) $('bubbleUserTextPick').value = t.bubbleUserText;
            if ($('bubbleAiBgPick'))     $('bubbleAiBgPick').value     = t.bubbleAiBg;
            if ($('bubbleAiTextPick'))   $('bubbleAiTextPick').value   = t.bubbleAiText;
            if ($('bubbleCustomEnable')) $('bubbleCustomEnable').checked = false;
            applyBubbleStyle();
            await saveSetting('settings', STATE.settings);
            showToast('已重置');
        });
    }
}
bindBubbleCustomColors();

// 聊天背景图上传
const chatBgUploadBtn = $('chatBgUploadBtn');
const chatBgFileInput = $('chatBgFileInput');
const chatBgResetBtn  = $('chatBgResetBtn');
if (chatBgUploadBtn && chatBgFileInput) {
    chatBgUploadBtn.addEventListener('click', () => chatBgFileInput.click());
    chatBgFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        compressImage(file, async (blob) => {
            if (!blob) { showToast('图片处理失败'); return; }
            await saveMedia('chat_bg_img', blob);
            const objUrl = createObjURL(blob);
            if (!STATE.settings.theme) STATE.settings.theme = {};
            STATE.settings.theme.chatBgImage = objUrl;
            applyChatBg();
            await saveSetting('settings', STATE.settings);
            showToast('聊天背景已更换');
            e.target.value = '';
        });
    });
}
if (chatBgResetBtn) {
    chatBgResetBtn.addEventListener('click', async () => {
        if (!STATE.settings.theme || !STATE.settings.theme.chatBgImage) {
            showToast('当前未设置背景');
            return;
        }
        if (!await showConfirm('移除聊天背景图？', { danger: true })) return;
        await saveMedia('chat_bg_img', null);
        STATE.settings.theme.chatBgImage = '';
        applyChatBg();
        await saveSetting('settings', STATE.settings);
        showToast('已移除背景');
    });
}

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
    
    if ($('hideCustomIconTextSwitch')) {
        $('hideCustomIconTextSwitch').checked = !!theme.hideCustomIconText;
    }

    // 图标描边开关
    if ($('iconStrokeSwitch')) {
        $('iconStrokeSwitch').checked = theme.iconStroke !== false;
    }

    // 描边颜色恢复
    const strokeColorRow = $('strokeColorRow');
    if (strokeColorRow) {
        strokeColorRow.style.display = (theme.iconStroke !== false) ? 'flex' : 'none';
    }
    const savedStrokeColor = theme.iconStrokeColor || '#1a1a1a';
    document.querySelectorAll('.stroke-swatch').forEach(sw => {
        sw.classList.toggle('active', sw.dataset.strokeColor === savedStrokeColor);
    });
    const strokeCustom = $('strokeColorCustom');
    if (strokeCustom) strokeCustom.value = savedStrokeColor;

    // 同步主题预设卡片的 active 状态
    const preset = theme.chatPreset || 'default';
    document.querySelectorAll('.theme-preset-item').forEach(el => {
        el.classList.toggle('active', el.dataset.preset === preset);
    });
    // 同步全局主题卡片的 active 状态
    const gt = theme.globalTheme || 'default';
    document.querySelectorAll('.global-theme-item').forEach(el => {
        el.classList.toggle('active', el.dataset.global === gt);
    });

    // 初始化图标预览
    updateAllIconPreviews();
}

// 主题预设卡片点击事件
document.addEventListener('click', async (e) => {
    const item = e.target.closest('.theme-preset-item');
    if (!item) return;
    const preset = item.dataset.preset;
    if (!preset) return;
    document.querySelectorAll('.theme-preset-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    if (!STATE.settings.theme) STATE.settings.theme = {};
    STATE.settings.theme.chatPreset = preset;
    applyChatPreset();
    await saveSetting('settings', STATE.settings);
});

// 全局主题卡片点击事件
document.addEventListener('click', async (e) => {
    const item = e.target.closest('.global-theme-item');
    if (!item) return;
    const gt = item.dataset.global;
    if (!gt) return;
    document.querySelectorAll('.global-theme-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    if (!STATE.settings.theme) STATE.settings.theme = {};
    STATE.settings.theme.globalTheme = gt;
    applyGlobalTheme();
    await saveSetting('settings', STATE.settings);
});

function applyTheme() {
    applyWallpaper();
    applyIconShape();
    applyIconSize();
    applyIconColors();
    applyChatPreset();
    applyBubbleStyle();
    applyChatBg();
    applyGlobalTheme();
    
    if (STATE.settings.theme) {
        document.body.classList.toggle('hide-custom-icon-text', !!STATE.settings.theme.hideCustomIconText);
        document.body.classList.toggle('no-icon-stroke', STATE.settings.theme.iconStroke === false);
        
        // 应用自定义描边颜色
        const strokeColor = STATE.settings.theme.iconStrokeColor || '#1a1a1a';
        const hasStroke = STATE.settings.theme.iconStroke !== false;
        document.querySelectorAll('.app-icon-bg').forEach(el => {
            el.style.borderColor = hasStroke ? strokeColor : 'transparent';
        });
    }
}

function applyGlobalTheme() {
    const gt = (STATE.settings.theme && STATE.settings.theme.globalTheme) || 'default';
    if (gt && gt !== 'default') {
        document.body.dataset.globalTheme = gt;
    } else {
        delete document.body.dataset.globalTheme;
    }
    // 同步全局主题卡片的 active 状态
    document.querySelectorAll('.global-theme-item').forEach(el => {
        el.classList.toggle('active', el.dataset.global === gt);
    });
}

function applyChatPreset() {
    const preset = (STATE.settings.theme && STATE.settings.theme.chatPreset) || 'default';
    const pChat = document.getElementById('pageChat');
    if (pChat) {
        if (preset && preset !== 'default') {
            pChat.dataset.theme = preset;
        } else {
            delete pChat.dataset.theme;
        }
    }
    // 同步主题预设卡片的 active 状态
    document.querySelectorAll('.theme-preset-item').forEach(el => {
        el.classList.toggle('active', el.dataset.preset === preset);
    });
}

// ===== 气泡风格 & 自定义颜色 =====
function applyBubbleStyle() {
    const t = STATE.settings.theme || {};
    const style = t.bubbleStyle || 'classic';
    const pChat = document.getElementById('pageChat');
    if (!pChat) return;

    if (style && style !== 'classic') {
        pChat.dataset.bubbleStyle = style;
    } else {
        // classic 也写入，便于切换时重置
        pChat.dataset.bubbleStyle = 'classic';
    }

    // 自定义颜色（CSS 变量）
    if (t.bubbleCustomEnable) {
        pChat.dataset.bubbleCustom = '1';
        // 不清除 style，让其与自定义颜色叠加
        pChat.style.setProperty('--bubble-user-bg', t.bubbleUserBg || '#0a84ff');
        pChat.style.setProperty('--bubble-user-text', t.bubbleUserText || '#ffffff');
        pChat.style.setProperty('--bubble-ai-bg', t.bubbleAiBg || '#ffffff');
        pChat.style.setProperty('--bubble-ai-text', t.bubbleAiText || '#1a1a1a');
    } else {
        delete pChat.dataset.bubbleCustom;
        pChat.style.removeProperty('--bubble-user-bg');
        pChat.style.removeProperty('--bubble-user-text');
        pChat.style.removeProperty('--bubble-ai-bg');
        pChat.style.removeProperty('--bubble-ai-text');
    }

    // 同步选中态
    document.querySelectorAll('.bubble-style-item').forEach(el => {
        el.classList.toggle('active', el.dataset.bubbleStyle === style);
    });
}

function applyChatBg() {
    const t = STATE.settings.theme || {};
    const pChat = document.getElementById('pageChat');
    if (!pChat) return;
    const url = t.chatBgImage;
    if (url) {
        pChat.dataset.chatBg = '1';
        pChat.style.setProperty('--chat-bg-image', `url("${url}")`);
    } else {
        delete pChat.dataset.chatBg;
        pChat.style.removeProperty('--chat-bg-image');
    }
    // 同步缩略图
    const thumb = document.getElementById('chatBgThumb');
    if (thumb) {
        if (url) {
            thumb.style.backgroundImage = `url("${url}")`;
            thumb.innerHTML = '';
        } else {
            thumb.style.backgroundImage = '';
            thumb.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>`;
        }
    }
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
    const { iconImages, iconColors } = STATE.settings.theme;
    document.querySelectorAll('.app-icon[data-app]').forEach(el => {
        const appName = el.dataset.app;
        const bg = el.querySelector('.app-icon-bg');
        if (!bg) return;
        // 第一次进入时保存原始 SVG，便于恢复默认时还原
        if (bg.dataset.originalContent === undefined) {
            bg.dataset.originalContent = bg.innerHTML;
        }
        const img = iconImages && iconImages[appName];
        const color = iconColors && iconColors[appName];
        const customized = !!(img || color);
        if (img) {
            // 用单独属性设置，避免 inline shorthand 残留覆盖
            bg.style.background = 'transparent';
            bg.style.backgroundImage = `url("${img}")`;
            bg.style.backgroundSize = 'cover';
            bg.style.backgroundPosition = 'center';
            bg.style.backgroundRepeat = 'no-repeat';
            bg.style.backgroundColor = 'transparent';
            bg.innerHTML = '';
        } else if (color) {
            bg.style.backgroundImage = 'none';
            bg.style.backgroundColor = color;
            bg.style.background = color;
            bg.innerHTML = '';
        } else {
            // 默认：纯白扁平图标（保留 stylesheet 中的 .app-icon-bg 默认 #fff 背景）
            bg.style.background = '';
            bg.style.backgroundImage = '';
            bg.style.backgroundColor = '';
            bg.style.backgroundSize = '';
            bg.style.backgroundPosition = '';
            bg.style.backgroundRepeat = '';
            // 还原原始 SVG（仅当当前为空时）
            if (!bg.innerHTML.trim() && bg.dataset.originalContent) {
                bg.innerHTML = bg.dataset.originalContent;
            }
        }
        el.classList.toggle('icon-customized', customized);
    });
    // 同步更新主题页预览
    updateAllIconPreviews();
}

// ===== 图标预览更新 =====
function updateIconPreview(appName) {
    const el = document.querySelector(`.icon-preview[data-preview="${appName}"]`);
    if (!el) return;
    const img = STATE.settings.theme.iconImages && STATE.settings.theme.iconImages[appName];
    const color = STATE.settings.theme.iconColors && STATE.settings.theme.iconColors[appName];
    if (img) {
        el.style.background = `url("${img}") center/cover no-repeat`;
    } else if (color) {
        el.style.background = color;
    } else {
        const def = DEFAULT_ICON_COLORS[appName];
        el.style.background = def ? `linear-gradient(135deg, ${def.c1}, ${def.c2})` : '#fff';
    }
    // 同步描边状态与颜色
    const hasStroke = STATE.settings.theme.iconStroke !== false;
    el.classList.toggle('no-stroke', !hasStroke);
    const strokeColor = STATE.settings.theme.iconStrokeColor || '#1a1a1a';
    el.style.borderColor = hasStroke ? strokeColor : 'transparent';
    // 同步形状
    const shape = STATE.settings.theme.iconShape || 'rounded';
    el.classList.remove('shape-rounded', 'shape-circle', 'shape-square');
    el.classList.add('shape-' + shape);
}

function updateAllIconPreviews() {
    ['chat','settings','theme','photos','music','safari','weather','notes','clock'].forEach(updateIconPreview);
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
            compressImage(file, async (blob) => {
                if (!blob) { showToast('图片处理失败'); return; }
                await saveMedia('icon_' + appName, blob);
                const objUrl = createObjURL(blob);
                if (!STATE.settings.theme.iconImages) STATE.settings.theme.iconImages = {};
                if (!STATE.settings.theme.iconColors) STATE.settings.theme.iconColors = {};
                STATE.settings.theme.iconImages[appName] = objUrl;
                // 上传图片时清除该图标的纯色覆盖（图片优先级更高）
                delete STATE.settings.theme.iconColors[appName];
                applyIconColors();
                await saveSetting("settings", STATE.settings);
                showToast(`${appName} 图标已更新`);
                e.target.value = '';
            });
        });
    });

    // 颜色选择器：同步当前已保存值
    const savedColors = (STATE.settings.theme && STATE.settings.theme.iconColors) || {};
    document.querySelectorAll('input[data-app-color]').forEach(picker => {
        const appName = picker.dataset.appColor;
        if (savedColors[appName]) {
            picker.value = savedColors[appName];
        }
        picker.addEventListener('input', async (e) => {
            const appName = picker.dataset.appColor;
            const color = e.target.value;
            if (!STATE.settings.theme.iconColors) STATE.settings.theme.iconColors = {};
            if (!STATE.settings.theme.iconImages) STATE.settings.theme.iconImages = {};
            STATE.settings.theme.iconColors[appName] = color;
            // 选纯色时清除该图标的图片覆盖
            if (STATE.settings.theme.iconImages[appName]) {
                try { await saveMedia('icon_' + appName, null); } catch(_) {}
                delete STATE.settings.theme.iconImages[appName];
            }
            applyIconColors();
        });
        picker.addEventListener('change', async () => {
            await saveSetting('settings', STATE.settings);
        });
    });

    // 单个图标重置按钮
    document.querySelectorAll('.icon-reset-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const appName = btn.dataset.appReset;
            if (!appName) return;
            if (STATE.settings.theme.iconImages && STATE.settings.theme.iconImages[appName]) {
                try { await saveMedia('icon_' + appName, null); } catch(_) {}
                delete STATE.settings.theme.iconImages[appName];
            }
            if (STATE.settings.theme.iconColors && STATE.settings.theme.iconColors[appName]) {
                delete STATE.settings.theme.iconColors[appName];
            }
            applyIconColors();
            await saveSetting('settings', STATE.settings);
            showToast(`${appName} 图标已重置`);
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
    
    if ($('hideCustomIconTextSwitch')) {
        theme.hideCustomIconText = $('hideCustomIconTextSwitch').checked;
    }

    if ($('iconStrokeSwitch')) {
        theme.iconStroke = $('iconStrokeSwitch').checked;
    }

    // 保存描边颜色
    const activeStrokeSwatch = document.querySelector('.stroke-swatch.active');
    const strokeCustomInput = $('strokeColorCustom');
    if (activeStrokeSwatch) {
        theme.iconStrokeColor = activeStrokeSwatch.dataset.strokeColor;
    } else if (strokeCustomInput) {
        theme.iconStrokeColor = strokeCustomInput.value;
    }

    await saveSetting('settings', STATE.settings);
    

    // 清理旧版 iconColors 数据
    

    applyTheme();
    showToast('主题已保存');
}

// ===== 恢复默认图标 =====
async function resetIcons() {
    // 清空所有自定义图标图片
    const apps = Object.keys(STATE.settings.theme.iconImages || {});
    for (const app of apps) {
        try { await saveMedia('icon_' + app, null); } catch(_) {}
    }
    STATE.settings.theme.iconImages = {};
    // 清空所有自定义图标颜色
    STATE.settings.theme.iconColors = {};
    applyIconColors();
    await saveSetting('settings', STATE.settings);
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
    compressImage(file, async (blob) => {
        if (!blob) { showToast('图片处理失败'); return; }
        await saveMedia('theme_wallpaper_img', blob);
        const objUrl = createObjURL(blob);
        STATE.settings.theme.wallpaperImage = objUrl;
        STATE.settings.theme.wallpaper = 'custom';
        applyWallpaper();
        loadThemeUI();
        await saveSetting("settings", STATE.settings);
        showToast('壁纸已更换');
        e.target.value = '';
    });
});

// 图标大小滑块
$('iconSize').addEventListener('input', (e) => {
    $('iconSizeValue').textContent = e.target.value;
});

// ===== 图标描边开关 + 描边颜色实时切换 =====
function bindIconStrokeSwitch() {
    const sw = $('iconStrokeSwitch');
    if (!sw) return;
    sw.addEventListener('change', () => {
        STATE.settings.theme.iconStroke = sw.checked;
        document.body.classList.toggle('no-icon-stroke', !sw.checked);
        const strokeColorRow = $('strokeColorRow');
        if (strokeColorRow) strokeColorRow.style.display = sw.checked ? 'flex' : 'none';
        updateAllIconPreviews();
        applyTheme();
    });
    // 绑定描边颜色色块
    document.querySelectorAll('.stroke-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.stroke-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            const color = swatch.dataset.strokeColor;
            STATE.settings.theme.iconStrokeColor = color;
            if ($('strokeColorCustom')) $('strokeColorCustom').value = color;
            applyTheme();
            updateAllIconPreviews();
        });
    });
    // 绑定自定义描边颜色拾色器
    const strokeCustom = $('strokeColorCustom');
    if (strokeCustom) {
        strokeCustom.addEventListener('input', (e) => {
            document.querySelectorAll('.stroke-swatch').forEach(s => s.classList.remove('active'));
            STATE.settings.theme.iconStrokeColor = e.target.value;
            applyTheme();
            updateAllIconPreviews();
        });
    }
}

// 保存主题
$('saveThemeBtn').addEventListener('click', saveTheme);


async function bootApp() {
    try {
        // Load Settings
        const s = await db.settings.get('settings');
        if (s && s.value) {
            STATE.settings = { ...STATE.settings, ...s.value };
        }
        
        
        // 辅助函数：判断是否是失效的旧 blob URL（仅在当前会话有效，新会话失效）
        const isStaleBlob = (url) => typeof url === 'string' && url.startsWith('blob:');

        const uImg = await getMedia('user_avatar_img');
        if (uImg) {
            STATE.settings.userAvatarImage = uImg;
        } else if (isStaleBlob(STATE.settings.userAvatarImage)) {
            STATE.settings.userAvatarImage = '';
        }

        const aImg = await getMedia('ai_avatar_img');
        if (aImg) {
            STATE.settings.avatarImage = aImg;
        } else if (isStaleBlob(STATE.settings.avatarImage)) {
            STATE.settings.avatarImage = '';
        }

        const wImg = await getMedia('theme_wallpaper_img');
        if (wImg) {
            STATE.settings.theme.wallpaperImage = wImg;
        } else if (isStaleBlob(STATE.settings.theme.wallpaperImage)) {
            STATE.settings.theme.wallpaperImage = '';
            // 如果壁纸是自定义图片但图片已失效，回退到默认壁纸
            if (STATE.settings.theme.wallpaper === 'custom') {
                STATE.settings.theme.wallpaper = DEFAULT_WALLPAPER;
            }
        }

        // 聊天背景图
        const cbgImg = await getMedia('chat_bg_img');
        if (cbgImg) {
            STATE.settings.theme.chatBgImage = cbgImg;
        } else if (isStaleBlob(STATE.settings.theme.chatBgImage)) {
            STATE.settings.theme.chatBgImage = '';
        }

        const apps = ['chat', 'settings', 'theme', 'photos', 'music', 'safari', 'weather', 'notes', 'clock'];
        if (!STATE.settings.theme.iconImages) STATE.settings.theme.iconImages = {};
        if (!STATE.settings.theme.iconColors) STATE.settings.theme.iconColors = {};
        if (!STATE.settings.theme.chatPreset) STATE.settings.theme.chatPreset = 'default';
        if (!STATE.settings.theme.globalTheme) STATE.settings.theme.globalTheme = 'default';
        for (const app of apps) {
            const m = await getMedia('icon_' + app);
            if (m) {
                STATE.settings.theme.iconImages[app] = m;
            } else if (isStaleBlob(STATE.settings.theme.iconImages[app])) {
                delete STATE.settings.theme.iconImages[app];
            }
        }

        // Load Agents
        const ag = await db.agents.get('agents');
        if (ag && ag.data) {
            STATE.agents = ag.data;
            // 恢复内存中的 Blob URL
            for (let a of STATE.agents) {
                try {
                    const aImg = await getMedia(a.id + '_avatar');
                    if (aImg) {
                        a.avatarImage = aImg;
                    } else if (a.avatarImage && a.avatarImage.startsWith('blob:')) {
                        a.avatarImage = '';
                    }
                } catch(e) {
                    a.avatarImage = '';
                }
            }
        }
        
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
        bindIconStrokeSwitch();
        rerenderMessages();
        syncOnlineModeSwitch();
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
    if (appId === 'agents') syncOnlineModeSwitch();
    setTimeout(updateStatusColor, 50);
};
const origClose = closeApp;
closeApp = function(e) {
    origClose(e);
    setTimeout(updateStatusColor, 50);
};
const origGoBack = goBackToChat;
goBackToChat = function() {
    origGoBack();
    setTimeout(updateStatusColor, 50);
};

updateStatusColor();
// ===== 智能体管理 =====

// 初始化 STATE.agents
STATE.agents = [];
STATE.currentAgentId = null;
STATE.agentChats = {};


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
                    <div class="agent-avatar" style="background:${agent.avatarC1}">${avatarHtml}</div>
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

// 默认 AI 头像备用色板
const DEFAULT_AGENT_PRESETS = ['#667eea','#fa709a','#4facfe','#43e97b','#f5576c','#fcb69f','#66a6ff','#ff9a9e','#a18cd1','#ffd60a'];

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
    
    // 重新渲染消息区域
    rerenderMessages();
    
    // 打开聊天页面
    openApp('chat');
    setTimeout(() => {
        const inp = $('messageInput');
        if (inp) inp.focus();
    }, 400);
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
                <circle cx="20" cy="20" r="20" fill="${agent.avatarC1}"/>
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
    const ma = getMessagesArea();
    if(ma) ma.querySelectorAll('.message, .typing-indicator').forEach(el => el.remove());
    STATE.messages.forEach(msg => {
        renderMsg(msg);
    });
    // 重新绑定长按
    requestAnimationFrame(() => {
        const ma = getMessagesArea();
        if(ma) ma.querySelectorAll('.message').forEach(msgEl => {
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
async function handleAgentAction(action) {
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
            if (await showConfirm(`确定删除"${agent.name}"及其所有聊天记录？`)) {
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
                c.classList.toggle('active', c.dataset.c1 === agent.avatarC1);
            });
            const customEl = colorsContainer.querySelector('.agent-acolor-custom');
            if (customEl) {
                customEl.value = agent.avatarC1 || '#667eea';
                const presetMatch = Array.from(colorsContainer.querySelectorAll('.agent-acolor')).some(c => c.dataset.c1 === agent.avatarC1);
                customEl.classList.toggle('active', !presetMatch);
            }
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
            const customEl = colorsContainer.querySelector('.agent-acolor-custom');
            if (customEl) {
                customEl.value = '#667eea';
                customEl.classList.remove('active');
            }
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
    const colorsContainer = $('agentAvatarColors');
    const activeCustom = colorsContainer ? colorsContainer.querySelector('.agent-acolor-custom.active') : null;
    const activeColor = document.querySelector('.agent-acolor.active');
    const avatarC1 = activeCustom ? activeCustom.value : (activeColor?.dataset.c1 || '#667eea');
    const avatarC2 = avatarC1;
    
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
            agent.avatarC2 = avatarC1;
            // 如果当前正在使用这个智能体，更新聊天头部和头像
            if (STATE.currentAgentId === agentId) {
                updateChatHeaderForAgent(agent);
                STATE.settings.avatarC1 = avatarC1;
                STATE.settings.avatarC2 = avatarC1;
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
            avatarC2: avatarC1,
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
addMsg = function(content, role, proxy = null) {
    const msg = origAddMsgAgent(content, role, proxy);
    // 保存到智能体聊天记录
    if (STATE.currentAgentId) {
        saveCurrentChatToAgent();
    }
    return msg;
};

// 修改 deleteMessage 以保存
const origDeleteMsgAgent = deleteMessage;
deleteMessage = async function(msg) {
    await origDeleteMsgAgent(msg);
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
// app/uchat.js 中已经绑定了 history.back()，此处无需重复绑定

// 微信风格 "+" 按钮：切换下拉菜单
if ($('agentAddBtn')) {
    $('agentAddBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        const dd = $('wechatPlusDropdown');
        if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
    });
}
if ($('ddAddAgent')) {
    $('ddAddAgent').addEventListener('click', () => {
        const dd = $('wechatPlusDropdown');
        if (dd) dd.style.display = 'none';
        openAgentEditOverlay(null, 'create');
    });
}
if ($('ddShakeAgent')) {
    $('ddShakeAgent').addEventListener('click', () => {
        const dd = $('wechatPlusDropdown');
        if (dd) dd.style.display = 'none';
        // 打开摇一摇设定弹窗
        const overlay = $('shakeOverlay');
        const input = $('shakeWorldInput');
        if (overlay) {
            overlay.style.display = 'flex';
            if (input) input.value = '';
            document.querySelectorAll('.shake-tag').forEach(t => t.classList.remove('active'));
            // 重置性别、种族、性格输入
            const genderInput = $('shakeGenderInput');
            const raceInput = $('shakeRaceInput');
            const personalityInput = $('shakePersonalityInput');
            if (genderInput) genderInput.value = '';
            if (raceInput) raceInput.value = '';
            if (personalityInput) personalityInput.value = '';
            
            // 恢复已保存的 Shake API 配置
            if ($('shakeApiUrl')) $('shakeApiUrl').value = STATE.settings.shakeApiUrl || '';
            if ($('shakeApiKey')) $('shakeApiKey').value = STATE.settings.shakeApiKey || '';
            if ($('shakeApiModel')) $('shakeApiModel').value = STATE.settings.shakeApiModel || '';
            if ($('shakeApiModelSelect')) $('shakeApiModelSelect').value = '';
        }
    });
}
// 点击外部关闭下拉菜单
document.addEventListener('click', (e) => {
    const wrap = $('wechatPlusWrap');
    const dd = $('wechatPlusDropdown');
    if (wrap && dd && !wrap.contains(e.target)) dd.style.display = 'none';
});

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

// 头像颜色选择（含自定义颜色拾色器）
document.querySelectorAll('#agentAvatarColors .agent-acolor').forEach(el => {
    el.addEventListener('click', () => {
        document.querySelectorAll('#agentAvatarColors .agent-acolor, #agentAvatarColors .agent-acolor-custom').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    });
});
document.addEventListener('input', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('agent-acolor-custom')) {
        const container = e.target.closest('#agentAvatarColors');
        if (container) {
            container.querySelectorAll('.agent-acolor, .agent-acolor-custom').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
        }
    }
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


// 修改 handleSend 以在发送 AI 回复后保存到智能体
const origHandleSendAgent = handleSend;
handleSend = async function() {
    await origHandleSendAgent();
    if (STATE.currentAgentId) {
        saveCurrentChatToAgent();
    }
};

// 左滑菜单处理
window.handleSwipeAction = async function(e, action, agentId) {
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
            if (await showConfirm(`确定删除"${agent.name}"及其所有聊天记录？`)) {
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

// 自定义头像逻辑
let tempAgentAvatarBlob = null;
let tempAgentAvatarUrl = '';

function setupAgentEditAvatar() {
    const uploadBtn = document.getElementById('agentEditUploadBtn');
    const fileInput = document.getElementById('agentEditAvatarFile');
    const preview = document.getElementById('agentEditAvatarPreview');
    const colorPreview = document.getElementById('agentEditColorPreview');
    const removeBtn = document.getElementById('agentEditRemoveAvatarBtn');
    
    if(!uploadBtn) return;
    
    // 防止重复绑定
    if(uploadBtn.dataset.bound === '1') return;
    uploadBtn.dataset.bound = '1';
    
    uploadBtn.addEventListener('click', (e) => {
        e.preventDefault(); // 防止触发表单或其他事件
        fileInput.click();
    });
    
    removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        tempAgentAvatarBlob = null;
        if(tempAgentAvatarUrl) {
            URL.revokeObjectURL(tempAgentAvatarUrl);
            tempAgentAvatarUrl = '';
        }
        preview.style.display = 'none';
        colorPreview.style.display = 'block';
        removeBtn.style.display = 'none';
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        
        try {
            compressImage(file, (blob) => {
                if (!blob) {
                    showToast("图片处理失败");
                    return;
                }
                tempAgentAvatarBlob = blob;
                if(tempAgentAvatarUrl) URL.revokeObjectURL(tempAgentAvatarUrl);
                tempAgentAvatarUrl = URL.createObjectURL(blob);
                
                preview.style.backgroundImage = `url(${tempAgentAvatarUrl})`;
                preview.style.display = 'block';
                colorPreview.style.display = 'none';
                removeBtn.style.display = 'block';
            });
        } catch(err) {
            console.error("压缩图片失败", err);
            showToast("图片处理失败");
        }
    });
}

// 拦截 openAgentEditOverlay 加入重置逻辑
const originalOpenAgentEditOverlay = openAgentEditOverlay;
openAgentEditOverlay = function(agent, mode) {
    setupAgentEditAvatar();
    
    // 重置临时头像状态
    tempAgentAvatarBlob = null;
    if(tempAgentAvatarUrl) {
        URL.revokeObjectURL(tempAgentAvatarUrl);
        tempAgentAvatarUrl = '';
    }
    
    const preview = document.getElementById('agentEditAvatarPreview');
    const colorPreview = document.getElementById('agentEditColorPreview');
    const removeBtn = document.getElementById('agentEditRemoveAvatarBtn');
    const fileInput = document.getElementById('agentEditAvatarFile');
    
    if(fileInput) fileInput.value = '';
    
    if(agent && agent.avatarImage) {
        preview.style.backgroundImage = `url(${agent.avatarImage})`;
        preview.style.display = 'block';
        colorPreview.style.display = 'none';
        removeBtn.style.display = 'block';
    } else {
        preview.style.backgroundImage = 'none';
        preview.style.display = 'none';
        colorPreview.style.display = 'block';
        removeBtn.style.display = 'none';
    }
    
    // 同步颜色预览底色
    const initColor = (agent && agent.avatarC1) || '#667eea';
    if (colorPreview) colorPreview.style.background = initColor;
    
    originalOpenAgentEditOverlay(agent, mode);
};

// 色板点击 → 同步颜色预览背景色 + 清除上传图片预览
document.addEventListener('click', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('agent-acolor')) {
        const container = e.target.closest('#agentAvatarColors');
        if (!container) return;
        const c1 = e.target.dataset.c1;
        if (!c1) return;
        const colorPreview = document.getElementById('agentEditColorPreview');
        const imgPreview = document.getElementById('agentEditAvatarPreview');
        const removeBtn = document.getElementById('agentEditRemoveAvatarBtn');
        if (colorPreview) {
            colorPreview.style.background = c1;
            colorPreview.style.display = 'flex';
        }
        if (imgPreview) imgPreview.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'none';
        // 清除已选择的上传图片
        tempAgentAvatarBlob = null;
        if (tempAgentAvatarUrl) {
            URL.revokeObjectURL(tempAgentAvatarUrl);
            tempAgentAvatarUrl = '';
        }
    }
});

// 自定义颜色拾色器实时同步预览
document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'agentEditColorCustom') {
        const c1 = e.target.value;
        const colorPreview = document.getElementById('agentEditColorPreview');
        const imgPreview = document.getElementById('agentEditAvatarPreview');
        const removeBtn = document.getElementById('agentEditRemoveAvatarBtn');
        if (colorPreview) {
            colorPreview.style.background = c1;
            colorPreview.style.display = 'flex';
        }
        if (imgPreview) imgPreview.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'none';
        tempAgentAvatarBlob = null;
        if (tempAgentAvatarUrl) {
            URL.revokeObjectURL(tempAgentAvatarUrl);
            tempAgentAvatarUrl = '';
        }
    }
});

// 重写 agentEditConfirm 的保存逻辑
const origAgentEditConfirm = document.getElementById('agentEditConfirm');
if(origAgentEditConfirm) {
    const newConfirm = origAgentEditConfirm.cloneNode(true);
    origAgentEditConfirm.parentNode.replaceChild(newConfirm, origAgentEditConfirm);
    
    newConfirm.addEventListener('click', async () => {
        const nameInput = document.getElementById('agentEditName');
        const promptTextarea = document.getElementById('agentEditPrompt');
        const overlay = document.getElementById('agentEditOverlay');
        
        const name = nameInput.value.trim();
        if (!name) { showToast('名称不能为空'); return; }
        
        let agentId = overlay.dataset.editId;
        const isEdit = !!agentId;
        
        // 从激活的色板（含自定义拾色器）取色
        const colorsContainer = document.getElementById('agentAvatarColors');
        let c1 = '#667eea';
        if (colorsContainer) {
            const activeCustom = colorsContainer.querySelector('.agent-acolor-custom.active');
            const activeSwatch = colorsContainer.querySelector('.agent-acolor.active');
            if (activeCustom) {
                c1 = activeCustom.value || '#667eea';
            } else if (activeSwatch && activeSwatch.dataset.c1) {
                c1 = activeSwatch.dataset.c1;
            }
        }
        const c2 = c1; // 纯色
        
        let agent;
        if (isEdit) {
            agent = STATE.agents.find(a => a.id === agentId);
            if (!agent) return;
            agent.name = name;
            agent.systemPrompt = promptTextarea.value.trim();
            agent.avatarC1 = c1;
            agent.avatarC2 = c2;
        } else {
            agentId = 'agent_' + Date.now();
            agent = {
                id: agentId,
                name: name,
                systemPrompt: promptTextarea.value.trim(),
                avatarC1: c1,
                avatarC2: c2,
                isPinned: false
            };
            STATE.agents.push(agent);
            STATE.agentChats[agentId] = { unread: 0, messages: [] };
        }
        
        // 处理头像上传
        const removeBtn = document.getElementById('agentEditRemoveAvatarBtn');
        const isRemoved = removeBtn ? removeBtn.style.display === 'none' : true;
        
        if (isRemoved) {
            agent.avatarImage = '';
            await saveMedia(agentId + '_avatar', null);
        } else if (tempAgentAvatarBlob) {
            await saveMedia(agentId + '_avatar', tempAgentAvatarBlob);
            agent.avatarImage = tempAgentAvatarUrl; // 当前页面生命周期的缓存
        }
        
        await saveAgents();
        await saveAgentChats();
        
        // 如果编辑的是当前正在使用的智能体，同步头像到聊天页
        if (STATE.currentAgentId === agentId) {
            STATE.settings.avatarC1 = agent.avatarC1;
            STATE.settings.avatarC2 = agent.avatarC2;
            STATE.settings.avatarImage = agent.avatarImage || '';
            STATE.settings.systemPrompt = agent.systemPrompt;
            applyAvatar();
            updateChatHeaderForAgent(agent);
            await saveSetting("settings", STATE.settings);
        }
        
        renderAgentList();
        
        overlay.style.display = 'none';
        overlay.dataset.editId = '';
    });
}

// ===== 摇一摇盲盒智能体功能 =====
function initShakeAgent() {
    const overlay = $('shakeOverlay');
    const tags = document.querySelectorAll('.shake-tag');
    const input = $('shakeWorldInput');
    const cancel = $('shakeCancel');
    const start = $('shakeStart');
    
    const resultOverlay = $('shakeResultOverlay');
    const animBox = $('shakeAnimBox');
    const cardBox = $('shakeCardBox');
    const phoneIcon = document.querySelectorAll('.shake-phone-icon')[0];
    
    let activeWorld = '';
    let isShaking = false;
    let newAgentData = null;

    if (!overlay) return;

    // 标签选择（打开弹窗由 ddShakeAgent 处理）
    // 2. 选择标签
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            activeWorld = tag.dataset.tag;
            input.value = ''; // 选择标签清空输入框
        });
    });


    input.addEventListener('input', () => {
        if (input.value.trim()) {
            tags.forEach(t => t.classList.remove('active'));
            activeWorld = input.value.trim();
        }
    });

    cancel.addEventListener('click', () => {
        overlay.style.display = 'none';
    });

    // 模型拉取功能
    const shakeFetchModelsBtn = $('shakeFetchModelsBtn');
    if (shakeFetchModelsBtn) {
        shakeFetchModelsBtn.addEventListener('click', async () => {
            const url = ($('shakeApiUrl') || {}).value?.trim() || STATE.settings.apiEndpoint;
            const key = ($('shakeApiKey') || {}).value?.trim() || STATE.settings.apiKey;
            if (!key) { showToast('请先填写 API Key (摇一摇设置或全局设置中)'); return; }

            shakeFetchModelsBtn.textContent = '拉取中...';
            shakeFetchModelsBtn.disabled = true;

            try {
                let ep = url.replace(/\/+$/, '');
                if (!ep.endsWith('/models')) ep += '/models';
                const res = await fetch(ep, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${key}` }
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

                const select = $('shakeApiModelSelect');
                if (select) {
                    select.innerHTML = '<option value="">自定义模型</option>';
                    modelIds.forEach(id => {
                        const opt = document.createElement('option');
                        opt.value = id;
                        opt.textContent = id;
                        select.appendChild(opt);
                    });
                }
                showToast(`已拉取 ${modelIds.length} 个模型`);
            } catch (error) {
                showToast(error.message || '拉取失败', 3000);
            } finally {
                shakeFetchModelsBtn.textContent = '拉取';
                shakeFetchModelsBtn.disabled = false;
            }
        });
    }

    const shakeApiModelSelect = $('shakeApiModelSelect');
    if (shakeApiModelSelect) {
        shakeApiModelSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val) {
                if ($('shakeApiModel')) $('shakeApiModel').value = val;
            }
        });
    }

    const shakeApiSaveBtn = $('shakeApiSaveBtn');
    if (shakeApiSaveBtn) {
        shakeApiSaveBtn.addEventListener('click', async () => {
            STATE.settings.shakeApiUrl = ($('shakeApiUrl') || {}).value?.trim() || '';
            STATE.settings.shakeApiKey = ($('shakeApiKey') || {}).value?.trim() || '';
            STATE.settings.shakeApiModel = ($('shakeApiModel') || {}).value?.trim() || '';
            await saveSetting('settings', STATE.settings);
            showToast('摇一摇API配置已保存');
        });
    }

    const shakeApiClearBtn = $('shakeApiClearBtn');
    if (shakeApiClearBtn) {
        shakeApiClearBtn.addEventListener('click', async () => {
            if ($('shakeApiUrl')) $('shakeApiUrl').value = '';
            if ($('shakeApiKey')) $('shakeApiKey').value = '';
            if ($('shakeApiModel')) $('shakeApiModel').value = '';
            if ($('shakeApiModelSelect')) $('shakeApiModelSelect').value = '';
            STATE.settings.shakeApiUrl = '';
            STATE.settings.shakeApiKey = '';
            STATE.settings.shakeApiModel = '';
            await saveSetting('settings', STATE.settings);
            showToast('已清空，将使用全局聊天配置');
        });
    }

    // 3. 准备摇晃
    start.addEventListener('click', () => {
        if (!activeWorld) activeWorld = '现代日常'; // 默认世界观
        overlay.style.display = 'none';
        resultOverlay.style.display = 'flex';
        animBox.style.display = 'block';
        cardBox.style.display = 'none';
        
        isShaking = false;
        
        // 如果支持设备运动，监听摇一摇；否则可以通过点击图标模拟
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission().then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('devicemotion', handleMotion);
                }
            }).catch(console.error);
        } else {
            window.addEventListener('devicemotion', handleMotion);
        }
    });
    
    // 点击图标也可触发
    if(phoneIcon) phoneIcon.addEventListener('click', triggerShake);

    let lastX = null, lastY = null, lastZ = null;
    let shakeThreshold = 15;
    
    function handleMotion(e) {
        if(isShaking) return;
        let acc = e.accelerationIncludingGravity;
        if(!acc) return;
        if(lastX === null) {
            lastX = acc.x; lastY = acc.y; lastZ = acc.z;
            return;
        }
        let deltaX = Math.abs(lastX - acc.x);
        let deltaY = Math.abs(lastY - acc.y);
        let deltaZ = Math.abs(lastZ - acc.z);
        if(deltaX > shakeThreshold || deltaY > shakeThreshold || deltaZ > shakeThreshold) {
            triggerShake();
        }
        lastX = acc.x; lastY = acc.y; lastZ = acc.z;
    }

    // 读取摇一摇弹窗中的独立 API 配置（空则回退到聊天 API）
    function getShakeApiOverrides() {
        const url = ($('shakeApiUrl') || {}).value?.trim() || '';
        const key = ($('shakeApiKey') || {}).value?.trim() || '';
        const model = ($('shakeApiModel') || {}).value?.trim() || '';
        if (!url && !key && !model) return null; // 全部为空则使用默认
        const ov = {};
        if (url) ov.apiEndpoint = url;
        if (key) ov.apiKey = key;
        if (model) ov.model = model;
        return ov;
    }

    async function triggerShake() {
        if(isShaking) return;
        isShaking = true;
        window.removeEventListener('devicemotion', handleMotion);
        
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        
        const animText = document.querySelectorAll('.shake-anim-text')[0];
        animText.textContent = `正在连接 [${activeWorld}] 平行宇宙...`;
        
        // 读取性别、种族和性格选填字段
        const selectedGender = ($('shakeGenderInput') || {}).value?.trim() || '';
        const selectedRace = ($('shakeRaceInput') || {}).value?.trim() || '';
        const personalityPref = ($('shakePersonalityInput') || {}).value?.trim() || '';

        let extraConstraints = '';
        if (selectedGender) extraConstraints += `\n角色的性别设定为：${selectedGender}。`;
        if (selectedRace) extraConstraints += `\n角色的种族/物种设定为：${selectedRace}。`;
        if (personalityPref) extraConstraints += `\n角色的性格倾向应该是：${personalityPref}。`;

        // 调用 LLM 生成角色
        const prompt = `你现在是一个角色设计师。请根据提供的世界观：【${activeWorld}】，随机创造一个具有正常人类名字和独特真实性格的普通人角色。${extraConstraints}
请必须以纯 JSON 格式输出，不要输出任何额外的 markdown 标记（如 \`\`\`json ）。包含以下字段：
{
  "name": "必须是一个符合该世界观的正常人类名字",
  "personality": "简短的性格特点描述（如：外表冷漠但内心社恐）",
  "system_prompt": "这个角色的系统指令，设定他以后聊天的语气、背景、世界观限制。使用第一人称描述自己。",
  "first_message": "他见到我说的第一句话，要符合性格和当前世界观"
}`;

        try {
            const shakeOverrides = getShakeApiOverrides();
            const resultStr = await callLLM([{role:'user', content:prompt}], shakeOverrides);
            const jsonMatch = resultStr.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("解析角色失败");
            
            const agentData = JSON.parse(jsonMatch[0]);
            
            // 随机生成一个颜色作为头像背景
            const colors = ['#667eea', '#fa709a', '#4facfe', '#43e97b', '#f5576c', '#fcb69f', '#ff9a9e', '#a18cd1', '#ffd60a'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const firstChar = agentData.name.charAt(0) || 'A';
            
            newAgentData = {
                id: 'agent_' + Date.now(),
                name: agentData.name,
                systemPrompt: agentData.system_prompt,
                avatarC1: randomColor,
                avatarImage: null,
                _firstMessage: agentData.first_message,
                _world: activeWorld,
                _personality: agentData.personality,
                _firstChar: firstChar
            };
            
            showResultCard();
            
        } catch (e) {
            console.error(e);
            animText.textContent = e.message || "时空乱流，连接失败，请重试";
            isShaking = false;
            setTimeout(() => {
                resultOverlay.style.display = 'none';
            }, 3000);
        }
    }

    function showResultCard() {
        animBox.style.display = 'none';
        cardBox.style.display = 'block';
        
        $('shakeCardAvatar').style.background = newAgentData.avatarC1;
        $('shakeCardAvatar').textContent = newAgentData._firstChar;
        $('shakeCardName').textContent = newAgentData.name;
        $('shakeCardWorld').textContent = `来自: ${newAgentData._world}`;
        $('shakeCardPersonality').textContent = `性格: ${newAgentData._personality}`;
        $('shakeCardMsg').textContent = newAgentData._firstMessage;
    }

    $('shakeRetry').addEventListener('click', () => {
        cardBox.style.display = 'none';
        animBox.style.display = 'block';
        document.querySelectorAll('.shake-anim-text')[0].textContent = "请摇晃手机或点击此处...";
        isShaking = false;
        // 允许重新摇晃或点击
        window.addEventListener('devicemotion', handleMotion);
    });
    
    $('shakeChat').addEventListener('click', () => {
        // 保存并进入聊天
        if(!newAgentData) return;
        
        const agentToSave = {
            id: newAgentData.id,
            name: newAgentData.name,
            systemPrompt: newAgentData.systemPrompt,
            avatarC1: newAgentData.avatarC1,
            avatarImage: null
        };
        
        STATE.agents.unshift(agentToSave);
        STATE.agentChats[agentToSave.id] = { unread: 0, messages: [] };
        
        // 写入第一句话
        STATE.agentChats[agentToSave.id].messages.push({
            id: 'msg_' + Date.now(),
            role: 'ai',
            content: newAgentData._firstMessage,
            time: getTime()
        });
        
        saveAgents();
        saveAgentChats();
        renderAgentList();
        
        resultOverlay.style.display = 'none';
        selectAgent(agentToSave.id);
    });
    
    // 点击背景关闭结果弹窗
    resultOverlay.addEventListener('click', (e) => {
        if(e.target === resultOverlay) {
            resultOverlay.style.display = 'none';
            window.removeEventListener('devicemotion', handleMotion);
        }
    });
}
setTimeout(initShakeAgent, 500);
