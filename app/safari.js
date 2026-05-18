window.AppRegistry = window.AppRegistry || [];
window.AppRegistry.push({
    id: 'pageSafari',
    html: `
                <div class="page page-safari page-app" id="pageSafari">
                    <div class="page-header">
                        <button class="header-back-btn" id="backSafari">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#007aff"/>
                            </svg>
                        </button>
                        <div class="header-center"><div class="header-name">Safari</div></div>
                        <div style="width:36px"></div>
                    </div>
                    <div class="settings-scroll">
                        <div class="settings-section">
                            <div class="settings-group-box">
                                <div class="settings-row">
                                    <label class="settings-row-label">地址栏</label>
                                    <input type="text" class="settings-row-input" id="safariAddress" value="https://github.com" autocomplete="off">
                                </div>
                                <div class="settings-row ios-tile-row">
                                    <div class="ios-tile-icon" style="background:#34c759">🌐</div>
                                    <span class="ios-tile-label">浏览器演示页</span>
                                    <div class="ios-tile-right"><span class="ios-tile-value">可打开</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
    `,
    init: function() {
        const backBtn = document.getElementById('backSafari');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (typeof closeApp === 'function') closeApp();
            });
        }
    }
});