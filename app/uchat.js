window.AppRegistry = window.AppRegistry || [];
window.AppRegistry.push({
    id: 'pageChat',
    html: `
<!-- ===== Uchat页面 ===== -->
                <div class="page page-chat page-app" id="pageChat">
                    <div class="page-header">
                        <button class="header-back-btn" id="closeChat">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#007aff"/>
                            </svg>
                        </button>
                        <div class="header-center">
                            <div class="header-avatar" id="chatHeaderAvatar">
                                <svg viewBox="0 0 40 40" width="34" height="34">
                                    <circle cx="20" cy="20" r="20" fill="#667eea"/>
                                </svg>
                                <span class="online-dot"></span>
                            </div>
                            <div class="header-info">
                                <div class="header-name">AI 智能助手</div>
                                <div class="header-status">在线</div>
                            </div>
                        </div>
                        <button class="header-btn" id="favoritesBtn" title="收藏消息" style="margin-right:2px">
                            <svg viewBox="0 0 24 24" width="21" height="21">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="none" stroke="currentColor" stroke-width="1.8"/>
                            </svg>
                        </button>
                        <button class="header-btn" id="chatSettingsBtn">
                            <svg viewBox="0 0 24 24" width="22" height="22">
                                <circle cx="12" cy="5" r="2" fill="currentColor"/>
                                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                                <circle cx="12" cy="19" r="2" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>

                    <div class="messages-area" id="messagesArea">
                        <div class="message welcome-message">
                            <div class="message-avatar">
                                <svg viewBox="0 0 40 40" width="32" height="32">
                                    <circle cx="20" cy="20" r="20" fill="#667eea"/>
                                </svg>
                            </div>
                            <div class="message-content ai">
                                <div class="message-bubble ai">👋 你好！我是 AI 智能助手，有什么可以帮你的吗？</div>
                                <span class="message-time">刚刚</span>
                            </div>
                        </div>
                        <div class="favorites-panel" id="favoritesPanel" style="display:none">
                            <div class="favorites-panel-header">
                                <span>收藏消息</span>
                                <button class="close-favorites" id="closeFavorites">
                                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
                                </button>
                            </div>
                            <div class="favorites-list" id="favoritesList">
                                <div class="favorites-empty">暂无收藏消息</div>
                            </div>
                        </div>
                    </div>

                    <div class="input-area">
                        <div class="input-wrapper">
                            <button class="input-action-btn" id="emojiBtn">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" fill="currentColor"/>
                                </svg>
                            </button>
                            <div class="input-field-wrapper">
                                <input type="text" class="input-field" id="messageInput" placeholder="输入消息..." autocomplete="off">
                            </div>
                            <button class="send-btn" id="sendBtn">
                                <svg viewBox="0 0 24 24" width="22" height="22">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="emoji-picker" id="emojiPicker">
                        <div class="emoji-picker-header">
                            <span>表情符号</span>
                            <button class="close-emoji" id="closeEmoji">
                                <svg viewBox="0 0 24 24" width="18" height="18">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                                </svg>
                            </button>
                        </div>
                        <div class="emoji-grid" id="emojiGrid"></div>
                    </div>
                    <div class="quote-preview-bar" id="quotePreviewBar" style="display:none">
                        <div class="quote-content" id="quotePreviewContent"></div>
                        <button class="close-quote" id="closeQuote">
                            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
                        </button>
                    </div>
                    <div class="bubble-context-menu" id="bubbleContextMenu">
                        <div class="ctx-menu-item" data-action="copy">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/></svg>
                            <span>复制</span>
                        </div>
                        <div class="ctx-menu-item" data-action="forward">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 4v2h16V4H4zm0 6v2h12v-2H4zm0 6v2h16v-2H4z" fill="currentColor"/></svg>
                            <span>转发</span>
                        </div>
                        <div class="ctx-menu-item" data-action="favorite">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/></svg>
                            <span>收藏</span>
                        </div>
                        <div class="ctx-menu-divider"></div>
                        <div class="ctx-menu-item" data-action="quote">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" fill="currentColor"/></svg>
                            <span>引用</span>
                        </div>
                        <div class="ctx-menu-item" data-action="edit">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>
                            <span>编辑气泡</span>
                        </div>
                        <div class="ctx-menu-divider"></div>
                        <div class="ctx-menu-item" data-action="screenshot">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/></svg>
                            <span>截图</span>
                        </div>
                        <div class="ctx-menu-item" data-action="multiselect">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg>
                            <span>多选</span>
                        </div>
                        <div class="ctx-menu-divider"></div>
                        <div class="ctx-menu-item ctx-menu-danger" data-action="recall">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" fill="currentColor"/></svg>
                            <span>撤回</span>
                        </div>
                        <div class="ctx-menu-divider"></div>
                        <div class="ctx-menu-item ctx-menu-danger" data-action="delete">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
                            <span>删除</span>
                        </div>
                    </div>

                    <div class="multiselect-bar" id="multiselectBar" style="display:none">
                        <button class="multiselect-cancel-btn" id="multiselectCancelBtn">取消</button>
                        <button class="multiselect-cancel-btn" id="multiselectSelectAllBtn" style="margin-left:8px;">全选</button>
                        <span class="multiselect-count" id="multiselectCount" style="flex:1;text-align:center;">已选择 0 条</span>
                        <div class="multiselect-actions">
                            <button class="multiselect-action-btn" id="multiselectScreenshotBtn" title="截图选中">
                                <svg viewBox="0 0 24 24" width="20" height="20"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/></svg>
                            </button>
                            <button class="multiselect-action-btn" id="multiselectDeleteBtn" title="删除选中">
                                <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
                            </button>
                            <button class="multiselect-action-btn" id="multiselectForwardBtn" title="转发选中">
                                <svg viewBox="0 0 24 24" width="20" height="20"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/></svg>
                            </button>
                        </div>
                    </div>

                    <div class="edit-bubble-overlay" id="editBubbleOverlay" style="display:none">
                        <div class="edit-bubble-dialog">
                            <div class="edit-bubble-title">编辑消息</div>
                            <textarea class="edit-bubble-textarea" id="editBubbleTextarea" rows="4" placeholder="编辑消息内容..."></textarea>
                            <div class="edit-bubble-actions">
                                <button class="edit-bubble-btn cancel" id="editBubbleCancel">取消</button>
                                <button class="edit-bubble-btn confirm" id="editBubbleConfirm">确认</button>
                            </div>
                        </div>
                    </div>

                    <div class="forward-overlay" id="forwardOverlay" style="display:none">
                        <div class="forward-dialog">
                            <div class="forward-dialog-title">确认转发</div>
                            <div class="forward-dialog-preview" id="forwardDialogPreview"></div>
                            <div class="forward-dialog-actions">
                                <button class="forward-dialog-btn cancel" id="forwardDialogCancel">取消</button>
                                <button class="forward-dialog-btn confirm" id="forwardDialogConfirm">转发</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ===== 相册页面 ===== -->
                <div class="page page-photos page-app" id="pagePhotos">
                    <div class="page-header">
                        <button class="header-back-btn" id="backPhotos">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#007aff"/>
                            </svg>
                        </button>
                        <div class="header-center"><div class="header-name">相册</div></div>
                        <div style="width:36px"></div>
                    </div>
                    <div class="settings-scroll">
                        <div class="photos-grid">
                            <div class="photo-card" style="background:linear-gradient(135deg,#ff9500,#ff6b6b)"><span class="photo-label">最近</span></div>
                            <div class="photo-card" style="background:linear-gradient(135deg,#34c759,#30d158)"><span class="photo-label">收藏</span></div>
                            <div class="photo-card" style="background:linear-gradient(135deg,#007aff,#5856d6)"><span class="photo-label">风景</span></div>
                            <div class="photo-card" style="background:linear-gradient(135deg,#ff2d55,#ff6b81)"><span class="photo-label">人物</span></div>
                            <div class="photo-card" style="background:linear-gradient(135deg,#af52de,#5e5ce6)"><span class="photo-label">美食</span></div>
                            <div class="photo-card" style="background:linear-gradient(135deg,#ffcc00,#ff9500)"><span class="photo-label">旅行</span></div>
                            <div class="photo-card" style="background:linear-gradient(135deg,#5ac8fa,#007aff)"><span class="photo-label">自拍</span></div>
                            <div class="photo-card" style="background:linear-gradient(135deg,#1c1c1e,#636366)"><span class="photo-label">截屏</span></div>
                            <div class="photo-card" style="background:linear-gradient(135deg,#ff3b30,#ff6b6b)"><span class="photo-label">视频</span></div>
                        </div>
                    </div>
                </div>
<!-- ===== 聊天列表页（微信风格——通讯录） ===== -->
                <div class="page page-app agents-page" id="pageAgents">
                    <div class="page-header">
                        <button class="header-back-btn" id="backAgents">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#007aff"/>
                            </svg>
                        </button>
                        <div class="header-center"><div class="header-name">微信</div></div>
                        <button class="header-add-btn" id="agentAddBtn">
                            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#007aff"/></svg>
                        </button>
                    </div>
                    <div class="agents-search-bar">
                        <input type="text" class="agents-search-input" id="agentsSearchInput" placeholder="搜索..." autocomplete="off">
                    </div>
                    <!-- 摇一摇抽卡入口 -->
                    <div class="shake-agent-entrance" id="shakeAgentEntrance">
                        <div class="shake-icon">🎲</div>
                        <div class="shake-text">摇一摇 / 抽卡</div>
                        <div class="shake-desc">随机生成新角色</div>
                    </div>
                    <div class="agents-list-wrap" id="agentsListWrap">
                        <div id="agentsList"></div>
                    </div>

                    <!-- 新建/编辑智能体弹窗 -->
                    <div class="agent-edit-overlay" id="agentEditOverlay" style="display:none">
                        <div class="agent-edit-dialog">
                            <div class="agent-edit-title" id="agentEditTitle">新建 AI 角色</div>
                            <div class="agent-edit-field">
                                <label class="agent-edit-label">名称</label>
                                <input type="text" class="agent-edit-input" id="agentEditName" placeholder="智能体名称" autocomplete="off">
                            </div>
                            <div class="agent-edit-field">
                                <label class="agent-edit-label">系统提示词</label>
                                <textarea class="agent-edit-textarea" id="agentEditPrompt" rows="3" placeholder="设置智能体的角色和行为..."></textarea>
                            </div>
                            <div class="agent-edit-field">
                                <label class="agent-edit-label">头像</label>
                                <div class="avatar-preview-row" style="margin-top: 8px;">
                                    <div class="avatar-preview" id="agentEditColorPreview" style="background: #667eea; display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%;">
                                    </div>
                                    <div class="avatar-preview" id="agentEditAvatarPreview" style="display: none; background-size: cover; background-position: center; width: 56px; height: 56px; border-radius: 50%;"></div>
                                    
                                    <button class="upload-avatar-btn" id="agentEditUploadBtn">上传头像</button>
                                    <input type="file" id="agentEditAvatarFile" accept="image/*" style="display:none">
                                    <button class="upload-avatar-btn" id="agentEditRemoveAvatarBtn" style="display: none; background: #ffebee; color: #ff3b30; margin-left: 8px;">移除</button>
                                </div>
                                <div class="agent-avatar-colors" id="agentAvatarColors" style="margin-top:12px;">
                                    <div class="agent-acolor active" style="--c1:#667eea" data-c1="#667eea"></div>
                                    <div class="agent-acolor" style="--c1:#fa709a" data-c1="#fa709a"></div>
                                    <div class="agent-acolor" style="--c1:#4facfe" data-c1="#4facfe"></div>
                                    <div class="agent-acolor" style="--c1:#43e97b" data-c1="#43e97b"></div>
                                    <div class="agent-acolor" style="--c1:#f5576c" data-c1="#f5576c"></div>
                                    <div class="agent-acolor" style="--c1:#fcb69f" data-c1="#fcb69f"></div>
                                    <div class="agent-acolor" style="--c1:#ff9a9e" data-c1="#ff9a9e"></div>
                                    <div class="agent-acolor" style="--c1:#a18cd1" data-c1="#a18cd1"></div>
                                    <div class="agent-acolor" style="--c1:#ffd60a" data-c1="#ffd60a"></div>
                                    <input type="color" class="agent-acolor-custom" id="agentEditColorCustom" value="#667eea" title="自定义颜色">
                                </div>
                            </div>
                            <div class="agent-edit-actions">
                                <button class="agent-edit-btn cancel" id="agentEditCancel">取消</button>
                                <button class="agent-edit-btn confirm" id="agentEditConfirm">保存</button>
                            </div>
                        </div>
                    </div>

                    <!-- 长按操作菜单 -->
                    <div class="agent-action-menu" id="agentActionMenu">
                        <div class="agent-action-item" data-action="pin" id="agentActionPin">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                            <span id="agentActionPinText">置顶聊天</span>
                        </div>
                        <div class="agent-action-item" data-action="rename">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            <span>重命名</span>
                        </div>
                        <div class="agent-action-item" data-action="edit">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                            <span>编辑提示词</span>
                        </div>
                        
                        <div class="agent-action-item" data-action="unread" id="agentActionUnread">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                            <span id="agentActionUnreadText">标为未读</span>
                        </div>
                        <div class="agent-action-item agent-action-danger" data-action="delete">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            <span>删除该聊天</span>
                        </div>
                    </div>

                    <!-- 摇一摇设定弹窗 -->
                    <div class="shake-overlay" id="shakeOverlay" style="display:none">
                        <div class="shake-dialog">
                            <div class="shake-title">摇一摇 🎲 创造新角色</div>
                            <div class="shake-desc">设定一个世界观或背景，随机抽取一位居民降临到你的通讯录！</div>
                            <div class="shake-tags" id="shakeTags">
                                <span class="shake-tag" data-tag="赛博朋克">赛博朋克</span>
                                <span class="shake-tag" data-tag="修仙界">修仙界</span>
                                <span class="shake-tag" data-tag="现代校园">现代校园</span>
                                <span class="shake-tag" data-tag="末日生存">末日生存</span>
                                <span class="shake-tag" data-tag="霸总职场">霸总职场</span>
                            </div>
                            <input type="text" class="shake-input" id="shakeWorldInput" placeholder="或输入你想要的世界观 (选填)">
                            <div class="shake-actions">
                                <button class="shake-btn cancel" id="shakeCancel">取消</button>
                                <button class="shake-btn confirm" id="shakeStart">准备摇晃 🪇</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 摇卡动画与结果弹窗 -->
                    <div class="shake-result-overlay" id="shakeResultOverlay" style="display:none">
                        <div class="shake-result-dialog">
                            <!-- 动画阶段 -->
                            <div class="shake-anim-box" id="shakeAnimBox">
                                <div class="shake-phone-icon">🪇</div>
                                <div class="shake-anim-text">请摇晃手机或点击此处...</div>
                            </div>
                            <!-- 结果阶段 -->
                            <div class="shake-card-box" id="shakeCardBox" style="display:none">
                                <div class="shake-card-avatar" id="shakeCardAvatar"></div>
                                <div class="shake-card-name" id="shakeCardName"></div>
                                <div class="shake-card-world" id="shakeCardWorld"></div>
                                <div class="shake-card-personality" id="shakeCardPersonality"></div>
                                <div class="shake-card-msg" id="shakeCardMsg"></div>
                                <div class="shake-card-actions">
                                    <button class="shake-btn cancel" id="shakeRetry">换一个</button>
                                    <button class="shake-btn confirm" id="shakeChat">去聊天</button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
    `,
    init: function() {
        const closeChatBtn = document.getElementById('closeChat');
        if (closeChatBtn) {
            closeChatBtn.addEventListener('click', () => {
                if (typeof closeApp === 'function') closeApp();
            });
        }
        
        const backAgentsBtn = document.getElementById('backAgents');
        if (backAgentsBtn) {
            backAgentsBtn.addEventListener('click', () => {
                if (typeof history !== 'undefined') history.back(); else if (typeof closeApp === 'function') closeApp();
            });
        }
    }
});