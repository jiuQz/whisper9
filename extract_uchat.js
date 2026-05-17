const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const chatStartIdx = html.indexOf('<!-- ===== Uchat页面 ===== -->');
// find end of pageChat, or since pageAgents comes after it, we can extract from pageChat to end of pageAgents.
// actually pageAgents is at the end of the pageContainer.
const agentsStartIdx = html.indexOf('<!-- ===== 聊天列表页（微信风格——通讯录） ===== -->');
// pageAgents ends at </div><!-- /page-container -->
const containerEndIdx = html.indexOf('</div><!-- /page-container -->');

if (chatStartIdx !== -1 && agentsStartIdx !== -1 && containerEndIdx !== -1) {
    // The problem is pageHome is BEFORE pageChat, and in between there's nothing, maybe some spaces.
    // Wait, are they contiguous?
    const chatHtml = html.substring(chatStartIdx, agentsStartIdx).trim();
    const agentsHtml = html.substring(agentsStartIdx, containerEndIdx).trim();

    const fileContent = `window.AppRegistry = window.AppRegistry || [];
window.AppRegistry.push({
    id: 'pageChat',
    html: \`
${chatHtml}
${agentsHtml}
    \`,
    init: function() {
        const closeChatBtn = document.getElementById('closeChat');
        if (closeChatBtn) {
            closeChatBtn.addEventListener('click', () => {
                if (typeof closeApp === 'function') closeApp('pageChat');
            });
        }
        
        const backAgentsBtn = document.getElementById('backAgents');
        if (backAgentsBtn) {
            backAgentsBtn.addEventListener('click', () => {
                if (typeof closeApp === 'function') closeApp('pageAgents');
            });
        }
    }
});`;

    fs.writeFileSync('app/uchat.js', fileContent, 'utf8');
    console.log('Extracted uchat');
    
    // Now patch index.html
    const newHtml = html.substring(0, chatStartIdx) + html.substring(containerEndIdx);
    const finalHtml = newHtml.replace('<script src="app/settings.js"></script>', '<script src="app/uchat.js"></script>\n    <script src="app/settings.js"></script>');
    
    fs.writeFileSync('index.html', finalHtml, 'utf8');
    console.log('index.html updated for uchat.');
} else {
    console.log('Could not find uchat sections in index.html');
}