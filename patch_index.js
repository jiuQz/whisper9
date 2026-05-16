const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
code = code.replace(/<div class="header-name">通讯录<\/div>/, '<div class="header-name">微信</div>');
code = code.replace(/<span>删除联系人<\/span>/g, '<span>删除该聊天</span>');

const unreadHTML = `
                        <div class="agent-action-item" data-action="unread" id="agentActionUnread">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                            <span id="agentActionUnreadText">标为未读</span>
                        </div>
`;
if(!code.includes('agentActionUnread')) {
    code = code.replace('<div class="agent-action-item agent-action-danger" data-action="delete">', unreadHTML + '                        <div class="agent-action-item agent-action-danger" data-action="delete">');
}
fs.writeFileSync('index.html', code);
console.log('patched index.html');