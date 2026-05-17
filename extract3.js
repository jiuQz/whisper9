const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

function extractApp(id, jsName) {
    const startRegex = new RegExp('\<\!\-\- ===== ' + id + '页面 ===== \-\-\>');
    const startMatch = html.match(startRegex);
    if(!startMatch) return;
    const startIdx = startMatch.index;
    
    // Simple tag counter isn't strictly necessary if we know the structure,
    // let's do a fast forward to the next <!-- =====
    const nextAppRegex = /\<\!\-\- ===== .*?页面 ===== \-\-\>/g;
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

extractApp('pageMusic', 'music');
extractApp('pageSafari', 'safari');
extractApp('pageWeather', 'weather');
extractApp('pageNotes', 'notes');
extractApp('pageClock', 'clock');