const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const startIdx = html.indexOf('<!-- ===== 音乐页面 ===== -->');
const endIdx = html.indexOf('<!-- ===== 聊天列表页（微信风格——通讯录） ===== -->');
if (startIdx !== -1 && endIdx !== -1) {
    html = html.substring(0, startIdx) + html.substring(endIdx);
}
html = html.replace('<script src="app/photos.js"></script>', '<script src="app/photos.js"></script>\n    <script src="app/music.js"></script>\n    <script src="app/safari.js"></script>\n    <script src="app/weather.js"></script>\n    <script src="app/notes.js"></script>\n    <script src="app/clock.js"></script>');
fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html updated successfully.');