window.AppRegistry = window.AppRegistry || [];
window.AppRegistry.push({
    id: 'pageNotes',
    html: `
                <div class="page page-notes page-app" id="pageNotes">
                    <div class="page-header">
                        <button class="header-back-btn" id="backNotes">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#007aff"/>
                            </svg>
                        </button>
                        <div class="header-center"><div class="header-name">备忘录</div></div>
                        <div style="width:36px"></div>
                    </div>
                    <div class="settings-scroll">
                        <div class="settings-section">
                            <div class="settings-group-box">
                                <div class="settings-row ios-tile-row">
                                    <div class="ios-tile-icon" style="background:#ffd60a">📝</div>
                                    <span class="ios-tile-label">欢迎使用</span>
                                    <div class="ios-tile-right"><span class="ios-tile-value">演示笔记</span></div>
                                </div>
                                <div style="padding:16px;color:#3a3a3c;font-size:15px;line-height:1.6">
                                    部署到 GitHub Pages 后，此页面由本地模块加载，不依赖额外后端。
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
    `,
    init: function() {
        const backBtn = document.getElementById('backNotes');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (typeof closeApp === 'function') closeApp();
            });
        }
    }
});