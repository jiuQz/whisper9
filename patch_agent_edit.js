const fs = require('fs');

// 1. Fix CSS (blue outline and letter avatar)
let css = fs.readFileSync('styles.css', 'utf8');
if (!css.includes('-webkit-tap-highlight-color: transparent')) {
    css = `* {
    outline: none;
    -webkit-tap-highlight-color: transparent;
}\n` + css;
}
// 隐藏头像中的文字
if (!css.includes('.agent-avatar span { display: none; }')) {
    css += `\n.agent-avatar span { display: none; }\n`;
}
fs.writeFileSync('styles.css', css);

// 2. Fix index.html (Avatar upload in Edit Dialog)
let html = fs.readFileSync('index.html', 'utf8');
const searchHTML = `<div class="agent-edit-field">
                                <label class="agent-edit-label">头像颜色</label>
                                <div class="agent-avatar-colors" id="agentAvatarColors">
                                    <div class="agent-acolor active" style="--c1:#667eea;--c2:#764ba2" data-c1="#667eea" data-c2="#764ba2"></div>
                                    <div class="agent-acolor" style="--c1:#4facfe;--c2:#00f2fe" data-c1="#4facfe" data-c2="#00f2fe"></div>
                                    <div class="agent-acolor" style="--c1:#43e97b;--c2:#38f9d7" data-c1="#43e97b" data-c2="#38f9d7"></div>
                                    <div class="agent-acolor" style="--c1:#fa709a;--c2:#fee140" data-c1="#fa709a" data-c2="#fee140"></div>
                                    <div class="agent-acolor" style="--c1:#f093fb;--c2:#f5576c" data-c1="#f093fb" data-c2="#f5576c"></div>
                                    <div class="agent-acolor" style="--c1:#ff9a9e;--c2:#fecfef" data-c1="#ff9a9e" data-c2="#fecfef"></div>
                                    <div class="agent-acolor" style="--c1:#a18cd1;--c2:#fbc2eb" data-c1="#a18cd1" data-c2="#fbc2eb"></div>
                                    <div class="agent-acolor" style="--c1:#ffd60a;--c2:#ffb800" data-c1="#ffd60a" data-c2="#ffb800"></div>
                                </div>
                            </div>`;
const replaceHTML = `<div class="agent-edit-field">
                                <label class="agent-edit-label">头像</label>
                                <div class="agent-avatar-colors" id="agentAvatarColors" style="display:flex; align-items:center; gap:10px;">
                                    <div class="agent-acolor active" style="--c1:#667eea;--c2:#667eea" data-c1="#667eea" data-c2="#667eea" id="agentEditColorPreview"></div>
                                    <div id="agentEditAvatarPreview" style="display:none; width:36px; height:36px; border-radius:50%; background-size:cover; background-position:center; border:2px solid #007aff;"></div>
                                    <button class="agent-edit-btn" id="agentEditUploadBtn" style="width:auto; padding:0 12px; margin:0;">上传头像</button>
                                    <input type="file" id="agentEditAvatarFile" accept="image/*" style="display:none">
                                    <button class="agent-edit-btn cancel" id="agentEditRemoveAvatarBtn" style="display:none; width:auto; padding:0 12px; margin:0;">移除</button>
                                </div>
                            </div>`;
html = html.replace(searchHTML, replaceHTML);
fs.writeFileSync('index.html', html);

// 3. Fix script.js logic for upload and font-less rendering
let js = fs.readFileSync('script.js', 'utf8');

