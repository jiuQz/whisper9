const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');

const search = `        let agentId = overlay.dataset.editAgentId;
        const isEdit = !!agentId;
        
        const c1 = '#667eea';
        const c2 = '#667eea'; // 强制单色
        
        let agent;
        if (isEdit) {
            agent = STATE.agents.find(a => a.id === agentId);
            if (!agent) return;
            agent.name = name;
            agent.systemPrompt = promptTextarea.value.trim();
            agent.avatarC1 = c1;
            agent.avatarC2 = c2;
        } else {
            agentId = 'agent_' + Date.now();
            agent = {
                id: agentId,
                name: name,
                systemPrompt: promptTextarea.value.trim(),
                avatarC1: c1,
                avatarC2: c2,
                isPinned: false
            };
            STATE.agents.push(agent);
            STATE.agentChats[agentId] = { unread: 0, messages: [] };
        }
        
        // 处理头像上传
        const removeBtn = document.getElementById('agentEditRemoveAvatarBtn');
        const isRemoved = removeBtn.style.display === 'none';
        
        if (isRemoved) {
            agent.avatarImage = '';
            await saveMedia(agentId + '_avatar', null);
        } else if (tempAgentAvatarBlob) {
            await saveMedia(agentId + '_avatar', tempAgentAvatarBlob);
            agent.avatarImage = tempAgentAvatarUrl; // 当前页面生命周期的缓存
        }
        
        await saveAgents();
        await saveAgentChats();
        
        renderAgentList();
        
        overlay.style.display = 'none';
        overlay.dataset.editAgentId = '';`;

const replace = `        let agentId = overlay.dataset.editId;
        const isEdit = !!agentId;
        
        const c1 = '#667eea';
        const c2 = '#667eea'; // 强制单色
        
        let agent;
        if (isEdit) {
            agent = STATE.agents.find(a => a.id === agentId);
            if (!agent) return;
            agent.name = name;
            agent.systemPrompt = promptTextarea.value.trim();
            agent.avatarC1 = c1;
            agent.avatarC2 = c2;
            
            // 如果当前正在使用这个智能体，更新相关状态
            if (STATE.currentAgentId === agentId) {
                updateChatHeaderForAgent(agent);
                STATE.settings.avatarC1 = c1;
                STATE.settings.avatarC2 = c2;
                STATE.settings.systemPrompt = agent.systemPrompt;
                applyAvatar();
                saveSetting("settings", STATE.settings);
            }
        } else {
            agentId = 'agent_' + Date.now();
            agent = {
                id: agentId,
                name: name,
                systemPrompt: promptTextarea.value.trim(),
                avatarC1: c1,
                avatarC2: c2,
                isPinned: false
            };
            STATE.agents.push(agent);
            STATE.agentChats[agentId] = { unread: 0, messages: [] };
        }
        
        // 处理头像上传
        const removeBtn = document.getElementById('agentEditRemoveAvatarBtn');
        const isRemoved = removeBtn.style.display === 'none';
        
        if (isRemoved) {
            agent.avatarImage = '';
            await saveMedia(agentId + '_avatar', null);
            if (STATE.currentAgentId === agentId) {
                STATE.settings.avatarImage = '';
                applyAvatar();
                saveSetting("settings", STATE.settings);
            }
        } else if (tempAgentAvatarBlob) {
            await saveMedia(agentId + '_avatar', tempAgentAvatarBlob);
            agent.avatarImage = tempAgentAvatarUrl;
            if (STATE.currentAgentId === agentId) {
                STATE.settings.avatarImage = tempAgentAvatarUrl;
                applyAvatar();
                saveSetting("settings", STATE.settings);
            }
        }
        
        await saveAgents();
        await saveAgentChats();
        
        renderAgentList();
        
        overlay.style.display = 'none';
        overlay.dataset.editId = '';`;

if (js.includes('overlay.dataset.editAgentId')) {
    js = js.replace(search, replace);
    fs.writeFileSync('script.js', js);
    console.log("Patched dataset editId");
} else {
    console.log("Already patched or not found");
}