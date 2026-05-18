window.AppRegistry = window.AppRegistry || [];
window.AppRegistry.push({
    id: 'pageTheme',
    html: `
<!-- ===== 主题页面 ===== -->
                <div class="page page-theme page-app" id="pageTheme">
                    <div class="page-header">
                        <button class="header-back-btn" id="backTheme">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#007aff"/>
                            </svg>
                        </button>
                        <div class="header-center"><div class="header-name">主题</div></div>
                        <div style="width:36px"></div>
                    </div>
                    <div class="settings-scroll">
                        <!-- 全局主题（影响整个手机所有 App） -->
                        <div class="settings-section">
                            <div class="settings-section-title">全局主题</div>
                            <div class="settings-group-box">
                                <div class="global-theme-grid">
                                    <div class="global-theme-item gt-default active" data-global="default">
                                        <div class="global-theme-preview">
                                            <div class="gt-bar"></div>
                                            <div class="gt-card"></div>
                                            <div class="gt-card gt-card-2"></div>
                                        </div>
                                        <div class="global-theme-name">默认</div>
                                    </div>
                                    <div class="global-theme-item gt-mint" data-global="mint">
                                        <div class="global-theme-preview">
                                            <div class="gt-bar"></div>
                                            <div class="gt-card"></div>
                                            <div class="gt-card gt-card-2"></div>
                                        </div>
                                        <div class="global-theme-name">薄荷</div>
                                    </div>
                                    <div class="global-theme-item gt-midnight" data-global="midnight">
                                        <div class="global-theme-preview">
                                            <div class="gt-bar"></div>
                                            <div class="gt-card"></div>
                                            <div class="gt-card gt-card-2"></div>
                                        </div>
                                        <div class="global-theme-name">暮夜</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 壁纸选择 -->
                        <div class="settings-section">
                            <div class="settings-section-title">壁纸</div>
                            <div class="settings-group-box wallpaper-settings">
                                <div class="wallpaper-grid">
                                    <div class="wallpaper-item active" data-wallpaper="gradient1">
                                        <div class="wallpaper-preview" style="background:#ffffff;border:1.5px solid #d1d1d6"></div>
                                    </div>
                                    <div class="wallpaper-item" data-wallpaper="gradient2">
                                        <div class="wallpaper-preview" style="background:linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"></div>
                                    </div>
                                    <div class="wallpaper-item" data-wallpaper="gradient3">
                                        <div class="wallpaper-preview" style="background:linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)"></div>
                                    </div>
                                    <div class="wallpaper-item" data-wallpaper="gradient4">
                                        <div class="wallpaper-preview" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%)"></div>
                                    </div>
                                    <div class="wallpaper-item" data-wallpaper="gradient5">
                                        <div class="wallpaper-preview" style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"></div>
                                    </div>
                                    <div class="wallpaper-item" data-wallpaper="gradient6">
                                        <div class="wallpaper-preview" style="background:linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"></div>
                                    </div>
                                    <div class="wallpaper-item" data-wallpaper="gradient7">
                                        <div class="wallpaper-preview" style="background:linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"></div>
                                    </div>
                                    <div class="wallpaper-item" data-wallpaper="gradient8">
                                        <div class="wallpaper-preview" style="background:linear-gradient(135deg, #fa709a 0%, #fee140 100%)"></div>
                                    </div>
                                    <div class="wallpaper-item" data-wallpaper="gradient9">
                                        <div class="wallpaper-preview" style="background:linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)"></div>
                                    </div>
                                    <div class="wallpaper-item" data-wallpaper="gradient10">
                                        <div class="wallpaper-preview" style="background:linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"></div>
                                    </div>
                                    <div class="wallpaper-item" data-wallpaper="customColor">
                                        <div class="wallpaper-preview" id="customColorPreview" style="background:#e8e8ea">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="#8e8e93">
                                                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12z"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <div class="wallpaper-item" data-wallpaper="custom">
                                        <div class="wallpaper-preview wallpaper-custom">
                                            <svg viewBox="0 0 24 24" width="24" height="24" fill="#8e8e93">
                                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div class="wallpaper-custom-color-row" style="margin-top:12px;display:none;align-items:center;gap:8px" id="customColorRow">
                                    <label style="font-size:14px;color:#1a1a1a">自定义纯色：</label>
                                    <input type="color" id="customColorInput" value="#e8e8ea" style="width:40px;height:32px;border:none;cursor:pointer;border-radius:8px">
                                    <span id="customColorHex" style="font-size:13px;color:#8e8e93">#e8e8ea</span>
                                </div>
                                <button class="wallpaper-reset-btn" id="resetWallpaperBtn" style="margin-top:12px;width:100%;padding:10px;background:#f2f2f7;border:none;border-radius:10px;color:#ff3b30;font-size:15px;cursor:pointer">恢复默认壁纸</button>
                                <input type="file" id="wallpaperFileInput" accept="image/*" style="display:none">
                            </div>
                        </div>

                        <!-- 图标样式 -->
                        <div class="settings-section">
                            <div class="settings-section-title">图标样式</div>
                            <div class="settings-group-box">
                                <div class="settings-row">
                                    <label class="settings-row-label">图标形状</label>
                                    <select class="settings-row-select" id="iconShape">
                                        <option value="rounded">圆角方形</option>
                                        <option value="circle">圆形</option>
                                        <option value="square">方形</option>
                                    </select>
                                </div>
                                <div class="settings-row">
                                    <label class="settings-row-label">图标大小</label>
                                    <div class="slider-group">
                                        <input type="range" class="settings-slider" id="iconSize" min="48" max="72" step="4">
                                        <span class="slider-val" id="iconSizeValue">58</span>
                                    </div>
                                </div>
                                <div class="settings-row">
                                    <label class="settings-row-label">图标描边</label>
                                    <label class="ios-switch">
                                        <input type="checkbox" id="iconStrokeSwitch" checked>
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="settings-row stroke-color-row" id="strokeColorRow">
                                    <label class="settings-row-label">描边颜色</label>
                                    <div class="stroke-color-palette">
                                        <div class="stroke-swatch active" data-stroke-color="#1a1a1a" style="background:#1a1a1a" title="默认黑"></div>
                                        <div class="stroke-swatch" data-stroke-color="#ffffff" style="background:#ffffff;border:1px solid #ccc" title="白色"></div>
                                        <div class="stroke-swatch" data-stroke-color="#007aff" style="background:#007aff" title="蓝色"></div>
                                        <div class="stroke-swatch" data-stroke-color="#ff3b30" style="background:#ff3b30" title="红色"></div>
                                        <div class="stroke-swatch" data-stroke-color="#34c759" style="background:#34c759" title="绿色"></div>
                                        <div class="stroke-swatch" data-stroke-color="#ff9500" style="background:#ff9500" title="橙色"></div>
                                        <div class="stroke-swatch" data-stroke-color="#af52de" style="background:#af52de" title="紫色"></div>
                                        <div class="stroke-swatch" data-stroke-color="#ffd60a" style="background:#ffd60a" title="黄色"></div>
                                        <input type="color" class="stroke-color-custom" id="strokeColorCustom" value="#1a1a1a" title="自定义颜色">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 单个图标自定义 -->
                        <div class="settings-section">
                            <div class="settings-section-title">自定义图标（图片或颜色）</div>
                            <div class="settings-group-box" style="margin-bottom: 12px;">
                                <div class="settings-row">
                                    <label class="settings-row-label">隐藏自定义图标文字</label>
                                    <label class="ios-switch">
                                        <input type="checkbox" id="hideCustomIconTextSwitch">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                            </div>
                            <div class="settings-group-box icon-color-settings">
                                <div class="icon-color-item" data-app-icon="chat">
                                    <div class="icon-preview" data-preview="chat"></div>
                                    <span class="icon-color-name">Uchat</span>
                                    <div class="icon-controls">
                                        <input type="color" class="icon-color-picker" data-app-color="chat" value="#667eea" title="选择颜色">
                                        <button class="icon-upload-btn" data-upload="chat" title="上传图片">📷</button>
                                        <button class="icon-reset-btn" data-app-reset="chat" title="重置">↺</button>
                                    </div>
                                    <input type="file" id="iconFile_chat" accept="image/*" style="display:none" data-app-upload="chat">
                                </div>
                                <div class="icon-color-item" data-app-icon="settings">
                                    <div class="icon-preview" data-preview="settings"></div>
                                    <span class="icon-color-name">设置</span>
                                    <div class="icon-controls">
                                        <input type="color" class="icon-color-picker" data-app-color="settings" value="#8e8e93" title="选择颜色">
                                        <button class="icon-upload-btn" data-upload="settings" title="上传图片">📷</button>
                                        <button class="icon-reset-btn" data-app-reset="settings" title="重置">↺</button>
                                    </div>
                                    <input type="file" id="iconFile_settings" accept="image/*" style="display:none" data-app-upload="settings">
                                </div>
                                <div class="icon-color-item" data-app-icon="theme">
                                    <div class="icon-preview" data-preview="theme"></div>
                                    <span class="icon-color-name">主题</span>
                                    <div class="icon-controls">
                                        <input type="color" class="icon-color-picker" data-app-color="theme" value="#af52de" title="选择颜色">
                                        <button class="icon-upload-btn" data-upload="theme" title="上传图片">📷</button>
                                        <button class="icon-reset-btn" data-app-reset="theme" title="重置">↺</button>
                                    </div>
                                    <input type="file" id="iconFile_theme" accept="image/*" style="display:none" data-app-upload="theme">
                                </div>
                                <div class="icon-color-item" data-app-icon="photos">
                                    <div class="icon-preview" data-preview="photos"></div>
                                    <span class="icon-color-name">相册</span>
                                    <div class="icon-controls">
                                        <input type="color" class="icon-color-picker" data-app-color="photos" value="#ff9500" title="选择颜色">
                                        <button class="icon-upload-btn" data-upload="photos" title="上传图片">📷</button>
                                        <button class="icon-reset-btn" data-app-reset="photos" title="重置">↺</button>
                                    </div>
                                    <input type="file" id="iconFile_photos" accept="image/*" style="display:none" data-app-upload="photos">
                                </div>
                                <div class="icon-color-item" data-app-icon="music">
                                    <div class="icon-preview" data-preview="music"></div>
                                    <span class="icon-color-name">音乐</span>
                                    <div class="icon-controls">
                                        <input type="color" class="icon-color-picker" data-app-color="music" value="#ff2d55" title="选择颜色">
                                        <button class="icon-upload-btn" data-upload="music" title="上传图片">📷</button>
                                        <button class="icon-reset-btn" data-app-reset="music" title="重置">↺</button>
                                    </div>
                                    <input type="file" id="iconFile_music" accept="image/*" style="display:none" data-app-upload="music">
                                </div>
                                <div class="icon-color-item" data-app-icon="safari">
                                    <div class="icon-preview" data-preview="safari"></div>
                                    <span class="icon-color-name">Safari</span>
                                    <div class="icon-controls">
                                        <input type="color" class="icon-color-picker" data-app-color="safari" value="#34c759" title="选择颜色">
                                        <button class="icon-upload-btn" data-upload="safari" title="上传图片">📷</button>
                                        <button class="icon-reset-btn" data-app-reset="safari" title="重置">↺</button>
                                    </div>
                                    <input type="file" id="iconFile_safari" accept="image/*" style="display:none" data-app-upload="safari">
                                </div>
                                <div class="icon-color-item" data-app-icon="weather">
                                    <div class="icon-preview" data-preview="weather"></div>
                                    <span class="icon-color-name">天气</span>
                                    <div class="icon-controls">
                                        <input type="color" class="icon-color-picker" data-app-color="weather" value="#5ac8fa" title="选择颜色">
                                        <button class="icon-upload-btn" data-upload="weather" title="上传图片">📷</button>
                                        <button class="icon-reset-btn" data-app-reset="weather" title="重置">↺</button>
                                    </div>
                                    <input type="file" id="iconFile_weather" accept="image/*" style="display:none" data-app-upload="weather">
                                </div>
                                <div class="icon-color-item" data-app-icon="notes">
                                    <div class="icon-preview" data-preview="notes"></div>
                                    <span class="icon-color-name">备忘录</span>
                                    <div class="icon-controls">
                                        <input type="color" class="icon-color-picker" data-app-color="notes" value="#ffd60a" title="选择颜色">
                                        <button class="icon-upload-btn" data-upload="notes" title="上传图片">📷</button>
                                        <button class="icon-reset-btn" data-app-reset="notes" title="重置">↺</button>
                                    </div>
                                    <input type="file" id="iconFile_notes" accept="image/*" style="display:none" data-app-upload="notes">
                                </div>
                                <div class="icon-color-item" data-app-icon="clock">
                                    <div class="icon-preview" data-preview="clock"></div>
                                    <span class="icon-color-name">时钟</span>
                                    <div class="icon-controls">
                                        <input type="color" class="icon-color-picker" data-app-color="clock" value="#1c1c1e" title="选择颜色">
                                        <button class="icon-upload-btn" data-upload="clock" title="上传图片">📷</button>
                                        <button class="icon-reset-btn" data-app-reset="clock" title="重置">↺</button>
                                    </div>
                                    <input type="file" id="iconFile_clock" accept="image/*" style="display:none" data-app-upload="clock">
                                </div>
                            </div>
                        </div>

                        <button class="settings-save-btn" id="saveThemeBtn">保存主题</button>
                        <button class="wallpaper-reset-btn" id="resetIconsBtn" style="margin-top:8px;width:100%;padding:10px;background:#f2f2f7;border:none;border-radius:10px;color:#ff3b30;font-size:15px;cursor:pointer">恢复默认图标</button>
                    </div>
                </div>
    `,
    init: function() {
        const backBtn = document.getElementById('backTheme');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (typeof closeApp === 'function') closeApp('pageTheme');
            });
        }
    }
});