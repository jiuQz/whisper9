const fs = require('fs');

// 1. Modify styles.css to add swipe styles
let css = fs.readFileSync('styles.css', 'utf8');
if (!css.includes('.agent-row-wrapper')) {
    css += `\n
/* Swipe actions styles */
.agent-row-wrapper {
    position: relative;
    overflow: hidden;
    background: #fff;
    border-bottom: 1px solid #e5e5ea;
}
.agent-row-wrapper .agent-row {
    position: relative;
    z-index: 1;
    background: #fff;
    border-bottom: none;
    transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    transform: translateX(0);
}
.agent-row-wrapper.swiped .agent-row {
    transform: translateX(-195px); /* 65px * 3 buttons */
}
.agent-row-pinned .agent-row {
    background: #f5f5f5;
}
.agent-row-actions {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    display: flex;
    z-index: 0;
}
.swipe-btn {
    width: 65px;
    height: 100%;
    border: none;
    color: #fff;
    font-size: 15px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
}
.swipe-btn:active { opacity: 0.8; }
.swipe-btn.unread { background: #007aff; }
.swipe-btn.pin { background: #ff9500; }
.swipe-btn.delete { background: #ff3b30; }
`;
    fs.writeFileSync('styles.css', css);
}

// 2. Modify script.js
let js = fs.readFileSync('script.js', 'utf8');

// Remove the hardcoded default agent from allChats logic
let searchRender = `    // 构建列表：默认 AI 助手 + 智能体
    let allChats = [];
    
    // 默认 AI 助手始终在第一位（除非搜索过滤掉）
    const defaultAgent = getDefaultAgent();
    const defaultMatch = !searchTerm || defaultAgent.name.toLowerCase().includes(searchTerm);
    if (defaultMatch) {
        allChats.push({ agent: defaultAgent, isDefault: true, isPinned: true });
    }
    
    const customAgents = STATE.agents.filter(a => !searchTerm || a.name.toLowerCase().includes(searchTerm));
    // 排序：置顶的排在前面
    customAgents.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });
    
    customAgents.forEach(agent => {
        allChats.push({ agent, isDefault: false, isPinned: agent.isPinned });
    });`;

let replaceRender = `    // 构建列表：移除一开始强制的 AI 助手
    let allChats = [];
    
    const customAgents = STATE.agents.filter(a => !searchTerm || a.name.toLowerCase().includes(searchTerm));
    // 排序：置顶的排在前面
    customAgents.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });
    
    customAgents.forEach(agent => {
        allChats.push({ agent, isDefault: false, isPinned: agent.isPinned });
    });`;
js = js.replace(searchRender, replaceRender);

// Replace mapping HTML inside renderAgentList
let searchHTML = `        return \`
            <div class="agent-row\${isPinned ? ' agent-row-pinned' : ''}" data-agent-id="\${agent.id}" data-is-default="\${isDefault ? '1' : '0'}">
                <div class="agent-avatar" style="background:linear-gradient(135deg,\${agent.avatarC1},\${agent.avatarC2})">\${avatarHtml}</div>
                <div class="agent-info">
                    <div class="agent-info-top">
                        <span class="agent-name">\${pinnedIcon} \${escHTML(agent.name)}</span>
                        \${lastTime ? \`<span class="agent-time">\${lastTime}</span>\` : ''}
                    </div>
                    <div class="agent-last-msg">\${lastMsg || '点击开始对话'}</div>
                </div>
                \${badgeHtml}
            </div>
        \`;
    }).join('');
    
    // 绑定点击事件
    list.querySelectorAll('.agent-row').forEach(row => {
        row.addEventListener('click', () => {
            const agentId = row.dataset.agentId;
            selectAgent(agentId);
        });
        
        // 只有非默认智能体才显示长按菜单
        if (row.dataset.isDefault !== '1') {
            initAgentLongPress(row);
        }
    });`;

let replaceHTML = `        return \`
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
                            \${lastTime ? \`<span class="agent-time">\${lastTime}</span>\` : ''}
                        </div>
                        <div class="agent-last-msg">\${lastMsg || '点击开始对话'}</div>
                    </div>
                    \${badgeHtml}
                </div>
            </div>
        \`;
    }).join('');
    
    // 绑定点击和滑动事件
    initAgentSwipes(list);
`;
js = js.replace(searchHTML, replaceHTML);

let appendJS = `
// 左滑菜单处理
window.handleSwipeAction = function(e, action, agentId) {
    e.stopPropagation();
    const agent = STATE.agents.find(a => a.id === agentId);
    if (!agent) return;
    
    switch (action) {
        case 'unread':
            if (!STATE.agentChats[agentId]) STATE.agentChats[agentId] = { unread: 0, messages: [] };
            const chat = STATE.agentChats[agentId];
            chat.unread = (chat.unread && chat.unread > 0) ? 0 : 1;
            saveAgentChats();
            renderAgentList();
            break;
        case 'pin':
            agent.isPinned = !agent.isPinned;
            saveAgents();
            renderAgentList();
            break;
        case 'delete':
            if (confirm(\`确定删除"\${agent.name}"及其所有聊天记录？\`)) {
                deleteAgent(agentId);
            }
            break;
    }
};

function initAgentSwipes(list) {
    list.querySelectorAll('.agent-row-wrapper').forEach(wrapper => {
        const row = wrapper.querySelector('.agent-row');
        let startX = 0;
        let startY = 0;
        let isSwiping = false;
        
        // 点击进入聊天
        row.addEventListener('click', (e) => {
            if (wrapper.classList.contains('swiped')) {
                // 如果是展开状态，点击内容区域则收起
                wrapper.classList.remove('swiped');
                return;
            }
            selectAgent(wrapper.dataset.agentId);
        });

        row.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwiping = false;
            // 收起其他已展开的项
            list.querySelectorAll('.agent-row-wrapper.swiped').forEach(w => {
                if (w !== wrapper) w.classList.remove('swiped');
            });
        }, {passive: true});

        row.addEventListener('touchmove', e => {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = startX - currentX;
            const diffY = Math.abs(startY - currentY);
            
            // 如果纵向滑动大于横向滑动，认为是滚动列表，不处理
            if (diffY > Math.abs(diffX)) return;
            
            if (diffX > 30) {
                // 左滑展开
                wrapper.classList.add('swiped');
                isSwiping = true;
            } else if (diffX < -30) {
                // 右滑收起
                wrapper.classList.remove('swiped');
                isSwiping = true;
            }
        }, {passive: true});
    });
}
`;
if(!js.includes('window.handleSwipeAction')) {
    js += appendJS;
}
fs.writeFileSync('script.js', js);
console.log('Swipe patch 2 applied');