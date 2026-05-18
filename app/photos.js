window.AppRegistry = window.AppRegistry || [];
window.AppRegistry.push({
    id: 'pagePhotos',
    html: `
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
    `,
    init: function() {
        const backBtn = document.getElementById('backPhotos');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (typeof closeApp === 'function') closeApp('pagePhotos');
            });
        }
    }
});