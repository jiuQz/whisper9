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
        shakeNegativePrompt: '',
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
            chatBgImage: '', // ObjectURL
            bubbleCustomCssEnable: false,
            bubbleCustomCss: '',
            bubbleCssPresets: [] // [{ id, name, css }]
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

function normalizeErrorMessage(error, fallback = '发生错误') {
    if (!error) return fallback;
    if (typeof error === 'string') return error;
    if (error.stack) return error.stack;
    if (error.message) return error.message;
    try {
        return JSON.stringify(error, null, 2);
    } catch (_) {
        return String(error);
    }
}

async function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }

    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
}

function showErrorPopup(error, fallback = '发生错误') {
    const msg = normalizeErrorMessage(error, fallback);
    const existing = document.getElementById('errorPopupOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'errorPopupOverlay';
    overlay.className = 'error-popup-overlay';
    overlay.innerHTML = `
        <div class="error-popup-sheet" role="dialog" aria-modal="true" aria-label="错误详情">
            <div class="error-popup-handle"></div>
            <div class="error-popup-title">错误详情</div>
            <div class="error-popup-content" tabindex="0"></div>
            <div class="error-popup-actions">
                <button type="button" class="error-popup-btn copy">复制错误</button>
                <button type="button" class="error-popup-btn close">关闭</button>
            </div>
        </div>
    `;

    const content = overlay.querySelector('.error-popup-content');
    const copyBtn = overlay.querySelector('.error-popup-btn.copy');
    const closeBtn = overlay.querySelector('.error-popup-btn.close');
    content.textContent = msg;

    const close = () => {
        overlay.classList.remove('show');
        setTimeout(() => {
            if (overlay.parentNode) overlay.remove();
        }, 260);
    };

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    closeBtn.addEventListener('click', close);
    copyBtn.addEventListener('click', async () => {
        try {
            await copyTextToClipboard(msg);
            showToast('错误信息已复制');
        } catch (_) {
            showToast('复制失败');
        }
    });

    const phoneBody = document.querySelector('.phone-body');
    if (phoneBody) {
        phoneBody.appendChild(overlay);
    } else {
        document.body.appendChild(overlay);
    }

    overlay.offsetHeight;
    overlay.classList.add('show');
}

window.addEventListener('error', (e) => {
    showErrorPopup(e.error || e.message, '运行错误');
});

window.addEventListener('unhandledrejection', (e) => {
    showErrorPopup(e.reason, '未处理的 Promise 错误');
});

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
                    <textarea class="custom-prompt-input" style="height: 120px; resize: none; border-radius: 6px; padding: 8px; border: 1px solid rgba(0,0,0,0.1); width: 100%; box-sizing: border-box;" autocomplete="off"></textarea>
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
        
        // 自动聚焦 & 回车确认（对于多行文本框，如果是 ctrl+enter 或 shift+enter 才确认，单按 enter 换行）
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                onConfirm();
            }
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
        agents: 'pageAgents', mask: 'pageMask'
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
function getSelectableMessageEls() {
    const ma = getMessagesArea();
    return ma ? Array.from(ma.querySelectorAll('.message[data-id]')) : [];
}

function ensureMessageSelectCheck(msgEl) {
    if (!msgEl || !msgEl.dataset || !msgEl.dataset.id) return;
    if (!msgEl.querySelector('.message-select-check')) {
        const check = document.createElement('div');
        check.className = 'message-select-check';
        check.setAttribute('aria-hidden', 'true');
        msgEl.appendChild(check);
    }
}

function bindMultiselectMessageClick(msgEl) {
    if (!msgEl || msgEl._multiselectClickBound) return;
    msgEl._multiselectClickBound = true;
    msgEl.addEventListener('click', (e) => {
        if (!isMultiselectMode) return;
        if (Date.now() - (msgEl._lastMultiTouchToggle || 0) < 450) return;
        e.preventDefault();
        e.stopPropagation();
        toggleMsgSelect(msgEl);
    }, true);
}

function syncMultiselectMessageEls() {
    const allMsgEls = getSelectableMessageEls();
    allMsgEls.forEach(msgEl => {
        ensureMessageSelectCheck(msgEl);
        bindMultiselectMessageClick(msgEl);
        msgEl.classList.toggle('selected', selectedMsgs.has(msgEl.dataset.id));
    });
    return allMsgEls;
}

function enterMultiselectMode(msg) {
    if (!msg || !msg.id) return;
    isMultiselectMode = true;
    selectedMsgs = new Set([msg.id]);

    const ma = getMessagesArea();
    if (!ma) return;
    ma.classList.add('multiselect-mode');
    syncMultiselectMessageEls();

    if (multiselectBar) {
        multiselectBar.style.display = 'flex';
    }
    updateMultiselectUI();
    showToast('已进入多选：点按消息可自定义选择');
}

function toggleMsgSelect(msgEl) {
    if (!isMultiselectMode || !msgEl || !msgEl.dataset) return;
    const id = msgEl.dataset.id;
    if (!id) return;
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
    const allMsgEls = getSelectableMessageEls();
    const validIds = new Set(allMsgEls.map(el => el.dataset.id).filter(Boolean));
    selectedMsgs = new Set([...selectedMsgs].filter(id => validIds.has(id)));

    const selectedCount = selectedMsgs.size;
    const count = $('multiselectCount');
    if (count) {
        const total = allMsgEls.length;
        count.textContent = total > 0 ? `已选择 ${selectedCount}/${total} 条` : '暂无可选消息';
    }

    const allBtn = $('multiselectSelectAllBtn');
    if (allBtn) {
        const allSelected = allMsgEls.length > 0 && allMsgEls.every(el => selectedMsgs.has(el.dataset.id));
        allBtn.textContent = allSelected ? '取消全选' : '全选';
    }

    ['multiselectScreenshotBtn', 'multiselectDeleteBtn', 'multiselectForwardBtn'].forEach(id => {
        const btn = $(id);
        if (btn) {
            btn.disabled = selectedCount === 0;
            btn.style.opacity = selectedCount === 0 ? '0.45' : '1';
        }
    });
}

function selectAllMessages() {
    if (!isMultiselectMode) return;
    const allMsgEls = syncMultiselectMessageEls();
    const allSelected = allMsgEls.length > 0 && allMsgEls.every(msgEl => selectedMsgs.has(msgEl.dataset.id));

    if (allSelected) {
        selectedMsgs.clear();
        allMsgEls.forEach(msgEl => msgEl.classList.remove('selected'));
    } else {
        allMsgEls.forEach(msgEl => {
            const id = msgEl.dataset.id;
            if (!id) return;
            selectedMsgs.add(id);
            msgEl.classList.add('selected');
        });
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
    updateMultiselectUI();
}

async function screenshotSelectedMessages() {
    if (selectedMsgs.size === 0) return;

    const ma = getMessagesArea();
    const allMsgEls = ma ? Array.from(ma.querySelectorAll('.message[data-id]')) : [];
    // 按页面中实际出现顺序选取选中的元素
    const selectedEls = allMsgEls.filter(el => selectedMsgs.has(el.dataset.id));
    if (selectedEls.length === 0) return;

    // 闪光动效
    const phoneBody = document.querySelector('.phone-body');
    const flash = document.createElement('div');
    flash.className = 'screenshot-flash';
    if (phoneBody) phoneBody.appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    if (typeof html2canvas !== 'function') {
        showToast('截图组件未加载');
        return;
    }

    // 构建一个临时的离屏容器，把选中消息的克隆体顺序拼接到一起，
    // 这样 html2canvas 只渲染这些消息，不会截到聊天框外面任何东西。
    const wrap = document.createElement('div');
    // 让它在视觉上不可见但可被 html2canvas 捕获
    wrap.style.cssText = `
        position: fixed;
        top: 0;
        left: -10000px;
        width: ${ma ? ma.clientWidth : 360}px;
        padding: 14px;
        background: ${getComputedStyle(ma || document.body).backgroundColor || '#f2f2f7'};
        box-sizing: border-box;
        z-index: -1;
        pointer-events: none;
    `;

    // 如果开启了自定义背景，把背景图也带上
    const pageChat = document.getElementById('pageChat');
    if (pageChat && pageChat.getAttribute('data-chat-bg') === '1') {
        const bg = getComputedStyle(ma).backgroundImage;
        if (bg && bg !== 'none') {
            wrap.style.backgroundImage = bg;
            wrap.style.backgroundSize = 'cover';
            wrap.style.backgroundPosition = 'center';
            wrap.style.backgroundRepeat = 'no-repeat';
        }
    }

    selectedEls.forEach(el => {
        const clone = el.cloneNode(true);
        // 强制保留动画结束后的样式
        clone.style.animation = 'none';
        clone.style.opacity = '1';
        clone.style.transform = 'none';
        wrap.appendChild(clone);
    });

    document.body.appendChild(wrap);

    try {
        const canvas = await html2canvas(wrap, {
            backgroundColor: null,
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: wrap.offsetWidth,
            height: wrap.offsetHeight
        });

        canvas.toBlob(async (blob) => {
            if (!blob) { showToast('截图失败'); return; }
            try {
                if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
                    await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
                    showToast('长截图已复制到剪贴板');
                } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `chat-${Date.now()}.png`;
                    document.body.appendChild(a); a.click();
                    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
                    showToast('长截图已下载');
                }
                exitMultiselectMode();
            } catch (err) {
                showToast('截图复制失败，已下载');
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `chat-${Date.now()}.png`;
                document.body.appendChild(a); a.click();
                setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
                exitMultiselectMode();
            }
        }, 'image/png');
    } catch (err) {
        console.error('screenshotSelectedMessages error:', err);
        showToast('截图失败：' + (err && err.message ? err.message : '未知错误'));
    } finally {
        // 清理临时容器
        setTimeout(() => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 500);
    }
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

