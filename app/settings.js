window.AppRegistry = window.AppRegistry || [];
window.AppRegistry.push({
    id: 'pageSettings',
    html: `
<!-- ===== 系统设置页面（iOS 风格） ===== -->
                <div class="page page-settings page-app" id="pageSettings">
                    <div class="page-header">
                        <button class="header-back-btn" id="backSettings">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#007aff"/>
                            </svg>
                        </button>
                        <div class="header-center"><div class="header-name">设置</div></div>
                        <div style="width:36px"></div>
                    </div>
                    <div class="settings-scroll">
                        <!-- Apple ID -->
                        <div class="settings-section">
                            <div class="settings-group-box">
                                <div class="settings-row ios-profile-row">
                                    <div class="ios-profile-avatar">
                                        <svg viewBox="0 0 40 40" width="40" height="40">
                                            <circle cx="20" cy="20" r="20" fill="#007aff"/>
                                        </svg>
                                    </div>
                                    <div class="ios-profile-info">
                                        <div class="ios-profile-name">用户</div>
                                        <div class="ios-profile-sub">Apple ID、iCloud、媒体与购买项目</div>
                                    </div>
                                    <svg class="ios-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="#c7c7cc"/></svg>
                                </div>
                            </div>
                        </div>

                        <!-- 连接 -->
                        <div class="settings-section">
                            <div class="settings-group-box">
                                <div class="settings-row ios-tile-row">
                                    <div class="ios-tile-icon" style="background:#007aff"><svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg></div>
                                    <span class="ios-tile-label">无线局域网</span>
                                    <div class="ios-tile-right"><span class="ios-tile-value">已连接</span><svg class="ios-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="#c7c7cc"/></svg></div>
                                </div>
                                <div class="settings-row ios-tile-row">
                                    <div class="ios-tile-icon" style="background:#007aff"><svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/></svg></div>
                                    <span class="ios-tile-label">蓝牙</span>
                                    <div class="ios-tile-right"><span class="ios-tile-value">已打开</span><svg class="ios-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="#c7c7cc"/></svg></div>
                                </div>
                                <div class="settings-row ios-tile-row">
                                    <div class="ios-tile-icon" style="background:#34c759"><svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg></div>
                                    <span class="ios-tile-label">蜂窝网络</span>
                                    <div class="ios-tile-right"><svg class="ios-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="#c7c7cc"/></svg></div>
                                </div>
                            </div>
                        </div>

                        <!-- 通知 -->
                        <div class="settings-section">
                            <div class="settings-group-box">
                                <div class="settings-row ios-tile-row">
                                    <div class="ios-tile-icon" style="background:#ff3b30"><svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg></div>
                                    <span class="ios-tile-label">通知</span>
                                    <div class="ios-tile-right"><svg class="ios-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="#c7c7cc"/></svg></div>
                                </div>
                                <div class="settings-row ios-tile-row">
                                    <div class="ios-tile-icon" style="background:#ff9500"><svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg></div>
                                    <span class="ios-tile-label">声音与触感</span>
                                    <div class="ios-tile-right"><svg class="ios-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="#c7c7cc"/></svg></div>
                                </div>
                                <div class="settings-row ios-tile-row">
                                    <div class="ios-tile-icon" style="background:#5856d6"><svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z"/></svg></div>
                                    <span class="ios-tile-label">专注模式</span>
                                    <div class="ios-tile-right"><svg class="ios-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="#c7c7cc"/></svg></div>
                                </div>
                            </div>
                        </div>

                        <!-- 显示与亮度 -->
                        <div class="settings-section">
                            <div class="settings-group-box">
                                <div class="settings-row ios-tile-row">
                                    <div class="ios-tile-icon" style="background:#007aff"><svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg></div>
                                    <span class="ios-tile-label">显示与亮度</span>
                                    <div class="ios-tile-right"><svg class="ios-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="#c7c7cc"/></svg></div>
                                </div>
                                <div class="settings-row ios-tile-row">
                                    <div class="ios-tile-icon" style="background:#007aff"><svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg></div>
                                    <span class="ios-tile-label">壁纸</span>
                                    <div class="ios-tile-right"><svg class="ios-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="#c7c7cc"/></svg></div>
                                </div>
                            </div>
                        </div>

                        <!-- 通用 -->
                        <div class="settings-section">
                            <div class="settings-group-box">
                                <div class="settings-row ios-tile-row">
                                    <div class="ios-tile-icon" style="background:#8e8e93"><svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.611 3.611 0 0112 15.6z"/></svg></div>
                                    <span class="ios-tile-label">通用</span>
                                    <div class="ios-tile-right"><svg class="ios-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="#c7c7cc"/></svg></div>
                                </div>
                                <div class="settings-row ios-tile-row">
                                    <div class="ios-tile-icon" style="background:#007aff"><svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg></div>
                                    <span class="ios-tile-label">隐私与安全性</span>
                                    <div class="ios-tile-right"><svg class="ios-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="#c7c7cc"/></svg></div>
                                </div>
                            </div>
                        </div>

                        <!-- 关于本机 -->
                        <div class="settings-section">
                            <div class="settings-group-box">
                                <div class="settings-row ios-tile-row">
                                    <div class="ios-tile-icon" style="background:#8e8e93"><svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></div>
                                    <span class="ios-tile-label">关于本机</span>
                                    <div class="ios-tile-right"><svg class="ios-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="#c7c7cc"/></svg></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
    `,
    init: function() {
        const backBtn = document.getElementById('backSettings');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (typeof closeApp === 'function') closeApp('pageSettings');
            });
        }
    }
});