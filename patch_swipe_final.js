const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');

// 1. Remove default agent from the build list
const target1 = `    // 构建列表：默认 AI 助手 + 智能体`;
const end1 = `    // 无结果时显示空状态`;
if (js.includes(target1)) {
    const idx1 = js.indexOf(target1);
    const idx2 = js.indexOf(end1);
    const newBuildList = `    // 构建列表：仅自定义智能体
    let allChats = [];
    
    const customAgents = STATE.agents.filter(a => !searchTerm || a.name.toLowerCase().includes(searchTerm));
    customAgents.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });
    
    customAgents.forEach(agent => {
        allChats.push({ agent, isDefault: false, isPinned: agent.isPinned });
    });
    
`;
    js = js.substring(0, idx1) + newBuildList + js.substring(idx2);
}

// 2. Replace HTML and event binding
// We look for the start of `return \`` inside `list.innerHTML = allChats.map`
const searchStart = "        return `";
const searchEnd = "function escHTML";

let idxStart = js.lastIndexOf(searchStart, js.indexOf('function escHTML'));
let idxEnd = js.indexOf(searchEnd);

if (idxStart !== -1 && idxEnd !== -1) {
    const newHTML = `        return \`
            <div class="agent-row-wrapper\${isPinned ? ' agent-row-pinned' : ''}" data-agent-id="\${agent.id}">
                <div class="agent-row-actions">
                    <button class="swipe-btn unread" onclick="handleSwipeAction(event, 'unread', '\${agent.id}')">\${unread > 0 ? '标为已读' : '标为未读'}</button>
                    <button class="swipe-btn pin" onclick="handleSwipeAction(event, 'pin', '\${agent.id}')">\${isPinned ? '取消置顶' : '置顶'}</button>
                    <button class="swipe-btn delete" onclick="handleSwipeAction(event, 'delete', '\${agent.id}')">删除</button>
                </div>
                <div class="agent-row">
                    <div class="agent-avatar" style="background:linear-gradient(135deg,\${agent.avatarC1},\${agent.avatarC2})">\${avatarHtml}</div>
                    <div class="agent-info">
                        <div class="agent-info-top">
                            <span class="agent-name">\${pinnedIcon} \${escHTML(agent.name)}</span>
                            \${lastTime ? \\\`<span class="agent-time">\${lastTime}</span>\\\` : ''}
                        </div>
                        <div class="agent-last-msg">\${lastMsg || '点击开始对话'}</div>
                    </div>
                    \${badgeHtml}
                </div>
            </div>
        \`;
    }).join('');
    
    // 绑定滑动事件
    initAgentSwipes(list);
}

`;
    js = js.substring(0, idxStart) + newHTML + js.substring(idxEnd);
}

fs.writeFileSync('script.js', js);
console.log('Script patched successfully');