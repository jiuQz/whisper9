window.AppRegistry = window.AppRegistry || [];
window.AppRegistry.push({
    id: 'pageWeather',
    html: `
                <div class="page page-weather page-app" id="pageWeather">
                    <div class="page-header">
                        <button class="header-back-btn" id="backWeather">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#007aff"/>
                            </svg>
                        </button>
                        <div class="header-center"><div class="header-name">天气</div></div>
                        <div style="width:36px"></div>
                    </div>
                    <div class="settings-scroll">
                        <div class="settings-section">
                            <div class="settings-group-box">
                                <div style="padding:24px;text-align:center">
                                    <div style="font-size:56px;line-height:1">☀️</div>
                                    <div style="font-size:34px;font-weight:700;margin-top:8px">26°</div>
                                    <div style="font-size:15px;color:#8e8e93;margin-top:4px">晴 · GitHub Pages</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
    `,
    init: function() {
        const backBtn = document.getElementById('backWeather');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (typeof closeApp === 'function') closeApp();
            });
        }
    }
});