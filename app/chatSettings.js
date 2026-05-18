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
                        <div style="width:36px"></div>
                    </div>
                    <div class="settings-scroll">
                        <!-- 聊天主题 -->
                        <div class="settings-section">
                            <div class="settings-section-title">聊天主题</div>
                            <div class="settings-group-box">
                                <div class="theme-preset-grid">
                                    <div class="theme-preset-item tp-default active" data-preset="default">
                                        <div class="theme-preset-preview">
                                            <div class="tp-bubble-ai"></div>
                                            <div class="tp-bubble-user"></div>
                                            <div class="tp-bubble-ai-2"></div>
                                        </div>
                                        <div class="theme-preset-name">默认</div>
                                    </div>
                                    <div class="theme-preset-item tp-dark" data-preset="dark">
                                        <div class="theme-preset-preview">
                                            <div class="tp-bubble-ai"></div>
                                            <div class="tp-bubble-user"></div>
                                            <div class="tp-bubble-ai-2"></div>
                                        </div>
                                        <div class="theme-preset-name">暗夜</div>
                                    </div>
                                    <div class="theme-preset-item tp-sakura" data-preset="sakura">
                                        <div class="theme-preset-preview">
                                            <div class="tp-bubble-ai"></div>
                                            <div class="tp-bubble-user"></div>
                                            <div class="tp-bubble-ai-2"></div>
                                        </div>
                                        <div class="theme-preset-name">粉樱</div>
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

                        <button class="settings-save-btn" id="saveSettingsBtn">保存设置</button>
                        <button class="settings-danger-btn" id="clearChatBtn">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
                            清空聊天记录
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