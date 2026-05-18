window.AppRegistry = window.AppRegistry || [];
window.AppRegistry.push({
    id: 'pageMusic',
    html: `
                <div class="page page-music page-app" id="pageMusic">
                    <div class="page-header">
                        <button class="header-back-btn" id="backMusic">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#007aff"/>
                            </svg>
                        </button>
                        <div class="header-center"><div class="header-name">音乐</div></div>
                        <div style="width:36px"></div>
                    </div>
                    <div class="settings-scroll">
                        <div class="settings-section">
                            <div class="settings-group-box">
                                <div class="settings-row ios-tile-row">
                                    <div class="ios-tile-icon" style="background:#ff2d55">♪</div>
                                    <span class="ios-tile-label">本地音乐</span>
                                    <div class="ios-tile-right"><span class="ios-tile-value">演示</span></div>
                                </div>
                                <div class="settings-row ios-tile-row">
                                    <div class="ios-tile-icon" style="background:#ff9500">♫</div>
                                    <span class="ios-tile-label">播放列表</span>
                                    <div class="ios-tile-right"><span class="ios-tile-value">暂无</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
    `,
    init: function() {
        const backBtn = document.getElementById('backMusic');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (typeof closeApp === 'function') closeApp();
            });
        }
    }
});