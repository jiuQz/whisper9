const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

// 1. In showAgentActionMenu:
// add logic for unread text update
let searchShow = `    const pinText = $('agentActionPinText');
    if (pinText && agent) {
        pinText.textContent = agent.isPinned ? '取消置顶' : '置顶聊天';
    }`;
let replaceShow = `    const pinText = $('agentActionPinText');
    if (pinText && agent) {
        pinText.textContent = agent.isPinned ? '取消置顶' : '置顶聊天';
    }
    
    // 更新未读文本
    const unreadText = $('agentActionUnreadText');
    if (unreadText) {
        const chat = STATE.agentChats[agentId];
        const isUnread = chat && chat.unread > 0;
        unreadText.textContent = isUnread ? '标为已读' : '标为未读';
    }`;
code = code.replace(searchShow, replaceShow);

// 2. In handleAgentAction:
// add case 'unread'
let searchHandle = `        case 'pin':
            agent.isPinned = !agent.isPinned;
            saveAgents();
            renderAgentList();
            break;
    }`;
let replaceHandle = `        case 'pin':
            agent.isPinned = !agent.isPinned;
            saveAgents();
            renderAgentList();
            break;
        case 'unread':
            if (!STATE.agentChats[agentId]) STATE.agentChats[agentId] = { unread: 0, messages: [] };
            const chat = STATE.agentChats[agentId];
            chat.unread = (chat.unread && chat.unread > 0) ? 0 : 1;
            saveAgentChats();
            renderAgentList();
            break;
    }`;
code = code.replace(searchHandle, replaceHandle);

fs.writeFileSync('script.js', code);
console.log('patched script.js');