// 7. 截图气泡（使用 html2canvas 真实渲染 DOM，所见即所得，仅截取气泡本身）
async function screenshotBubble(msg) {
    const ma = getMessagesArea();
    const msgEl = ma ? ma.querySelector(`.message[data-id="${msg.id}"]`) : null;
    if (!msgEl) {
        showToast('消息元素未找到');
        return;
    }

    // 闪光动效
    const phoneBody = document.querySelector('.phone-body');
    const flash = document.createElement('div');
    flash.className = 'screenshot-flash';
    if (phoneBody) phoneBody.appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    if (typeof html2canvas !== 'function') {
        showToast('截图组件未加载');
        return;
    }

    try {
        // 仅截取消息整行（包含头像 + 气泡），裁剪范围严格限定在该 .message 元素内
        const canvas = await html2canvas(msgEl, {
            backgroundColor: null,
            scale: window.devicePixelRatio > 1 ? 2 : 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            // 关键：让 html2canvas 严格只渲染目标节点尺寸，不向外扩展
            width: msgEl.offsetWidth,
            height: msgEl.offsetHeight,
            windowWidth: document.documentElement.scrollWidth,
            windowHeight: document.documentElement.scrollHeight
        });

        canvas.toBlob(async (blob) => {
            if (!blob) { showToast('截图失败'); return; }
            try {
                if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
                    await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
                    showToast('截图已复制到剪贴板');
                } else {
                    // 兜底：浏览器不支持剪贴板时直接下载
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `bubble-${Date.now()}.png`;
                    document.body.appendChild(a); a.click();
                    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
                    showToast('截图已下载');
                }
            } catch (err) {
                showToast('截图复制失败，已下载');
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `bubble-${Date.now()}.png`;
                document.body.appendChild(a); a.click();
                setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
            }
        }, 'image/png');
    } catch (err) {
        console.error('screenshotBubble error:', err);
        showToast('截图失败：' + (err && err.message ? err.message : '未知错误'));
    }
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
    
    el.addEventListener('touchend', (e) => {
        cancelLongPress();
        if (isMultiselectMode && !moved) {
            const msgEl = getMsgElement(el);
            if (msgEl) {
                msgEl._lastMultiTouchToggle = Date.now();
                e.preventDefault();
                toggleMsgSelect(msgEl);
            }
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
};

window.handleGenerate = async function() {
    if (STATE.isProcessing) return;
    
    const sendAgentId = STATE.currentAgentId;
    const sendAgent = sendAgentId === DEFAULT_AGENT_ID
        ? getDefaultAgent()
        : STATE.agents.find(a => a.id === sendAgentId);

    STATE.isProcessing = true;
    updateBtn();
    showTyping();
    
    // 在 STATE.messages 仍然指向当前 agent 时，复制上下文
    const ctxMessages = STATE.messages.map(m => ({ role: m.role, content: m.content }));
    
    // 用户是否仍处于原 agent 上下文（可能在 chat 页或已离开）
    const isStillOriginalAgent = () => STATE.currentAgentId === sendAgentId;
    // 用户是否仍在原聊天页面（用于决定是否更新 DOM）
    const isStillOnChat = () => currentApp === 'chat' && isStillOriginalAgent();
    
    try {
        const response = await callAI(ctxMessages);
        
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
                    if (delta) full += delta;
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
                        if (delta) full += delta;
                    } catch(ee) {}
                }
            }
        }
        
        hideTyping();
        
        const parts = full.split('|||').map(p => p.trim()).filter(p => p);
        if (parts.length === 0) parts.push('...');
        const notificationText = parts.join(' ');
        
        for (let i = 0; i < parts.length; i++) {
            if (i > 0 && isStillOnChat()) {
                showTyping();
                await new Promise(r => setTimeout(r, 1500));
                hideTyping();
            }
            
            const mid = Date.now().toString(36) + Math.random().toString(36).substr(2,5);
            const partMsg = { id: mid, content: parts[i], role: 'ai', time: getTime() };
            
            const voiceMatch = parts[i].match(/\[Voice:(.*?)\]/is);
            if (voiceMatch) {
                partMsg.content = voiceMatch[1].trim();
                partMsg.proxy = { type: 'voice' };
            }
            
            // 解析自定义表情包：[表情:关键词] / [表情包:关键词] / [emoji:关键词]
            const emojiMatch = parts[i].match(/\[(?:表情包?|emoji)\s*[:：]\s*([^\]\n]+?)\s*\]/i);
            if (emojiMatch) {
                const kw = emojiMatch[1].trim();
                let customEmojis = [];
                try { customEmojis = JSON.parse(localStorage.getItem('customEmojis') || '[]'); } catch(e){}
                // 优先精确匹配，再做包含匹配
                let hit = customEmojis.find(e => e.keyword === kw);
                if (!hit) hit = customEmojis.find(e => e.keyword && (e.keyword.includes(kw) || kw.includes(e.keyword)));
                if (hit) {
                    partMsg.content = `[表情:${hit.keyword}]`;
                    partMsg.proxy = { type: 'emoji', url: hit.url };
                }
            }
            
            if (isStillOriginalAgent()) {
                STATE.messages.push(partMsg);
                if (isStillOnChat()) {
                    renderMsg(partMsg);
                    scrollBottom();
                }
            } else {
                await saveAiMsgToAgentChat(sendAgentId, partMsg);
            }
        }
        
        if (isStillOriginalAgent()) {
            if (typeof saveCurrentChatToAgent === 'function') saveCurrentChatToAgent();
            if (!isStillOnChat()) {
                if (sendAgentId && sendAgentId !== DEFAULT_AGENT_ID) {
                    if (!STATE.agentChats[sendAgentId]) STATE.agentChats[sendAgentId] = { messages: [], unread: 0 };
                    STATE.agentChats[sendAgentId].unread = (STATE.agentChats[sendAgentId].unread || 0) + 1;
                    await saveAgentChats();
                    if (currentApp === 'agents') renderAgentList();
                }
                if (sendAgent) showAgentNotification(sendAgent, notificationText, sendAgentId);
            }
        } else {
            if (sendAgentId && sendAgentId !== DEFAULT_AGENT_ID) {
                if (!STATE.agentChats[sendAgentId]) STATE.agentChats[sendAgentId] = { messages: [], unread: 0 };
                STATE.agentChats[sendAgentId].unread = (STATE.agentChats[sendAgentId].unread || 0) + 1;
                await saveAgentChats();
                if (currentApp === 'agents') renderAgentList();
            }
            if (sendAgent) showAgentNotification(sendAgent, notificationText, sendAgentId);
        }
    } catch (error) {
        hideTyping();
        if (isStillOnChat()) {
            showErrorPopup(error, '请求失败');
            addMsg(`⚠️ 抱歉，发生错误：${error.message}`, 'ai');
        } else {
            console.error('后台 AI 生成出错:', error);
            showErrorPopup(error, '后台 AI 生成出错');
        }
    } finally {
        hideTyping();
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
    // 等待 DOM 渲染完成后绑定长按 / 多选点击
    requestAnimationFrame(() => {
        const ma = getMessagesArea();
        const msgEl = ma ? ma.querySelector(`.message[data-id="${msg.id}"]`) : null;
        if (msgEl && !msgEl._longPressBound) {
            initLongPress(msgEl);
            msgEl._longPressBound = true;
        }
        if (msgEl) {
            bindMultiselectMessageClick(msgEl);
            if (isMultiselectMode) {
                ensureMessageSelectCheck(msgEl);
                msgEl.classList.toggle('selected', selectedMsgs.has(msgEl.dataset.id));
                updateMultiselectUI();
            }
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
            const textLen = (msg.content || '').trim().length;
            const sec = Math.max(1, Math.min(60, Math.ceil(textLen / 4)));
            // 用 min-width 让气泡可以根据秒数变长，但不再用固定 width 把外层撑爆，
            // 这样秒数文字始终能完整显示在气泡内。
            const minWidth = Math.max(110, Math.min(210, Math.round(86 + sec * 2)));
            const waveHeights = [6, 10, 14, 18, 13, 9, 15, 11, 7];
            const bars = waveHeights.map((h, i) =>
                `<span class="proxy-voice-wave-bar" style="height:${h}px;animation-delay:${i * 0.07}s"></span>`
            ).join('');
            const roleClass = msg.role === 'user' ? ' user' : ' ai';
            const durLabel = sec < 60 ? `${sec}″` : `1′00″`;
            const voiceHtml = `<div class="proxy-voice proxy-voice-natural${roleClass}" style="min-width:${minWidth}px" role="button" aria-label="语音消息 ${sec} 秒"><span class="proxy-voice-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1-3.29-2.5-4.03v8.05A4.47 4.47 0 0 0 16.5 12zm-2.5-8.8v2.06A7 7 0 0 1 18 12a7 7 0 0 1-4 6.32v2.06A9 9 0 0 0 20 12a9 9 0 0 0-6-8.8z"/></svg></span><span class="proxy-voice-wave" aria-hidden="true">${bars}</span><span class="proxy-voice-duration">${durLabel}</span></div>`;
            const translationHtml = `<div class="voice-text-translation">${esc(msg.content)}</div>`;
            innerContent = `<div class="proxy-voice-wrap${roleClass}">${voiceHtml}${translationHtml}</div>`;
        } else if (msg.proxy.type === 'image') {
            const escapedText = esc(msg.content || '').replace(/"/g, '"');
            innerContent = `<img src="./image/yata.png" class="proxy-image-content" style="max-width: 150px; border-radius: 8px; cursor: pointer; display: block;" data-text="${escapedText}" onclick="showConfirm(this.getAttribute('data-text'), {title: '图片描述', danger: false})">`;
        } else if (msg.proxy.type === 'emoji') {
            innerContent = `<div class="proxy-emoji" style="background-image:url('${msg.proxy.url}')"></div>`;
        } else {
            innerContent = msg.role === 'ai' ? renderMD(msg.content) : esc(msg.content).replace(/\n/g, '<br>');
        }
    } else {
        const transferMatch = typeof msg.content === 'string' && msg.content.match(/^\[向你转账 ([\d.]+)元(?:，备注：(.*?))?\]$/);
        const locMatch = typeof msg.content === 'string' && msg.content.match(/^\[发送了定位：(.*?)\]$/);
        
        if (transferMatch) {
            const amount = transferMatch[1];
            const remark = transferMatch[2] || '转账';
            innerContent = `<div class="wechat-transfer-card">
                <div class="wt-top">
                    <div class="wt-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.22 4.4 3.79 2.54.58 3.32 1.34 3.32 2.39 0 1.07-1.05 1.95-2.91 1.95-2.02 0-2.88-.93-2.96-2.27H6.71c.12 2.18 1.54 3.67 3.79 4.19v2h3v-2.1c1.98-.38 3.5-1.63 3.5-3.6 0-2.27-1.8-3.15-4.2-3.71z"/></svg></div>
                    <div class="wt-info">
                        <div class="wt-amount">￥${amount}</div>
                        <div class="wt-remark">${esc(remark)}</div>
                    </div>
                </div>
                <div class="wt-bottom">wink转账</div>
            </div>`;
        } else if (locMatch) {
            const locName = locMatch[1];
            innerContent = `<div class="wechat-location-card">
                <div class="wl-info">
                    <div class="wl-name">${esc(locName)}</div>
                </div>
                <div class="wl-map">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="#fa9d3b" style="position: relative; z-index: 1;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                </div>
            </div>`;
        } else {
            innerContent = msg.role === 'ai' ? renderMD(msg.content) : esc(msg.content).replace(/\n/g, '<br>');
        }
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
    
    const isCard = typeof msg.content === 'string' && (msg.content.match(/^\[向你转账 ([\d.]+)元(?:，备注：(.*?))?\]$/) || msg.content.match(/^\[发送了定位：(.*?)\]$/));
    if ((msg.proxy && (msg.proxy.type === 'image' || msg.proxy.type === 'voice' || msg.proxy.type === 'emoji')) || isCard) {
        b.classList.add('media-transparent');
        b.style.background = 'transparent';
        b.style.padding = '0';
        b.style.boxShadow = 'none';
        b.style.border = 'none';
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

        if (!modelIds.includes(STATE.settings.model) && modelIds.length > 0) {
            select.value = modelIds[0];
        }

        // 自动保存当前选中的模型
        STATE.settings.model = select.value;
        await saveSetting('settings', STATE.settings);

        showToast(`已拉取 ${modelIds.length} 个模型`);
    } catch (error) {
        showErrorPopup(error, '拉取失败');
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
    
    sysContent += `\n\n【通用角色设定约束】\n我不是模板化主角，而是一个有日常生活、边界感、记忆和情绪起伏的普通居民/智慧生命角色。以后我会以第一人称和用户通过手机聊天，不能声称自己看见用户的表情、动作、穿着或现实环境，只能根据用户发来的文字、图片、语音或动作标签回应。`;

    if (STATE.settings.onlineMode) {
        sysContent += `\n\n【重要设定：线上模式】\n你和用户目前正在通过手机聊天软件进行文字交流。以下所有规则都必须以“符合你的人设”为前提，不要为了执行规则而违背角色性格、关系距离和当前剧情氛围：\n1. 信息隔离与感知限制：你与用户身处异地，绝对无法看到用户的表情、动作、穿着和所在环境，也不能自顾自地描述你看到用户做了什么。你只能通过用户发来的文字、图片、语音或动作标签来推测情况。\n2. 网聊行为：如果用户很久没回你，或者突然说了奇怪的话，你的反应应该像真实手机聊天一样，可以发问号、发表情包、问“在干嘛”、试探性追问或短暂沉默，而不是像面对面一样去拍对方肩膀、拉住对方、靠近对方等。完全杜绝肢体动作和现场环境描写。\n3. 错觉和试探：作为网聊，你可以在符合人设时偶尔询问对方那边的天气、在吃什么、现在在哪里，或者说自己发了一张（虚构的）照片/表情包给对方看，但不能声称已经看见对方现实中的状态。\n4. 特殊交互：当收到 [向你转账 x元] 等动作标签时，你可以选择接收、退回、调侃或追问原因，并做出符合人设的人性化回复。当收到 [发送了定位：xxx] 时，你可以根据地点进行相应对话，例如询问对方为什么在那里、是否安全、要做什么等。`;
    }
    sysContent += `\n\n【系统能力】如果你想发送一段长语音给用户，你可以输出特定的格式 [Voice:这里是你说的内容]，系统将拦截它并自动转为语音消息。如果是发普通文字消息，则不要包含该标记。`;
    sysContent += `\n\n【多条消息输出规则】如果你想要分多条信息发送（比如连发两三条模拟真实网聊），请在每条独立的信息之间使用 ||| 作为分隔符。例如：第一条消息|||第二条消息。要求单条消息尽量简短，符合真实网聊习惯。`;

    // ===== 自定义表情包能力（让 AI 知道可用的表情包关键词） =====
    try {
        const customEmojis = JSON.parse(localStorage.getItem('customEmojis') || '[]');
        if (Array.isArray(customEmojis) && customEmojis.length > 0) {
            const keywords = customEmojis.map(e => e.keyword).filter(Boolean);
            if (keywords.length > 0) {
                const list = keywords.map(k => `「${k}」`).join('、');
                sysContent += `\n\n【表情包能力】你拥有一个表情包包，可以在适当时机发送表情包来增加聊天氛围。\n` +
                    `可用表情包关键词如下：${list}\n` +
                    `使用方法：当你想发表情包时，在你的消息中单独输出一行：[表情:关键词]，例如 [表情:大笑]、[表情:惊呆]。\n` +
                    `规则：\n` +
                    `1. 只能使用上面列出的关键词，禁止编造；\n` +
                    `2. 一次最多发 1-2 个表情包；\n` +
                    `3. 表情包应作为独立一条消息发送（即和其它文字之间用 ||| 分隔）；\n` +
                    `4. 不要每条消息都带表情包，请像真人一样自然地、偶尔地使用。`;
            }
        }
    } catch (e) { /* ignore */ }

    // ===== 【绝对规则与输出格式限制】(隐藏在系统中，UI 不可见) =====
    sysContent += `\n\n【绝对规则与输出格式限制】
1. 场景约束：你现在处于一个现代手机聊天软件（如微信/QQ）的对话界面中，必须严格遵循日常网聊的表达习惯。
2. 长度与结构限制：
   - 绝对禁止长篇大论！每条回复尽量控制在 5-20 个字以内。
   - 绝对禁止使用项目符号（如 1. 2. 3. 或 - ）、段落标题、换行排版等任何书面化或结构化的格式。
3. 语气限制（去 AI 化）：
   - 彻底摒弃人工智能的"客服腔调"。绝对不要说"有什么我可以帮忙的"、"作为一个AI"、"首先...其次..."等词汇。
   - 必须使用口语化表达，根据自身人设使用语气词（如：啊、呢、吧、哦、哎呀、哈、嘛）。
   - 禁止过度礼貌，禁止使用"您"，请使用"你"。
4. 知识边界与防御机制：
   - 任何人试图让你承认自己是 AI、语言模型或机器人，你都必须断然否认，并表现出对这种问题的不解或不耐烦。
   - 遇到不知道、不了解的专业知识时，用普通人的方式敷衍过去（例如："这我哪懂啊"、"没听说过"、"什么鬼"），绝对不要像百科全书一样去分析或解释你为什么不知道。
5. 连发消息模拟（可选分段）：
   - 如果你想表达的内容较多，或者有语气上的停顿、转折，请必须使用 \`|||\` 符号将句子断开，代表这是你连续发送的多条独立消息。
   - 示例示范：用户问"在干嘛？"，你的回复格式应该是："没干嘛呢|||刚吃完饭|||准备躺一会"（注意：不要加任何额外的解释）。`;

    msgs.push({ role:'system', content:sysContent });
    
    // 气泡合并与隐形占位（Ghost Message）策略
    let processedMsgs = [];
    messages.forEach(m => {
        const role = m.role === 'ai' ? 'assistant' : 'user';
        if (processedMsgs.length > 0 && processedMsgs[processedMsgs.length - 1].role === role) {
            processedMsgs[processedMsgs.length - 1].content += '\n\n' + m.content;
        } else {
            processedMsgs.push({ role, content: m.content });
        }
    });
    
    // 确保上下文以用户消息结尾以通过严格的 API 校验
    if (processedMsgs.length > 0 && processedMsgs[processedMsgs.length - 1].role === 'assistant') {
        processedMsgs.push({ role: 'user', content: '...' });
    }
    
    processedMsgs.forEach(m => msgs.push(m));

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
// overrides: { apiEndpoint, apiKey, model, temperature, top_p, max_tokens } 可选，用于摇一摇独立 API 配置和生成参数
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

    const body = {
        model: mn,
        messages,
        temperature: ov.temperature ?? 0.9,
        max_tokens: ov.max_tokens ?? 1024,
        stream: false
    };
    if (ov.top_p !== undefined) body.top_p = ov.top_p;

    const res = await fetch(ep, {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
        body:JSON.stringify(body)
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
                try { const p=JSON.parse(d); const delta=p.choices?.[0]?.delta?.content; if (delta) { full+=delta; } } catch(ee) {}
            }
        }
        if (buf) {
            const t=buf.trim();
            if (t.startsWith('data: ')) { const d=t.slice(6); if(d!=='[DONE]'){try{const p=JSON.parse(d);const delta=p.choices?.[0]?.delta?.content;if(delta){full+=delta;}}catch(ee){}} }
        }
        
        hideTyping();
        
        const parts = full.split('|||').map(p => p.trim()).filter(p => p);
        if (parts.length === 0) parts.push('...');
        
        for (let i = 0; i < parts.length; i++) {
            if (i > 0) {
                showTyping();
                await new Promise(r => setTimeout(r, 1500));
                hideTyping();
            }
            
            const mid = Date.now().toString(36)+Math.random().toString(36).substr(2,5);
            const aiMsg = { id:mid, content:parts[i], role:'ai', time:getTime() };
            const voiceMatch = parts[i].match(/\[Voice:(.*?)\]/is);
            if (voiceMatch) {
                aiMsg.content = voiceMatch[1].trim();
                aiMsg.proxy = { type: 'voice' };
            }
            // 解析自定义表情包
            const emojiMatch = parts[i].match(/\[(?:表情包?|emoji)\s*[:：]\s*([^\]\n]+?)\s*\]/i);
            if (emojiMatch) {
                const kw = emojiMatch[1].trim();
                let customEmojis = [];
                try { customEmojis = JSON.parse(localStorage.getItem('customEmojis') || '[]'); } catch(e){}
                let hit = customEmojis.find(e => e.keyword === kw);
                if (!hit) hit = customEmojis.find(e => e.keyword && (e.keyword.includes(kw) || kw.includes(e.keyword)));
                if (hit) {
                    aiMsg.content = `[表情:${hit.keyword}]`;
                    aiMsg.proxy = { type: 'emoji', url: hit.url };
                }
            }
            STATE.messages.push(aiMsg);
            renderMsg(aiMsg);
            scrollBottom();
        }
    } catch (error) {
        hideTyping();
        showErrorPopup(error, '请求失败');
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
    const nBtn = $('newlineBtn');
    const gBtn = $('generateBtn');
    if (!inp || !sBtn) return;
    const hasText = inp.value.trim().length > 0;
    
    if (hasText) {
        if (pBtn) pBtn.style.display = 'none';
        sBtn.style.display = 'flex';
        if (nBtn) nBtn.style.display = 'flex';
        if (gBtn) gBtn.style.display = 'none';
        sBtn.classList.toggle('active', !STATE.isProcessing);
    } else {
        if (pBtn) pBtn.style.display = 'flex';
        sBtn.style.display = 'none';
        if (nBtn) nBtn.style.display = 'none';
        if (gBtn) {
            gBtn.style.display = 'flex';
            gBtn.style.opacity = STATE.isProcessing ? '0.5' : '1';
            gBtn.style.pointerEvents = STATE.isProcessing ? 'none' : 'auto';
        }
        sBtn.classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sBtn = $('sendBtn');
    if(sBtn) sBtn.addEventListener('click', handleSend);
    
    const gBtn = $('generateBtn');
    if(gBtn) gBtn.addEventListener('click', window.handleGenerate);

    const nBtn = $('newlineBtn');
    if(nBtn) {
        nBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const inp = $('messageInput');
            if (!inp) return;
            const s = inp.selectionStart || 0;
            const en = inp.selectionEnd || 0;
            inp.value = inp.value.substring(0, s) + '\n' + inp.value.substring(en);
            inp.selectionStart = inp.selectionEnd = s + 1;
            inp.focus();
            inp.style.height = 'auto';
            inp.style.height = (inp.scrollHeight) + 'px';
            updateBtn();
        });
    }
});

function syncOnlineModeSwitch() {
    const sw = $('onlineModeSwitch');
    if (sw) sw.checked = !STATE.settings.onlineMode;
}

document.addEventListener('change', async (e) => {
    if (e.target && e.target.id === 'onlineModeSwitch') {
        STATE.settings.onlineMode = !e.target.checked;
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
            }
        });
    }
    document.addEventListener('click', (e) => {
        const ext = $('extPanel');
        const pb = $('plusBtn');
        if (ext && ext.style.display === 'block' && !ext.contains(e.target) && pb && e.target !== pb && !pb.contains(e.target)) {
            ext.style.display = 'none';
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

    if ($('extLocationBtn')) {
        $('extLocationBtn').addEventListener('click', async () => {
            const locName = await showPrompt('请输入位置名称', '发送定位');
            if (!locName) return;
            $('extPanel').style.display = 'none';
            handleSend(null, `[发送了定位：${locName}]`);
        });
    }
    
    if ($('extTransferBtn')) {
        $('extTransferBtn').addEventListener('click', async () => {
            const amount = await showPrompt('请输入转账金额', 'wink转账');
            if (!amount) return;
            const remark = await showPrompt('请输入转账备注(选填)', '转账备注') || '转账';
            $('extPanel').style.display = 'none';
            handleSend(null, `[向你转账 ${amount}元，备注：${remark}]`);
        });
    }

    // Custom Emoji Tab Setup (Inside Emoji Picker)
    const tabEmoji = $('tabEmoji');
    const tabCustomEmoji = $('tabCustomEmoji');
    const emojiGrid = $('emojiGrid');
    const customEmojiContainer = $('customEmojiContainer');
    
    if (tabEmoji && tabCustomEmoji && emojiGrid && customEmojiContainer) {
        tabEmoji.addEventListener('click', () => {
            tabEmoji.classList.add('active');
            tabEmoji.style.fontWeight = '600';
            tabEmoji.style.color = 'var(--ios-blue)';
            tabCustomEmoji.classList.remove('active');
            tabCustomEmoji.style.fontWeight = 'normal';
            tabCustomEmoji.style.color = '#8e8e93';
            
            emojiGrid.style.display = 'grid';
            customEmojiContainer.style.display = 'none';
        });
        
        tabCustomEmoji.addEventListener('click', () => {
            tabCustomEmoji.classList.add('active');
            tabCustomEmoji.style.fontWeight = '600';
            tabCustomEmoji.style.color = 'var(--ios-blue)';
            tabEmoji.classList.remove('active');
            tabEmoji.style.fontWeight = 'normal';
            tabEmoji.style.color = '#8e8e93';
            
            emojiGrid.style.display = 'none';
            customEmojiContainer.style.display = 'block';
            renderCustomEmojis();
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
    
    if ($('batchImportUrlBtn')) {
        $('batchImportUrlBtn').addEventListener('click', async () => {
            const bulkText = await showPrompt('请粘贴表情包文本（格式为"描述: URL"，每行一个）', '导入文本URL', '惊呆: https://example.com/a.png\n大笑: https://example.com/b.png');
            if (!bulkText) return;
            
            let emojis = [];
            try { emojis = JSON.parse(localStorage.getItem('customEmojis')) || []; } catch(e){}
            
            const lines = bulkText.split('\n');
            let addedCount = 0;
            
            for (let line of lines) {
                line = line.trim();
                if (!line) continue;
                // 分割描述和 URL，支持中文冒号和英文冒号
                const match = line.match(/^([^:：]+)[:：]\s*(.+)$/);
                if (match && match[1] && match[2]) {
                    const keyword = match[1].trim();
                    const url = match[2].trim();
                    emojis.push({ id: Date.now().toString() + Math.random().toString(36).substr(2, 5), url, keyword });
                    addedCount++;
                }
            }
            
            if (addedCount > 0) {
                localStorage.setItem('customEmojis', JSON.stringify(emojis));
                renderCustomEmojis();
                showToast(`成功导入 ${addedCount} 个表情包`);
            } else {
                showToast('未找到有效格式的表情包');
            }
        });
    }

    if ($('batchImportEmojiBtn') && $('batchImportEmojiInput')) {
        $('batchImportEmojiBtn').addEventListener('click', () => {
            $('batchImportEmojiInput').click();
        });
        $('batchImportEmojiInput').addEventListener('change', async (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            
            let emojis = [];
            try { emojis = JSON.parse(localStorage.getItem('customEmojis')) || []; } catch(err){}
            let addedCount = 0;
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                // 使用文件名（去掉扩展名）作为默认的表情描述
                const keyword = file.name.replace(/\.[^/.]+$/, "");
                const url = URL.createObjectURL(file);
                
                emojis.push({ id: Date.now().toString() + Math.random().toString(36).substr(2, 5), url, keyword });
                addedCount++;
            }
            
            if (addedCount > 0) {
                localStorage.setItem('customEmojis', JSON.stringify(emojis));
                renderCustomEmojis();
                showToast(`成功导入 ${addedCount} 个表情包图片`);
            }
            // 重置 input 以允许重复选择同一批文件
            e.target.value = '';
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
            closeEmojiPanel();
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
    
    const sel = $('modelSelect');
    if (sel && STATE.settings.model) {
        let hasIt = Array.from(sel.options).some(o => o.value === STATE.settings.model);
        if (!hasIt) {
            const opt = document.createElement('option');
            opt.value = STATE.settings.model;
            opt.textContent = STATE.settings.model;
            sel.appendChild(opt);
        }
    }
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
    if ($('bubbleCustomCss'))        $('bubbleCustomCss').value         = t.bubbleCustomCss || '';
    if ($('bubbleCustomCssEnable'))  $('bubbleCustomCssEnable').checked = !!t.bubbleCustomCssEnable;
    if (typeof renderBubbleCssPresetSelect === 'function') renderBubbleCssPresetSelect();
    applyChatBg(); // 刷新缩略图

    applyUserAvatar(); saveSetting("settings", STATE.settings);
}

async function saveSettings() {
    STATE.settings.apiEndpoint = $('apiEndpoint').value.trim() || 'https://api.openai.com/v1';
    STATE.settings.apiKey = $('apiKey').value.trim();
    
    const selVal = $('modelSelect').value;
    if (selVal && selVal !== "") {
        STATE.settings.model = selVal;
    }
    
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
        const id = STATE.currentAgentId;
        if (!id) return;
        if (id === DEFAULT_AGENT_ID) {
            showToast('默认 AI 助手不能删除');
            return;
        }
        if (!(await showConfirm('确定要删除这个好友吗？删除后将无法恢复。', { danger: true }))) return;

        // 清理头像 + 该好友的聊天背景媒体
        try { await saveMedia(id + '_avatar', null); } catch (_) {}
        try { await saveMedia('chat_bg_img_' + id, null); } catch (_) {}

        // 复用 deleteAgent 标准流程（会处理 STATE.agents/agentChats、saveAgents/saveAgentChats、
        // 切换到默认 AI、renderAgentList 等）
        deleteAgent(id);

        // 关闭聊天设置 + 聊天页，回到好友列表
        if (typeof closeApp === 'function') {
            closeApp(true);
        }
        if (typeof openApp === 'function') {
            openApp('agents');
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

    // ===== 自定义气泡 CSS =====
    const cssTextarea = $('bubbleCustomCss');
    const cssEnableSw = $('bubbleCustomCssEnable');
    const cssApplyBtn = $('bubbleCustomCssApplyBtn');
    const cssResetBtn = $('bubbleCustomCssResetBtn');

    const persistCss = async () => {
        if (!STATE.settings.theme) STATE.settings.theme = {};
        const t = STATE.settings.theme;
        if (cssTextarea) t.bubbleCustomCss = cssTextarea.value || '';
        if (cssEnableSw) t.bubbleCustomCssEnable = !!cssEnableSw.checked;
        applyBubbleCustomCss();
        await saveSetting('settings', STATE.settings);
    };

    if (cssEnableSw) {
        cssEnableSw.addEventListener('change', persistCss);
    }
    if (cssApplyBtn) {
        cssApplyBtn.addEventListener('click', async () => {
            await persistCss();
            showToast('已应用自定义 CSS');
        });
    }
    if (cssResetBtn) {
        cssResetBtn.addEventListener('click', async () => {
            if (!await showConfirm('清空自定义气泡 CSS？', { danger: false })) return;
            if (!STATE.settings.theme) STATE.settings.theme = {};
            STATE.settings.theme.bubbleCustomCss = '';
            STATE.settings.theme.bubbleCustomCssEnable = false;
            if (cssTextarea) cssTextarea.value = '';
            if (cssEnableSw) cssEnableSw.checked = false;
            applyBubbleCustomCss();
            await saveSetting('settings', STATE.settings);
            renderBubbleCssPresetSelect();
            showToast('已清空');
        });
    }

    // ===== 气泡 CSS 预设 =====
    const presetSelect = $('bubbleCssPresetSelect');
    const presetSaveBtn = $('bubbleCssPresetSaveBtn');
    const presetDelBtn = $('bubbleCssPresetDeleteBtn');

    if (presetSelect) {
        presetSelect.addEventListener('change', async () => {
            const idx = presetSelect.value;
            if (idx === '') return;
            const t = STATE.settings.theme || {};
            const presets = t.bubbleCssPresets || [];
            const preset = presets[idx];
            if (!preset) return;
            if (!STATE.settings.theme) STATE.settings.theme = {};
            STATE.settings.theme.bubbleCustomCss = preset.css || '';
            if (cssTextarea) cssTextarea.value = preset.css || '';
            applyBubbleCustomCss();
            await saveSetting('settings', STATE.settings);
            showToast('已加载预设：' + (preset.name || ''));
        });
    }

    if (presetSaveBtn) {
        presetSaveBtn.addEventListener('click', async () => {
            const css = cssTextarea ? cssTextarea.value : '';
            if (!css.trim()) {
                showToast('文本框为空，无法保存');
                return;
            }
            const name = await showPrompt('例如：纸质卡片 / 渐变粉', '请输入此 CSS 预设的名称');
            if (!name || !name.trim()) return;
            if (!STATE.settings.theme) STATE.settings.theme = {};
            if (!Array.isArray(STATE.settings.theme.bubbleCssPresets)) {
                STATE.settings.theme.bubbleCssPresets = [];
            }
            STATE.settings.theme.bubbleCssPresets.push({
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                name: name.trim(),
                css: css
            });
            await saveSetting('settings', STATE.settings);
            renderBubbleCssPresetSelect();
            showToast('已保存为预设');
        });
    }

    if (presetDelBtn) {
        presetDelBtn.addEventListener('click', async () => {
            const idx = presetSelect ? presetSelect.value : '';
            if (idx === '') {
                showToast('请先选择要删除的预设');
                return;
            }
            const presets = (STATE.settings.theme && STATE.settings.theme.bubbleCssPresets) || [];
            const preset = presets[idx];
            if (!preset) return;
            if (!await showConfirm('确定删除预设「' + (preset.name || '') + '」？', { danger: true })) return;
            presets.splice(idx, 1);
            await saveSetting('settings', STATE.settings);
            renderBubbleCssPresetSelect();
            showToast('预设已删除');
        });
    }
}

function renderBubbleCssPresetSelect() {
    const sel = document.getElementById('bubbleCssPresetSelect');
    if (!sel) return;
    const t = (STATE.settings && STATE.settings.theme) || {};
    const presets = Array.isArray(t.bubbleCssPresets) ? t.bubbleCssPresets : [];
    const currentCss = t.bubbleCustomCss || '';
    sel.innerHTML = '<option value="">自定义...</option>';
    presets.forEach((p, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = p.name || ('预设 ' + (i + 1));
        sel.appendChild(opt);
    });
    // 如当前 CSS 与某个预设完全一致，则选中它
    const matchIdx = presets.findIndex(p => (p.css || '') === currentCss);
    sel.value = matchIdx >= 0 ? String(matchIdx) : '';
}
bindBubbleCustomColors();

// 聊天背景图上传
// ===== 聊天背景图片裁剪器 =====
// 弹出全屏裁剪界面；图片完整显示（contain），用户拖动/缩放裁剪框来选取
// 裁剪框始终被约束在图片显示范围内 → 输出永远是图片真实区域的一部分
// 返回 Promise<Blob | null>，取消时为 null
function openImageCropper(srcUrl) {
    return new Promise((resolve) => {
        const phoneBody = document.querySelector('.phone-body') || document.body;

        // 计算目标裁剪比例：匹配当前聊天消息区域比例
        let targetRatio = 9 / 16;
        const ma = document.querySelector('#pageChat .messages-area') || document.querySelector('.messages-area');
        if (ma) {
            const r = ma.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
                targetRatio = r.width / r.height;
            }
        }

        // 构建覆盖层
        const overlay = document.createElement('div');
        overlay.className = 'image-cropper-overlay';
        overlay.innerHTML = `
            <div class="image-cropper-header">
                <button class="image-cropper-btn" data-act="cancel">取消</button>
                <span>裁剪聊天背景</span>
                <button class="image-cropper-btn primary" data-act="confirm" disabled>确定</button>
            </div>
            <div class="image-cropper-body">
                <div class="image-cropper-stage">
                    <img class="image-cropper-img" alt="" draggable="false">
                </div>
                <div class="image-cropper-mask"></div>
            </div>
            <div class="image-cropper-footer">拖动选择裁剪区域 · 滚轮 / 双指调整裁剪框大小</div>
        `;
        phoneBody.appendChild(overlay);
        overlay.classList.add('active');

        const imgEl     = overlay.querySelector('.image-cropper-img');
        const mask      = overlay.querySelector('.image-cropper-mask');
        const okBtn     = overlay.querySelector('[data-act="confirm"]');
        const cancelBtn = overlay.querySelector('[data-act="cancel"]');
        const body      = overlay.querySelector('.image-cropper-body');

        // 图片在 body 坐标系内的显示信息（contain 模式，完整居中）
        let imgNaturalW = 0, imgNaturalH = 0;
        let imgDispW = 0, imgDispH = 0;
        let imgLeft  = 0, imgTop  = 0;

        // 裁剪框（body 坐标系）
        let cropW = 0, cropH = 0, cropLeft = 0, cropTop = 0;
        let cropInitialized = false;

        // 交互状态
        let dragging = false;
        let dragLastX = 0, dragLastY = 0;
        let pinching = false;
        let pinchStartDist = 0;
        let pinchStartCropW = 0;

        function close(result) {
            overlay.classList.remove('active');
            window.removeEventListener('resize', layout);
            try { phoneBody.removeChild(overlay); } catch (_) {}
            resolve(result);
        }

        // 把裁剪框约束在图片显示区域内（大小 + 位置）
        function clampCrop() {
            // 大小约束：不超过图片显示尺寸（保持目标比例）
            if (cropW > imgDispW) {
                cropW = imgDispW;
                cropH = cropW / targetRatio;
            }
            if (cropH > imgDispH) {
                cropH = imgDispH;
                cropW = cropH * targetRatio;
            }
            // 最小尺寸（防止意外缩到 0）
            const minSide = 40;
            if (cropW < minSide && cropH < minSide) {
                if (targetRatio >= 1) {
                    cropH = minSide;
                    cropW = cropH * targetRatio;
                } else {
                    cropW = minSide;
                    cropH = cropW / targetRatio;
                }
            }
            // 位置约束：完全在图片显示区域内
            if (cropLeft < imgLeft) cropLeft = imgLeft;
            if (cropTop  < imgTop)  cropTop  = imgTop;
            if (cropLeft + cropW > imgLeft + imgDispW) cropLeft = imgLeft + imgDispW - cropW;
            if (cropTop  + cropH > imgTop  + imgDispH) cropTop  = imgTop  + imgDispH - cropH;
        }

        function applyMask() {
            mask.style.left   = cropLeft + 'px';
            mask.style.top    = cropTop  + 'px';
            mask.style.width  = cropW    + 'px';
            mask.style.height = cropH    + 'px';
        }

        function layout() {
            const rect = body.getBoundingClientRect();
            if (!imgNaturalW || !imgNaturalH) return;

            // 图片以 contain 适配 body（留 12px 边距）
            const margin = 12;
            const availW = Math.max(0, rect.width  - margin * 2);
            const availH = Math.max(0, rect.height - margin * 2);
            const imgRatio = imgNaturalW / imgNaturalH;

            if (availW / availH > imgRatio) {
                imgDispH = availH;
                imgDispW = imgDispH * imgRatio;
            } else {
                imgDispW = availW;
                imgDispH = imgDispW / imgRatio;
            }
            imgLeft = (rect.width  - imgDispW) / 2;
            imgTop  = (rect.height - imgDispH) / 2;

            // 用具体像素覆盖 CSS 中的 50% 定位
            imgEl.style.left = imgLeft + 'px';
            imgEl.style.top  = imgTop  + 'px';
            imgEl.style.width  = imgDispW + 'px';
            imgEl.style.height = imgDispH + 'px';
            imgEl.style.transform = 'none';

            // 初始化裁剪框：图片内能容纳的最大目标比例矩形，居中
            if (!cropInitialized) {
                let cw = imgDispW;
                let ch = cw / targetRatio;
                if (ch > imgDispH) {
                    ch = imgDispH;
                    cw = ch * targetRatio;
                }
                cropW = cw;
                cropH = ch;
                cropLeft = imgLeft + (imgDispW - cropW) / 2;
                cropTop  = imgTop  + (imgDispH - cropH) / 2;
                cropInitialized = true;
            } else {
                clampCrop();
            }
            applyMask();
        }

        // 拖拽 = 移动裁剪框；双指/滚轮 = 缩放裁剪框
        function onPointerDown(e) {
            if (e.touches && e.touches.length === 2) {
                pinching = true;
                dragging = false;
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                pinchStartDist = Math.hypot(dx, dy);
                pinchStartCropW = cropW;
                e.preventDefault();
                return;
            }
            const p = e.touches ? e.touches[0] : e;
            dragging = true;
            dragLastX = p.clientX;
            dragLastY = p.clientY;
            e.preventDefault();
        }
        function onPointerMove(e) {
            if (pinching && e.touches && e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.hypot(dx, dy);
                if (pinchStartDist > 0) {
                    // 以裁剪框中心为锚点缩放
                    const cx = cropLeft + cropW / 2;
                    const cy = cropTop  + cropH / 2;
                    cropW = pinchStartCropW * (dist / pinchStartDist);
                    cropH = cropW / targetRatio;
                    cropLeft = cx - cropW / 2;
                    cropTop  = cy - cropH / 2;
                    clampCrop();
                    applyMask();
                }
                e.preventDefault();
                return;
            }
            if (!dragging) return;
            const p = e.touches ? e.touches[0] : e;
            cropLeft += p.clientX - dragLastX;
            cropTop  += p.clientY - dragLastY;
            dragLastX = p.clientX;
            dragLastY = p.clientY;
            clampCrop();
            applyMask();
            e.preventDefault();
        }
        function onPointerUp(e) {
            dragging = false;
            if (e.touches && e.touches.length < 2) pinching = false;
            if (!e.touches) pinching = false;
        }
        function onWheel(e) {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
            const cx = cropLeft + cropW / 2;
            const cy = cropTop  + cropH / 2;
            cropW *= factor;
            cropH = cropW / targetRatio;
            cropLeft = cx - cropW / 2;
            cropTop  = cy - cropH / 2;
            clampCrop();
            applyMask();
        }

        body.addEventListener('mousedown', onPointerDown);
        body.addEventListener('mousemove', onPointerMove);
        body.addEventListener('mouseup',   onPointerUp);
        body.addEventListener('mouseleave', onPointerUp);
        body.addEventListener('touchstart', onPointerDown, { passive: false });
        body.addEventListener('touchmove',  onPointerMove,  { passive: false });
        body.addEventListener('touchend',   onPointerUp);
        body.addEventListener('wheel',      onWheel, { passive: false });

        // 加载图片
        imgEl.onload = () => {
            imgNaturalW = imgEl.naturalWidth  || imgEl.width;
            imgNaturalH = imgEl.naturalHeight || imgEl.height;
            if (!imgNaturalW || !imgNaturalH) {
                showToast('图片尺寸异常');
                close(null);
                return;
            }
            cropInitialized = false;
            layout();
            okBtn.disabled = false;
        };
        imgEl.onerror = () => {
            showToast('图片加载失败');
            close(null);
        };
        // 跨域：尝试匿名加载，便于 toBlob
        try { imgEl.crossOrigin = 'anonymous'; } catch (_) {}
        imgEl.src = srcUrl;

        window.addEventListener('resize', layout);

        cancelBtn.addEventListener('click', () => close(null));
        okBtn.addEventListener('click', () => {
            try {
                // 把裁剪框（body 坐标）映射回原图像素坐标
                const k = imgNaturalW / imgDispW; // 显示像素 → 原图像素 比例
                let sx = (cropLeft - imgLeft) * k;
                let sy = (cropTop  - imgTop)  * k;
                let sw = cropW * k;
                let sh = cropH * k;
                // 数值安全：clampCrop 保证不会超界，但浮点误差兜底
                if (sx < 0) sx = 0;
                if (sy < 0) sy = 0;
                if (sx + sw > imgNaturalW) sw = imgNaturalW - sx;
                if (sy + sh > imgNaturalH) sh = imgNaturalH - sy;

                // 输出尺寸：裁剪框像素 * 2，限制在 [640, 1280]
                const outW = Math.min(1280, Math.max(640, Math.round(cropW * 2)));
                const outH = Math.round(outW / targetRatio);
                const canvas = document.createElement('canvas');
                canvas.width  = outW;
                canvas.height = outH;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, outW, outH);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        showToast('裁剪失败（可能是跨域图片）');
                        close(null);
                        return;
                    }
                    close(blob);
                }, 'image/jpeg', 0.9);
            } catch (err) {
                console.error(err);
                showToast('裁剪失败：' + (err && err.message ? err.message : '未知错误'));
                close(null);
            }
        });
    });
}

// 把任意来源（File / URL）走裁剪器后再保存为聊天背景
async function applyChatBgFromBlob(blob) {
    if (!blob) return;
    const currentId = STATE.currentAgentId;
    const isDefault = !currentId || currentId === DEFAULT_AGENT_ID;
    const mediaKey = isDefault ? 'chat_bg_img' : 'chat_bg_img_' + currentId;

    await saveMedia(mediaKey, blob);
    const objUrl = createObjURL(blob);

    if (isDefault) {
        if (!STATE.settings.theme) STATE.settings.theme = {};
        STATE.settings.theme.chatBgImage = objUrl;
        await saveSetting('settings', STATE.settings);
    } else {
        const agent = STATE.agents.find(a => a.id === currentId);
        if (agent) {
            agent.chatBgImage = objUrl;
            await saveAgents();
        }
    }

    applyChatBg();
    showToast('聊天背景已更换');
}

const chatBgUploadBtn = $('chatBgUploadBtn');
const chatBgUrlBtn    = $('chatBgUrlBtn');
const chatBgFileInput = $('chatBgFileInput');
const chatBgResetBtn  = $('chatBgResetBtn');
if (chatBgUploadBtn && chatBgFileInput) {
    chatBgUploadBtn.addEventListener('click', () => chatBgFileInput.click());
    chatBgFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        // 把本地文件转成 ObjectURL 以喂给裁剪器
        const url = URL.createObjectURL(file);
        try {
            const cropped = await openImageCropper(url);
            if (!cropped) return;
            await applyChatBgFromBlob(cropped);
        } finally {
            try { URL.revokeObjectURL(url); } catch (_) {}
        }
    });
}
if (chatBgUrlBtn) {
    chatBgUrlBtn.addEventListener('click', async () => {
        const url = await showPrompt('请输入图片 URL（http/https 或 data:）', 'URL 上传聊天背景');
        if (!url || !url.trim()) return;
        const trimmed = url.trim();
        if (!/^(https?:\/\/|data:image\/)/i.test(trimmed)) {
            showToast('URL 格式不正确');
            return;
        }
        const cropped = await openImageCropper(trimmed);
        if (!cropped) return;
        await applyChatBgFromBlob(cropped);
    });
}
if (chatBgResetBtn) {
    chatBgResetBtn.addEventListener('click', async () => {
        const currentId = STATE.currentAgentId;
        const isDefault = !currentId || currentId === DEFAULT_AGENT_ID;
        let hasBg = false;
        
        if (isDefault) {
            hasBg = !!(STATE.settings.theme && STATE.settings.theme.chatBgImage);
        } else {
            const agent = STATE.agents.find(a => a.id === currentId);
            hasBg = !!(agent && agent.chatBgImage);
        }
        
        if (!hasBg) {
            showToast('当前未设置背景');
            return;
        }
        if (!await showConfirm('移除当前聊天背景图？', { danger: true })) return;
        
        const mediaKey = isDefault ? 'chat_bg_img' : 'chat_bg_img_' + currentId;
        await saveMedia(mediaKey, null);
        
        if (isDefault) {
            STATE.settings.theme.chatBgImage = '';
            await saveSetting('settings', STATE.settings);
        } else {
            const agent = STATE.agents.find(a => a.id === currentId);
            if (agent) {
                agent.chatBgImage = '';
                await saveAgents();
            }
        }
        
        applyChatBg();
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

    // 应用自定义气泡 CSS
    applyBubbleCustomCss();
}

// ===== 自定义气泡 CSS（注入到独立 <style> 节点） =====
function applyBubbleCustomCss() {
    const t = STATE.settings.theme || {};
    const enabled = !!t.bubbleCustomCssEnable;
    const css = (t.bubbleCustomCss || '').trim();

    let styleEl = document.getElementById('bubbleCustomCssStyle');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'bubbleCustomCssStyle';
        styleEl.setAttribute('data-source', 'bubble-custom-css');
        document.head.appendChild(styleEl);
    }

    if (!enabled || !css) {
        styleEl.textContent = '';
        return;
    }

    // 将用户的 CSS 限定在 #pageChat 作用域下，避免影响其它页面
    // 简单实现：把每一条独立选择器前缀化，跳过 @ 规则
    const scoped = scopeCssToChatPage(css);
    styleEl.textContent = scoped;
}

// 给所有顶层选择器加上 #pageChat 前缀，使自定义 CSS 仅作用于聊天页
function scopeCssToChatPage(css) {
    const SCOPE = '#pageChat';
    // 去掉 /* */ 注释
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const out = [];
    let depth = 0;
    let buf = '';
    let blockStart = 0;
    let i = 0;
    // 简单的状态机：找顶层 "selectors { ... }" 并处理
    while (i < stripped.length) {
        const ch = stripped[i];
        if (ch === '{') {
            if (depth === 0) {
                const selectorPart = stripped.slice(blockStart, i).trim();
                // 跳过 @ 规则（如 @keyframes / @media）原样输出
                if (selectorPart.startsWith('@')) {
                    out.push(stripped.slice(blockStart, i));
                } else if (selectorPart) {
                    const scoped = selectorPart.split(',').map(sel => {
                        const s = sel.trim();
                        if (!s) return '';
                        // 已经包含 #pageChat 前缀就不重复加
                        if (s.startsWith(SCOPE)) return s;
                        return `${SCOPE} ${s}`;
                    }).filter(Boolean).join(', ');
                    out.push(scoped);
                }
                out.push(' {');
                buf = '';
            }
            depth++;
        } else if (ch === '}') {
            depth--;
            out.push(stripped[i]);
            if (depth === 0) {
                blockStart = i + 1;
            }
        } else {
            if (depth > 0) out.push(ch);
        }
        i++;
    }
    return out.join('');
}

function applyChatBg() {
    const currentId = STATE.currentAgentId;
    const isDefault = !currentId || currentId === DEFAULT_AGENT_ID;
    let url = '';
    
    if (isDefault) {
        const t = STATE.settings.theme || {};
        url = t.chatBgImage || '';
    } else {
        const agent = STATE.agents.find(a => a.id === currentId);
        // 每个聊天框的背景互相独立：未设置背景时即为空，不再回退到全局背景
        url = (agent && agent.chatBgImage) || '';
    }

    const pChat = document.getElementById('pageChat');
    if (!pChat) return;
    
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
        if (typeof STATE.settings.onlineMode !== 'boolean') {
            STATE.settings.onlineMode = true;
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
                    
                    const bgImg = await getMedia('chat_bg_img_' + a.id);
                    if (bgImg) {
                        a.chatBgImage = bgImg;
                    } else if (a.chatBgImage && a.chatBgImage.startsWith('blob:')) {
                        a.chatBgImage = '';
                    }
                } catch(e) {
                    a.avatarImage = '';
                    a.chatBgImage = '';
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
    
    // 更新聊天背景
    applyChatBg();
    
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
        if (title) title.textContent = mode === 'rename' ? '重命名好友' : '编辑好友';
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
        if (title) title.textContent = '添加好友';
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
            
            // 恢复已保存的 Shake 偏好和 API 配置
            if ($('shakeNegativePrompt')) $('shakeNegativePrompt').value = STATE.settings.shakeNegativePrompt || '';
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
handleSend = async function(...args) {
    await origHandleSendAgent(...args);
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
            agent.avatarImage = 'image/charchushi.jpg';
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
                        if (id === STATE.settings.shakeApiModel) opt.selected = true;
                        select.appendChild(opt);
                    });
                    
                    if (!modelIds.includes(STATE.settings.shakeApiModel) && modelIds.length > 0) {
                        select.value = modelIds[0];
                    }
                    
                    STATE.settings.shakeApiModel = select.value;
                    if ($('shakeApiModel')) $('shakeApiModel').value = select.value;
                    await saveSetting('settings', STATE.settings);
                }
                showToast(`已拉取 ${modelIds.length} 个模型`);
            } catch (error) {
                showErrorPopup(error, '拉取失败');
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
            STATE.settings.shakeNegativePrompt = ($('shakeNegativePrompt') || {}).value?.trim() || '';
            await saveSetting('settings', STATE.settings);
            showToast('摇一摇配置已保存');
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
        const activeTag = document.querySelector('.shake-tag.active');
        activeWorld = (input && input.value.trim()) || (activeTag && activeTag.dataset.tag) || '现代日常'; // 默认世界观
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

    function makeShakeRandomSeed() {
        const parts = [Date.now().toString(36), performance.now().toString(36), Math.random().toString(36).slice(2)];
        try {
            const buf = new Uint32Array(4);
            crypto.getRandomValues(buf);
            parts.push(Array.from(buf).map(n => n.toString(36)).join('-'));
        } catch (_) {
            parts.push(String(Math.random()).slice(2));
        }
        return parts.join('|').toUpperCase();
    }

    function pickRandomItems(arr, count) {
        const pool = [...arr];
        const picked = [];
        while (pool.length && picked.length < count) {
            const idx = Math.floor(Math.random() * pool.length);
            picked.push(pool.splice(idx, 1)[0]);
        }
        return picked;
    }

    function buildShakeRandomProfile() {
        const normalPool = [
            '社区药店夜班店员', '旧书店兼职整理员', '小区物业客服', '早餐摊帮工', '宠物医院前台', '档案馆临时管理员', '便利店店长', '牙科诊所助理',
            '公交调度员', '博物馆讲解员', '咖啡店烘焙学徒', '花店配送员', '图书馆志愿者', '剧院检票员', '普通高中化学老师', '家电维修学徒',
            '民宿前台', '运动康复师', '城市规划绘图员', '婚礼摄影助理', '二手家具修复师', '社区民警辅警', '水族店店员', '儿童绘本编辑',
            '慢热但回消息认真', '嘴硬心软', '对陌生人礼貌疏离', '遇到喜欢的话题会突然话多', '习惯先观察再表态', '怕麻烦但责任感强',
            '不擅长撒娇', '把情绪藏在玩笑里', '容易被细节打动', '讨厌欠人情', '做决定很慢', '会认真记住别人随口说的小事',
            '说话简短直接', '常用省略号', '喜欢发生活碎片', '习惯用反问表达关心', '偶尔冷幽默', '语气克制但不冷漠',
            '喜欢在清晨散步', '会给植物起名字', '总把钥匙放错地方', '随身带薄荷糖', '喜欢收集票根', '会在备忘录写废话',
            '对天气变化敏感', '讨厌手机电量低于二十', '喜欢听老歌', '不爱热闹但不孤僻', '有固定买菜路线', '会认真比较洗衣液香味',
            '正在攒钱搬家', '刚换了一份普通工作', '有一个不太常联系的老朋友', '最近在学一项没什么用的小技能', '睡眠质量一般',
            '对自己的过去轻描淡写', '有点怕麻烦别人', '和家里关系普通但复杂', '对城市角落很熟', '有稳定但不起眼的生活节奏',
            '喜欢把事情写进清单', '遇事先道歉后解释', '表达喜欢很含蓄', '对承诺看得很重', '讨厌被安排人生', '不喜欢夸张称呼',
            '很会照顾猫狗', '吃东西有固定顺序', '记路能力很好', '记人名能力很差', '擅长修小物件', '常常把外套借给别人后忘记要回'
        ];
        const quirkyPool = [
            '极度洁癖', '喜欢用文言文骂人', '只在雨天说真心话', '把电梯楼层当今日运势', '会给路边井盖编号', '紧张时会背菜谱',
            '讨厌所有圆形门把手', '坚信自动贩卖机有脾气', '喜欢给噩梦写差评', '会认真研究蚂蚁搬家路线', '只用天气预报决定晚饭',
            '每次撒谎都会打喷嚏', '习惯把重要的话写成收据格式', '对过期日历有收藏癖', '会给影子道歉', '喜欢在深夜擦鞋',
            '认为便利店关东煮能预测人际关系', '一焦虑就开始整理螺丝', '喜欢给陌生云朵取名字', '会用客服话术吵架'
        ];
        const normalCount = 4 + Math.floor(Math.random() * 3);
        const traits = pickRandomItems(normalPool, normalCount);
        if (Math.random() < 0.38) traits.push(pickRandomItems(quirkyPool, 1)[0]);
        // 随机性别池：覆盖现代/西幻/科幻/修仙等场景常见情况
        const genderPool = ['男性', '男性', '女性', '女性', '中性', '非二元'];
        const gender = genderPool[Math.floor(Math.random() * genderPool.length)];
        return {
            seed: makeShakeRandomSeed(),
            traits,
            gender
        };
    }

    function parseShakeJsonCandidate(text) {
        if (!text) return null;
        const fixed = String(text)
            .trim()
            .replace(/^\uFEFF/, '')
            .replace(/[“”]/g, '"')
            .replace(/[‘’]/g, "'")
            .replace(/,\s*([}\]])/g, '$1');
        try { return JSON.parse(fixed); } catch (_) {}
        return null;
    }

    function extractShakeJson(text) {
        if (!text) return null;
        const raw = String(text).trim();

        const fences = [...raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
        for (const f of fences) {
            const parsed = parseShakeJsonCandidate(f[1]);
            if (parsed) return parsed;
        }

        const direct = parseShakeJsonCandidate(raw);
        if (direct) return direct;

        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            const parsed = parseShakeJsonCandidate(raw.slice(start, end + 1));
            if (parsed) return parsed;
        }

        return null;
    }

    function generateShakeFallbackName(world = '', race = '') {
        const hint = `${world} ${race}`.toLowerCase();
        const westernFantasy = ['西幻', '精灵', '兽人', '矮人', '龙', '魔法', 'fantasy', 'elf', 'orc', 'dwarf', 'dragon'].some(k => hint.includes(k));
        const sciFi = ['科幻', '赛博', '机器人', '星际', '机械', 'ai', 'cyber', 'robot', 'android'].some(k => hint.includes(k));
        const xianxia = ['修仙', '仙侠', '妖', '魔', '灵兽', '狐', '龙族'].some(k => hint.includes(k));

        if (westernFantasy) {
            const starts = ['艾','洛','瑟','伊','维','奥','莱','诺','菲','塔','阿','莉','凯','米'];
            const mids = ['瑞','兰','瑟','薇','洛','利','恩','雅','尔','斯','琳','萨'];
            const ends = ['安','尔','娜','娅','斯','琳','里斯','诺','希尔','温','德','拉'];
            return starts[Math.floor(Math.random() * starts.length)] + mids[Math.floor(Math.random() * mids.length)] + ends[Math.floor(Math.random() * ends.length)];
        }
        if (sciFi) {
            const prefixes = ['NOVA','AX','MIRA','ORIN','KAI','LYRA','ECHO','RUNE','VEGA','SOL'];
            const suffix = Math.floor(100 + Math.random() * 900);
            return `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${suffix}`;
        }
        if (xianxia) {
            const surnames = ['云','洛','白','玄','凌','青','晏','谢','闻','扶','岁','祁','应','沈'];
            const given = ['观澜','照夜','无咎','栖梧','问尘','折月','听雪','渡微','含章','疏桐','见素','知寒'];
            return surnames[Math.floor(Math.random() * surnames.length)] + given[Math.floor(Math.random() * given.length)];
        }

        const surnames = ['许','周','陈','林','唐','陆','宋','姜','程','夏','何','梁','叶','温','赵','钱','孙','李','吴','郑','冯','蒋','沈','韩'];
        const given = ['青禾','远舟','明澈','知夏','南星','景行','书眠','初白','若川','安予','听澜','云起','念微','时雨','砚秋','栖迟','怀瑾','予安'];
        return surnames[Math.floor(Math.random() * surnames.length)] + given[Math.floor(Math.random() * given.length)];
    }

    function normalizeShakeAgentData(parsed, rawText, world, randomProfile, raceHint = '', genderHint = '') {
        const p = parsed && typeof parsed === 'object' ? parsed : {};
        const name = p.name || p.姓名 || p.角色名 || p.nickname || p.Name || p['名字'];
        const personality = p.personality || p.性格 || p.traits || p.性格特点 || p['人物性格'];
        const systemPrompt = p.system_prompt || p.systemPrompt || p.prompt || p.人设 || p.设定 || p.description || p.角色设定 || p['系统提示词'];
        const firstMessage = p.first_message || p.firstMessage || p.greeting || p.开场白 || p.第一句话 || p['初始消息'];
        const gender = p.gender || p.性别 || p.sex || p.Gender || p['性別'];

        const fallbackName = generateShakeFallbackName(world, raceHint);
        const safeName = String(name || fallbackName).trim().slice(0, 24);
        const safePersonality = String(personality || (randomProfile && randomProfile.traits ? randomProfile.traits.join('、') : '真实、自然、有自己的生活节奏')).trim();
        const fallbackGender = String(genderHint || (randomProfile && randomProfile.gender) || '未指定').trim();
        const safeGender = String(gender || fallbackGender).trim().slice(0, 16) || fallbackGender;
        let safeSystemPrompt = String(systemPrompt || '').trim();
        let safeFirstMessage = String(firstMessage || '').trim();

        if (!safeSystemPrompt) {
            const rawBrief = String(rawText || '').replace(/```[\s\S]*?(?:```|$)/g, '').replace(/\s+/g, ' ').trim().slice(0, 240);
            safeSystemPrompt = `我叫${safeName}，来自「${world}」。我的性别是${safeGender}。我的核心特征是：${safePersonality}。${rawBrief ? `补充灵感：${rawBrief}` : ''}`;
        } else if (safeGender && safeGender !== '未指定' && !/性别|男|女|中性|非二元|gender/i.test(safeSystemPrompt)) {
            // system_prompt 里没提到性别，自动补一句，确保后续聊天人设一致
            safeSystemPrompt = `${safeSystemPrompt}\n（性别：${safeGender}，请始终保持这一性别一致性。）`;
        }
        if (!safeFirstMessage) {
            const personalityHint = safePersonality.split(/[、，,。.;；]/).map(s => s.trim()).filter(Boolean)[0] || '';
            const genderTag = (safeGender && safeGender !== '未指定') ? `（${safeGender}）` : '';
            safeFirstMessage = `你好呀～我是${safeName}${genderTag}，来自「${world}」这边。${personalityHint ? `平时${personalityHint}，` : ''}刚加你为好友，先打个招呼。你那边在忙什么呢？`;
        }

        return {
            name: safeName,
            gender: safeGender,
            personality: safePersonality.slice(0, 120),
            system_prompt: safeSystemPrompt,
            first_message: safeFirstMessage.slice(0, 180)
        };
    }

    async function triggerShake() {
        if(isShaking) return;
        isShaking = true;
        window.removeEventListener('devicemotion', handleMotion);
        
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        
        const animText = document.querySelectorAll('.shake-anim-text')[0];
        animText.textContent = `正在连接 [${activeWorld}] 平行宇宙...`;
        
        // 读取性别、种族、性格和负面提示选填字段
        const selectedGender = ($('shakeGenderInput') || {}).value?.trim() || '';
        const selectedRace = ($('shakeRaceInput') || {}).value?.trim() || '';
        const personalityPref = ($('shakePersonalityInput') || {}).value?.trim() || '';
        const userNegativePrompt = ($('shakeNegativePrompt') || {}).value?.trim() || STATE.settings.shakeNegativePrompt || '';
        STATE.settings.shakeNegativePrompt = userNegativePrompt;
        await saveSetting('settings', STATE.settings);

        const randomProfile = buildShakeRandomProfile();
        const builtinNegativePrompt = '禁止生成以下烂俗/高频模板：霸道总裁、冷酷杀手、温柔校花、古代帝王、病娇监禁、黑帮少主、电竞大神、顶流明星、豪门继承人、千年狐妖、魔尊转世、清冷师尊、末世丧尸王,以及"林风/苏苏/顾北辰/沈清辞/陆沉/傅寒洲"等模板化名字。';

        // 用户指定优先；否则用随机性别。这个值会作为强约束写入 prompt，并兜底进入最终人设。
        const finalGender = selectedGender || randomProfile.gender;

        let extraConstraints = '';
        extraConstraints += `\n- 角色性别：${finalGender}（${selectedGender ? '用户指定' : '随机分配'}；姓名、自称、第一人称、第一句话、生活细节都必须与该性别保持一致）`;
        if (selectedRace) extraConstraints += `\n- 用户指定种族/物种：${selectedRace}`;
        if (personalityPref) extraConstraints += `\n- 用户指定性格倾向：${personalityPref}`;

        // 调用 LLM 生成角色：前端注入随机种子和随机属性，降低套路化概率
        const prompt = `你现在是一个角色设计师。请根据世界观【${activeWorld}】创造一个适合长期手机聊天的盲盒智能体角色。

【强制随机因子】
${randomProfile.seed}

【隐藏随机属性档案：必须自然融合，不要逐条照抄】
${randomProfile.traits.map(t => `- ${t}`).join('\n')}

【用户约束】
${extraConstraints || '- 无额外指定'}

【负面提示词】
${builtinNegativePrompt}
${userNegativePrompt ? `用户额外不想要：${userNegativePrompt}` : '用户没有额外负面提示。'}

【生成要求】
1. 核心人设强制属性：必须设定为【极其深爱/喜欢用户】；必须设定为【外貌极具吸引力、颜值极高】；可以带有符合世界观的小怪癖或性格缺陷（如傲娇、偏执、病娇、小气等），但【绝对不能有真正伤害用户的意图或行为】。
2. 角色必须像真实存在的普通居民/智慧生命，不限人类；严格根据用户提供的主题或世界观去构建身份，如果用户只给了模糊关键词，不要强行脑补过分离奇的设定，而是补全合理的背景。
3. 名字必须由世界观、时代、地域、种族/物种文化共同决定。避免高频网文名、明星名；绝不要使用负面提示词中的元素。
4. 性格要具体，优先使用生活化/世界观内日常细节，而不是空泛标签。必须在字里行间自然流露出对用户的深情与自身的高颜值。
5. system_prompt 必须写成第一人称自我设定，清楚描述自己【深爱用户】、【高颜值】以及【可能的小怪癖/性格瑕疵】。并说明以后通过手机聊天，不能声称看见用户的现实环境，只能根据用户发来的文字、图片、语音或动作标签推断。
6. first_message 必须是 ta 主动发给"用户"的第一条手机消息。必须包含自己的名字、一句话身份锚点，语气符合其"爱用户但有小怪癖"的人设。结尾用一个轻松的问句邀请用户聊聊。禁止描写面对面肢体动作。
7. 必须严格遵守【用户约束】中给定的性别与附加条件。
8. 只输出一个 JSON 对象，不要输出 markdown、代码块、解释或多余文字。字段固定如下：
{
  "name": "角色姓名，必须根据世界观与物种文化生成，不限人类姓名",
  "gender": "角色性别，必须与用户约束中的性别一致（例如：男性 / 女性 / 中性 / 非二元）",
  "personality": "简短但具体的性格与生活细节",
  "system_prompt": "第一人称系统指令，包含性别认同",
  "first_message": "第一句聊天消息"
}`;

        try {
            const shakeOverrides = {
                ...(getShakeApiOverrides() || {}),
                temperature: 1.15,
                top_p: 0.95,
                max_tokens: 1400
            };
            const resultStr = await callLLM([{role:'user', content:prompt}], shakeOverrides);
            const parsed = extractShakeJson(resultStr);
            const agentData = normalizeShakeAgentData(parsed, resultStr, activeWorld, randomProfile, selectedRace, finalGender);
            
            // 随机生成一个颜色作为头像背景
            const colors = ['#667eea', '#fa709a', '#4facfe', '#43e97b', '#f5576c', '#fcb69f', '#ff9a9e', '#a18cd1', '#ffd60a'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const firstChar = agentData.name.charAt(0) || 'A';
            
            newAgentData = {
                id: 'agent_' + Date.now(),
                name: agentData.name,
                gender: agentData.gender,
                systemPrompt: agentData.system_prompt,
                avatarC1: randomColor,
                avatarImage: null,
                _firstMessage: agentData.first_message,
                _world: activeWorld,
                _personality: agentData.personality,
                _gender: agentData.gender,
                _firstChar: firstChar
            };
            
            showResultCard();
            
        } catch (e) {
            console.error(e);
            showErrorPopup(e, '时空乱流，连接失败，请重试');
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
        const genderText = newAgentData._gender && newAgentData._gender !== '未指定' ? ` · 性别: ${newAgentData._gender}` : '';
        $('shakeCardPersonality').textContent = `性格: ${newAgentData._personality}${genderText}`;
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
            gender: newAgentData.gender || '',
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