// Replace render text inside avatar (just in case CSS isn't enough, but CSS is enough)
// Let's add the upload logic into script.js
const appendJS = `
// 自定义头像逻辑
let tempAgentAvatarBlob = null;
let tempAgentAvatarUrl = '';

function setupAgentEditAvatar() {
    const uploadBtn = document.getElementById('agentEditUploadBtn');
    const fileInput = document.getElementById('agentEditAvatarFile');
    const preview = document.getElementById('agentEditAvatarPreview');
    const colorPreview = document.getElementById('agentEditColorPreview');
    const removeBtn = document.getElementById('agentEditRemoveAvatarBtn');
    
    if(!uploadBtn) return;
    
    // 防止重复绑定
    if(uploadBtn.dataset.bound === '1') return;
    uploadBtn.dataset.bound = '1';
    
    uploadBtn.addEventListener('click', (e) => {
        e.preventDefault(); // 防止触发表单或其他事件
        fileInput.click();
    });
    
    removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        tempAgentAvatarBlob = null;
        if(tempAgentAvatarUrl) {
            URL.revokeObjectURL(tempAgentAvatarUrl);
            tempAgentAvatarUrl = '';
        }
        preview.style.display = 'none';
        colorPreview.style.display = 'block';
        removeBtn.style.display = 'none';
    });
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        
        try {
            const blob = await compressImage(file);
            tempAgentAvatarBlob = blob;
            if(tempAgentAvatarUrl) URL.revokeObjectURL(tempAgentAvatarUrl);
            tempAgentAvatarUrl = URL.createObjectURL(blob);
            
            preview.style.backgroundImage = \`url(\${tempAgentAvatarUrl})\`;
            preview.style.display = 'block';
            colorPreview.style.display = 'none';
            removeBtn.style.display = 'block';
        } catch(err) {
            console.error("压缩图片失败", err);
            showToast("图片处理失败");
        }
    });
}

// 拦截 openAgentEditOverlay 加入重置逻辑
const originalOpenAgentEditOverlay = openAgentEditOverlay;
openAgentEditOverlay = function(agent, mode) {
    setupAgentEditAvatar();
    
    // 重置临时头像状态
    tempAgentAvatarBlob = null;
    if(tempAgentAvatarUrl) {
        URL.revokeObjectURL(tempAgentAvatarUrl);
        tempAgentAvatarUrl = '';
    }
    
    const preview = document.getElementById('agentEditAvatarPreview');
    const colorPreview = document.getElementById('agentEditColorPreview');
    const removeBtn = document.getElementById('agentEditRemoveAvatarBtn');
    const fileInput = document.getElementById('agentEditAvatarFile');
    
    if(fileInput) fileInput.value = '';
    
    if(agent && agent.avatarImage) {
        preview.style.backgroundImage = \`url(\${agent.avatarImage})\`;
        preview.style.display = 'block';
        colorPreview.style.display = 'none';
        removeBtn.style.display = 'block';
    } else {
        preview.style.backgroundImage = 'none';
        preview.style.display = 'none';
        colorPreview.style.display = 'block';
        removeBtn.style.display = 'none';
    }
    
    originalOpenAgentEditOverlay(agent, mode);
};

// 重写 agentEditConfirm 的保存逻辑
const origAgentEditConfirm = document.getElementById('agentEditConfirm');
if(origAgentEditConfirm) {
    const newConfirm = origAgentEditConfirm.cloneNode(true);
    origAgentEditConfirm.parentNode.replaceChild(newConfirm, origAgentEditConfirm);
    
    newConfirm.addEventListener('click', async () => {
        const nameInput = document.getElementById('agentEditName');
        const promptTextarea = document.getElementById('agentEditPrompt');
        const overlay = document.getElementById('agentEditOverlay');
        
        const name = nameInput.value.trim();
        if (!name) { showToast('名称不能为空'); return; }
        
        let agentId = overlay.dataset.editAgentId;
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
            await deleteMedia(agentId + '_avatar');
        } else if (tempAgentAvatarBlob) {
            await saveMedia(agentId + '_avatar', tempAgentAvatarBlob);
            agent.avatarImage = tempAgentAvatarUrl; // 当前页面生命周期的缓存
        }
        
        await saveAgents();
        await saveAgentChats();
        
        renderAgentList();
        
        overlay.style.display = 'none';
        overlay.dataset.editAgentId = '';
    });
}
`;
if(!js.includes('tempAgentAvatarBlob')) {
    js += appendJS;
}
fs.writeFileSync('script.js', js);
console.log("Patched UI");