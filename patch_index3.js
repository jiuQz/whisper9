const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find pageSettings
const settingsMatch = html.match(/\<\!\-\- ===== 系统设置页面（iOS 风格） ===== \-\-\>/);
// Find next after pageTheme, which is pagePhotos
const photosMatch = html.match(/\<\!\-\- ===== 相册页面 ===== \-\-\>/);

if (settingsMatch && photosMatch) {
    html = html.substring(0, settingsMatch.index) + html.substring(photosMatch.index);
}

// Add script tags
html = html.replace('<script src="app/photos.js"></script>', '<script src="app/settings.js"></script>\n    <script src="app/chatSettings.js"></script>\n    <script src="app/theme.js"></script>\n    <script src="app/photos.js"></script>');

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html updated for settings, chatSettings, theme.');