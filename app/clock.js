window.AppRegistry = window.AppRegistry || [];
window.AppRegistry.push({
    id: 'pageClock',
    html: `
                <div class="page page-clock page-app" id="pageClock">
                    <div class="page-header">
                        <button class="header-back-btn" id="backClock">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#007aff"/>
                            </svg>
                        </button>
                        <div class="header-center"><div class="header-name">时钟</div></div>
                        <div style="width:36px"></div>
                    </div>
                    <div class="settings-scroll">
                        <div class="settings-section">
                            <div class="settings-group-box">
                                <div style="padding:24px;text-align:center">
                                    <div id="clockAppTime" style="font-size:48px;font-weight:700;letter-spacing:-1px">09:41</div>
                                    <div id="clockAppDate" style="font-size:15px;color:#8e8e93;margin-top:6px">今天</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
    `,
    init: function() {
        const backBtn = document.getElementById('backClock');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (typeof closeApp === 'function') closeApp();
            });
        }

        const updateClockPage = () => {
            const now = new Date();
            const timeEl = document.getElementById('clockAppTime');
            const dateEl = document.getElementById('clockAppDate');
            if (timeEl) {
                timeEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            }
            if (dateEl) {
                dateEl.textContent = now.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                });
            }
        };

        updateClockPage();
        setInterval(updateClockPage, 30000);
    }
});