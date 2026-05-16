const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');

// 1. Remove default agent logic
const startBuildList = js.indexOf('    // 构建列表：默认 AI 助手 + 智能体');
const endBuildList = js.indexOf('    // 无结果时显示空状态');

if (startBuildList !== -1 && endBuildList !== -1) {
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
    js = js.slice(0, startBuildList) + newBuildList + js.slice(endBuildList);
} else {
    console.log('Build list not found!');
}

// 2. Replace the HTML generation and event binding
const startHTML = js.indexOf('        return `\n            <div class="agent-row${isPinned');
const endHTML = js.indexOf('    });\n}\n\nfunction escHTML');

if (startHTML !== -1 && endHTML !== -1) {
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
`;
    js = js.slice(0, startHTML) + newHTML + js.slice(endHTML);
} else {
    console.log('HTML block not found!');
}

fs.writeFileSync('script.js', js);
console.log('Script patched successfully');