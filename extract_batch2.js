const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

function extractApp(id, jsName) {
    const startRegex = new RegExp('\\<\\!\\-\\- ===== .*?' + id.replace('page', '') + '.*? ===== \\-\\-\\>', 'i');
    // For Settings it's "系统设置页面（iOS 风格）", Theme is "主题页面", ChatSettings is "聊天设置页面（原设置内容）"
    let startMatch = html.match(new RegExp('\\<\\!\\-\\- ===== .*?(?:主题|设置|原设置).*? ===== \\-\\-\\>'));
    
    // We can just find by id="pageTheme" etc.
    const idRegex = new RegExp('\\<\\!\\-\\- ===== [^=]+ ===== \\-\\-\\>[\\s\\n]*\\<div class="[^"]*" id="' + id + '"');
    const idMatch = html.match(idRegex);
    
    let startIdx;
    if (idMatch) {
        startIdx = idMatch.index;
    } else {
        const fallbackMatch = html.match(new RegExp('\\<div class="[^"]*" id="' + id + '"'));
        if(!fallbackMatch) return;
        // find previous comment
        const prevComment = html.lastIndexOf('<!-- =====', fallbackMatch.index);
        startIdx = prevComment !== -1 ? prevComment : fallbackMatch.index;
    }
    
    const nextAppRegex = /\<\!\-\- ===== [^=]+ ===== \-\-\>/g;
    nextAppRegex.lastIndex = startIdx + 10;
    const nextMatch = nextAppRegex.exec(html);
    
    let htmlContent = '';
    if (nextMatch) {
        htmlContent = html.substring(startIdx, nextMatch.index).trim();
    } else {
        const pageContainerEnd = html.indexOf('</div><!-- /page-container -->');
        if (pageContainerEnd !== -1) {
            htmlContent = html.substring(startIdx, pageContainerEnd).trim();
        } else {
            htmlContent = html.substring(startIdx).trim();
        }
    }
    
    const fileContent = `window.AppRegistry = window.AppRegistry || [];
window.AppRegistry.push({
    id: '${id}',
    html: \`
${htmlContent}
    \`,
    init: function() {
        const backBtn = document.getElementById('back${id.replace('page', '')}');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (typeof closeApp === 'function') closeApp('${id}');
            });
        }
    }
});`;

    fs.writeFileSync('app/' + jsName + '.js', fileContent);
    console.log('Extracted ' + jsName);
}

extractApp('pageSettings', 'settings');
extractApp('pageChatSettings', 'chatSettings');
extractApp('pageTheme', 'theme');