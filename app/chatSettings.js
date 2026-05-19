window.AppRegistry = window.AppRegistry || [];
window.AppRegistry.push({
    id: 'pageChatSettings',
    html: `
<!-- ===== 聊天设置页面（原设置内容） ===== -->
                <div class="page page-chat-settings page-app" id="pageChatSettings">
                    <div class="page-header">
                        <button class="header-back-btn" id="backChatSettings">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#007aff"/>
                            </svg>
                        </button>
                        <div class="header-center"><div class="header-name">聊天设置</div></div>
                        <button class="header-btn" id="saveSettingsBtn" style="color: #007aff; font-size: 16px; font-weight: 500; background: none; border: none; padding: 0 16px; height: 100%; display: flex; align-items: center; cursor: pointer;">保存</button>
                    </div>
                    <div class="settings-scroll">

                        <!-- 气泡风格与颜色 -->
                        <div class="settings-section">
                            <div class="settings-section-title">气泡美化</div>
                            <div class="settings-group-box">
                                <!-- 风格预设 -->
                                <div class="bubble-style-grid" style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid var(--border-color);">
                                    <div class="bubble-style-item bs-classic active" data-bubble-style="classic">
                                        <div class="bubble-style-preview"><div class="bs-ai"></div><div class="bs-user"></div></div>
                                        <div class="bubble-style-name">经典</div>
                                    </div>
                                    <div class="bubble-style-item bs-gradient" data-bubble-style="gradient">
                                        <div class="bubble-style-preview"><div class="bs-ai"></div><div class="bs-user"></div></div>
                                        <div class="bubble-style-name">渐变</div>
                                    </div>
                                    <div class="bubble-style-item bs-glass" data-bubble-style="glass">
                                        <div class="bubble-style-preview"><div class="bs-ai"></div><div class="bs-user"></div></div>
                                        <div class="bubble-style-name">毛玻璃</div>
                                    </div>
                                    <div class="bubble-style-item bs-minimal" data-bubble-style="minimal">
                                        <div class="bubble-style-preview"><div class="bs-ai"></div><div class="bs-user"></div></div>
                                        <div class="bubble-style-name">极简</div>
                                    </div>
                                    <div class="bubble-style-item bs-candy" data-bubble-style="candy">
                                        <div class="bubble-style-preview"><div class="bs-ai"></div><div class="bs-user"></div></div>
                                        <div class="bubble-style-name">糖果</div>
                                    </div>
                                </div>
                                <!-- 自定义颜色 -->
                                <div class="bubble-color-row">
                                    <span class="bubble-color-label">我的气泡 - 背景</span>
                                    <div class="bubble-color-controls">
                                        <input type="color" class="bubble-color-pick" id="bubbleUserBgPick" value="#0a84ff">
                                    </div>
                                </div>
                                <div class="bubble-color-row">
                                    <span class="bubble-color-label">我的气泡 - 文字</span>
                                    <div class="bubble-color-controls">
                                        <input type="color" class="bubble-color-pick" id="bubbleUserTextPick" value="#ffffff">
                                    </div>
                                </div>
                                <div class="bubble-color-row">
                                    <span class="bubble-color-label">AI 气泡 - 背景</span>
                                    <div class="bubble-color-controls">
                                        <input type="color" class="bubble-color-pick" id="bubbleAiBgPick" value="#ffffff">
                                    </div>
                                </div>
                                <div class="bubble-color-row">
                                    <span class="bubble-color-label">AI 气泡 - 文字</span>
                                    <div class="bubble-color-controls">
                                        <input type="color" class="bubble-color-pick" id="bubbleAiTextPick" value="#1a1a1a">
                                    </div>
                                </div>
                                <div class="bubble-color-row">
                                    <span class="bubble-color-label" style="font-size:13px;color:#8e8e93;">勾选启用自定义颜色</span>
                                    <div class="bubble-color-controls">
                                        <label class="ios-switch">
                                            <input type="checkbox" id="bubbleCustomEnable">
                                            <span class="slider"></span>
                                        </label>
                                        <button class="bubble-reset-btn" id="bubbleColorResetBtn">重置</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 自定义气泡 CSS -->
                        <div class="settings-section">
                            <div class="settings-section-title">自定义气泡 CSS</div>
                            <div class="settings-group-box">
                                <div class="settings-row">
                                    <label class="settings-row-label">气泡 CSS 预设</label>
                                    <div style="display:flex; width: 100%; gap:8px;">
                                        <select class="settings-row-select" id="bubbleCssPresetSelect" style="flex:1">
                                            <option value="">自定义...</option>
                                        </select>
                                        <button class="settings-btn-small" id="bubbleCssPresetSaveBtn">保存当前</button>
                                        <button class="settings-btn-small danger" id="bubbleCssPresetDeleteBtn">删除</button>
                                    </div>
                                    <div style="font-size:12px;color:#8e8e93;margin-top:6px;line-height:1.4;">
                                        选择预设会立即填充并应用到下方文本框。
                                    </div>
                                </div>
                                <div class="settings-row">
                                    <label class="settings-row-label" style="display:flex;align-items:center;justify-content:space-between;">
                                        <span>专门美化对话气泡的 CSS</span>
                                        <label class="ios-switch" style="transform:scale(0.78);transform-origin:right center;">
                                            <input type="checkbox" id="bubbleCustomCssEnable">
                                            <span class="slider"></span>
                                        </label>
                                    </label>
                                    <textarea class="settings-row-textarea" id="bubbleCustomCss" rows="6" spellcheck="false" placeholder="/* 仅作用于聊天气泡，例如： */
.message-bubble.user { border-radius: 18px 18px 4px 18px !important; }
.message-bubble.ai   { border-radius: 18px 18px 18px 4px !important; }
.message-bubble.user { background: linear-gradient(135deg,#ff9a9e,#fad0c4) !important; }
"></textarea>
                                    <div style="display:flex;gap:8px;margin-top:8px;">
                                        <button class="settings-btn-small" id="bubbleCustomCssApplyBtn">应用</button>
                                        <button class="settings-btn-small danger" id="bubbleCustomCssResetBtn">清空</button>
                                    </div>
                                    <div style="font-size:12px;color:#8e8e93;margin-top:6px;line-height:1.4;">
                                        样式只会注入到当前页面（手机内），关闭开关或清空可立即恢复。
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 聊天背景图片 -->
                        <div class="settings-section">
                            <div class="settings-section-title">聊天背景图片</div>
                            <div class="settings-group-box">
                                <div class="chat-bg-preview-row">
                                    <div class="chat-bg-thumb" id="chatBgThumb">
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                                    </div>
                                    <div class="chat-bg-actions">
                                        <button class="chat-bg-btn" id="chatBgUploadBtn">上传图片</button>
                                        <button class="chat-bg-btn secondary" id="chatBgUrlBtn">URL 上传</button>
                                        <button class="chat-bg-btn danger" id="chatBgResetBtn">移除</button>
                                        <input type="file" id="chatBgFileInput" accept="image/*" style="display:none">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- AI 头像设置 -->
                        <div class="settings-section">
                            <div class="settings-section-title">AI 头像</div>
                            <div class="settings-group-box avatar-settings">
                                <div class="avatar-preview-row">
                                    <div class="avatar-preview" id="avatarPreview">
                                        <svg viewBox="0 0 40 40" width="56" height="56">
                                            <circle cx="20" cy="20" r="20" fill="#667eea"/>
                                        </svg>
                                    </div>
                                    <button class="upload-avatar-btn" id="uploadAvatarBtn">更换头像</button>
                                    <input type="file" id="avatarFileInput" accept="image/*" style="display:none">
                                </div>
                                <div class="avatar-colors">
                                    <div class="av-color active" style="--c1:#667eea" data-c1="#667eea"></div>
                                    <div class="av-color" style="--c1:#fa709a" data-c1="#fa709a"></div>
                                    <div class="av-color" style="--c1:#4facfe" data-c1="#4facfe"></div>
                                    <div class="av-color" style="--c1:#43e97b" data-c1="#43e97b"></div>
                                    <div class="av-color" style="--c1:#f5576c" data-c1="#f5576c"></div>
                                    <div class="av-color" style="--c1:#fcb69f" data-c1="#fcb69f"></div>
                                    <div class="av-color" style="--c1:#66a6ff" data-c1="#66a6ff"></div>
                                    <div class="av-color" style="--c1:#ff9a9e" data-c1="#ff9a9e"></div>
                                    <div class="av-color" style="--c1:#a18cd1" data-c1="#a18cd1"></div>
                                    <div class="av-color" style="--c1:#ffd60a" data-c1="#ffd60a"></div>
                                    <input type="color" class="av-color-custom" id="avColorCustom" value="#667eea" title="自定义颜色">
                                </div>
                            </div>
                        </div>

                        <!-- 我的头像设置 -->
                        <div class="settings-section">
                            <div class="settings-section-title">我的头像</div>
                            <div class="settings-group-box avatar-settings">
                                <div class="avatar-preview-row">
                                    <div class="avatar-preview" id="userAvatarPreview">
                                        <svg viewBox="0 0 40 40" width="56" height="56">
                                            <circle cx="20" cy="20" r="20" fill="#007aff"/>
                                        </svg>
                                    </div>
                                    <button class="upload-avatar-btn" id="uploadUserAvatarBtn">更换头像</button>
                                    <input type="file" id="userAvatarFileInput" accept="image/*" style="display:none">
                                </div>
                                <div class="avatar-colors">
                                    <div class="uav-color active" style="--c1:#007aff" data-c1="#007aff"></div>
                                    <div class="uav-color" style="--c1:#ff3b30" data-c1="#ff3b30"></div>
                                    <div class="uav-color" style="--c1:#34c759" data-c1="#34c759"></div>
                                    <div class="uav-color" style="--c1:#ff9500" data-c1="#ff9500"></div>
                                    <div class="uav-color" style="--c1:#af52de" data-c1="#af52de"></div>
                                    <div class="uav-color" style="--c1:#ff2d55" data-c1="#ff2d55"></div>
                                    <div class="uav-color" style="--c1:#00c7be" data-c1="#00c7be"></div>
                                    <div class="uav-color" style="--c1:#ff6482" data-c1="#ff6482"></div>
                                    <div class="uav-color" style="--c1:#a2845e" data-c1="#a2845e"></div>
                                    <div class="uav-color" style="--c1:#636366" data-c1="#636366"></div>
                                    <input type="color" class="uav-color-custom" id="uavColorCustom" value="#007aff" title="自定义颜色">
                                </div>
                            </div>
                        </div>

                        <!-- 你的人设 -->
                        <div class="settings-section">
                            <div class="settings-section-title">你的人设</div>
                            <div class="settings-group-box">
                                <div class="settings-row">
                                    <textarea class="settings-row-textarea" id="systemPrompt" rows="3" placeholder="设置 AI 助手的身份和行为..."></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- 我的人设 -->
                        <div class="settings-section">
                            <div class="settings-section-title">我的人设</div>
                            <div class="settings-group-box">
                                <div class="settings-row">
                                    <textarea class="settings-row-textarea" id="userPrompt" rows="3" placeholder="设置你的身份和背景信息，AI 将据此了解你..."></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- API 配置 -->
                        <div class="settings-section">
                            <div class="settings-section-title">API 配置</div>
                            <div class="settings-group-box">
                                <div class="settings-row">
                                    <label class="settings-row-label">使用配置</label>
                                    <div style="display:flex; width: 100%; gap:8px;">
                                        <select class="settings-row-select" id="apiPresetSelect" style="flex:1">
                                            <option value="">自定义...</option>
                                        </select>
                                        <button class="settings-btn-small" id="apiSaveBtn">保存当前</button>
                                        <button class="settings-btn-small danger" id="apiDelBtn">删除</button>
                                    </div>
                                </div>
                                <div class="settings-row">
                                    <label class="settings-row-label">API 端点</label>
                                    <input type="text" class="settings-row-input" id="apiEndpoint" placeholder="https://api.openai.com/v1">
                                </div>
                                <div class="settings-row">
                                    <label class="settings-row-label">API Key</label>
                                    <div class="password-wrapper">
                                        <input type="password" class="settings-row-input" id="apiKey" placeholder="sk-...">
                                        <button class="toggle-password" id="togglePassword">
                                            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="settings-row">
                                    <label class="settings-row-label">模型</label>
                                    <div class="model-fetch-row">
                                        <select class="settings-row-select" id="modelSelect">
                                            <option value="">-- 请先拉取模型 --</option>
                                            <option value="custom">自定义模型</option>
                                        </select>
                                        <button class="fetch-model-btn" id="fetchModelsBtn">拉取模型</button>
                                    </div>
                                </div>
                                <div class="settings-row" id="customModelRow" style="display:none">
                                    <label class="settings-row-label">自定义模型名称</label>
                                    <input type="text" class="settings-row-input" id="customModel" placeholder="输入模型名称">
                                </div>
                            </div>
                        </div>

                        <!-- 对话参数 -->
                        <div class="settings-section">
                            <div class="settings-section-title">对话参数</div>
                            <div class="settings-group-box">
                                <div class="settings-row">
                                    <label class="settings-row-label">温度</label>
                                    <div class="slider-group">
                                        <input type="range" class="settings-slider" id="temperature" min="0" max="2" step="0.1">
                                        <span class="slider-val" id="tempValue">0.7</span>
                                    </div>
                                </div>
                                <div class="settings-row">
                                    <label class="settings-row-label">最大 Token</label>
                                    <div class="slider-group">
                                        <input type="range" class="settings-slider" id="maxTokens" min="256" max="8192" step="256">
                                        <span class="slider-val" id="tokensValue">2048</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button class="settings-danger-btn" id="clearChatBtn" style="margin-bottom: 12px;">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
                            清空聊天记录
                        </button>
                        <button class="settings-danger-btn" id="deleteFriendBtn">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" fill="currentColor"/></svg>
                            删除好友
                        </button>
                    </div>
                </div>
    `,
    init: function() {
        const backBtn = document.getElementById('backChatSettings');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (typeof goBackToChat === 'function') { goBackToChat(); } else if (typeof closeApp === 'function') { closeApp('pageChatSettings'); }
            });
        }
    }
});