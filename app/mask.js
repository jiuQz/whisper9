window.AppRegistry = window.AppRegistry || [];
window.AppRegistry.push({
    id: 'pageMask',
    html: `
                <div class="page page-mask page-app" id="pageMask">
                    <div class="page-header">
                        <button class="header-back-btn" id="backMask">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#007aff"/>
                            </svg>
                        </button>
                        <div class="header-center"><div class="header-name">假面</div></div>
                        <div style="width:36px"></div>
                    </div>
                    <div class="mask-scroll">
                        <div class="mask-stage">
                            <button class="mask-svg-btn" id="maskTrigger" aria-label="生成新身份">
                                <svg viewBox="0 0 200 110" width="180" height="100" class="mask-svg" id="maskSvg">
                                    <defs>
                                        <linearGradient id="maskGrad" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stop-color="#3a2a5e"/>
                                            <stop offset="50%" stop-color="#6c4ab6"/>
                                            <stop offset="100%" stop-color="#1a1a2e"/>
                                        </linearGradient>
                                        <linearGradient id="maskShine" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stop-color="rgba(255,255,255,0.45)"/>
                                            <stop offset="60%" stop-color="rgba(255,255,255,0)"/>
                                        </linearGradient>
                                    </defs>
                                    <!-- 眼罩面具主体（覆盖眼睛） -->
                                    <path d="M10,55 C10,30 40,15 70,18 C85,19 95,28 100,32 C105,28 115,19 130,18 C160,15 190,30 190,55 C190,72 175,90 150,90 C125,90 115,75 105,65 C102,62 98,62 95,65 C85,75 75,90 50,90 C25,90 10,72 10,55 Z" fill="url(#maskGrad)" stroke="#0c0c1c" stroke-width="2"/>
                                    <!-- 高光 -->
                                    <path d="M20,42 C30,28 55,22 75,26 C70,32 50,38 40,46 C32,52 24,52 20,42 Z" fill="url(#maskShine)" opacity="0.85"/>
                                    <path d="M125,26 C145,22 170,28 180,42 C176,52 168,52 160,46 C150,38 130,32 125,26 Z" fill="url(#maskShine)" opacity="0.85"/>
                                    <!-- 眼洞 -->
                                    <ellipse cx="55" cy="55" rx="18" ry="11" fill="#0a0a16"/>
                                    <ellipse cx="145" cy="55" rx="18" ry="11" fill="#0a0a16"/>
                                    <!-- 装饰小点 -->
                                    <circle cx="35" cy="40" r="1.6" fill="#ffd166"/>
                                    <circle cx="165" cy="40" r="1.6" fill="#ffd166"/>
                                    <circle cx="100" cy="32" r="2" fill="#ffd166"/>
                                </svg>
                            </button>
                            <div class="mask-tagline">出门在外身份都是自己给的</div>
                            <div class="mask-keyword-row">
                                <input type="text" id="maskKeywordInput" class="mask-keyword-input" placeholder="可选：关键词（例：东北/社恐/医生/穿越/特工）" maxlength="80"/>
                            </div>
                            <div class="mask-hint" id="maskHint">点击面具，戴上一张全新的脸</div>
                        </div>

                        <div class="mask-result" id="maskResult" hidden>
                            <div class="mask-result-card">
                                <div class="mask-result-row">
                                    <span class="mask-result-label">姓名</span>
                                    <span class="mask-result-value" id="maskRName">-</span>
                                </div>
                                <div class="mask-result-row">
                                    <span class="mask-result-label">性别</span>
                                    <span class="mask-result-value" id="maskRGender">-</span>
                                </div>
                                <div class="mask-result-row">
                                    <span class="mask-result-label">年龄</span>
                                    <span class="mask-result-value" id="maskRAge">-</span>
                                </div>
                                <div class="mask-result-row">
                                    <span class="mask-result-label">职业</span>
                                    <span class="mask-result-value" id="maskRIdentity">-</span>
                                </div>
                                <div class="mask-result-row mask-result-row-block">
                                    <span class="mask-result-label">身份背景</span>
                                    <span class="mask-result-value" id="maskRBackground">-</span>
                                </div>
                                <div class="mask-result-row mask-result-row-block">
                                    <span class="mask-result-label">性格</span>
                                    <span class="mask-result-value" id="maskRPersonality">-</span>
                                </div>
                            </div>
                            <div class="mask-result-actions">
                                <button class="mask-btn mask-btn-secondary" id="maskCopyBtn">复制</button>
                                <button class="mask-btn mask-btn-primary" id="maskRegenBtn">再来一张</button>
                            </div>
                        </div>
                    </div>
                </div>
    `,
    init: function() {
        const $ = (id) => document.getElementById(id);
        const pageEl = () => document.getElementById('pageMask');
        let isGenerating = false;

        // ====== 事件绑定 ======
        const backBtn = $('backMask');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (typeof closeApp === 'function') closeApp();
            });
        }

        const trigger = $('maskTrigger');
        if (trigger) {
            trigger.addEventListener('click', () => onGenerate());
        }

        const regenBtn = $('maskRegenBtn');
        if (regenBtn) regenBtn.addEventListener('click', () => onGenerate());

        const copyBtn = $('maskCopyBtn');
        if (copyBtn) copyBtn.addEventListener('click', () => onCopy());

        // ====== 主流程：强制走 LLM，失败显示错误而不静默回退 ======
        async function onGenerate() {
            if (isGenerating) return;
            isGenerating = true;
            startMaskAnim(true);
            setHint('正在为你戴上面具…');

            const kw = (($('maskKeywordInput') || {}).value || '').trim();

            try {
                if (typeof callLLM !== 'function') {
                    throw new Error('未检测到 LLM 接口（callLLM 不可用），请先在设置里配置 API。');
                }
                const identity = await tryLLM(kw);
                if (!identity || !identity.name) {
                    throw new Error('LLM 返回内容无法解析，请稍后重试。');
                }
                renderResult(identity);
                setHint('喜欢就留下，不喜欢再戴一张');
            } catch (err) {
                console.error('[Mask] 生成失败：', err);
                const msg = (err && err.message) ? err.message : '生成失败，请稍后重试';
                setHint('✕ ' + msg);
                if (typeof showToast === 'function') {
                    showToast(msg, 1800);
                }
            } finally {
                startMaskAnim(false);
                isGenerating = false;
            }
        }

        function setHint(text) {
            const h = $('maskHint');
            if (h) h.textContent = text;
        }

        function startMaskAnim(active) {
            const svg = $('maskSvg');
            if (!svg) return;
            if (active) {
                svg.classList.add('mask-svg-spin');
            } else {
                svg.classList.remove('mask-svg-spin');
            }
        }

        // ====== LLM 调用（复用全局 callLLM + 摇一摇 API 配置） ======
        async function tryLLM(keyword) {
            const seed = Math.random().toString(36).slice(2, 10);
            const hasKw = !!keyword;

            // 系统设定：让模型自己解析关键词语义并据此构建整个人设
            const systemPrompt = `你是一个"假面身份生成器"。任务：为用户生成一张临时身份卡，用来出门在外蒙混身份。

【核心原则】
1. 你必须自己理解用户给的关键词的语义、风格、场景、文化背景，并据此自动调整整个人设的所有字段（不仅仅是塞进背景里）。
2. 关键词可能是：
   - 地域（东北/上海/广东/重庆/日本/纽约……）→ 影响姓名风格、口音习惯、地点描写、性格底色。
   - 职业（医生/程序员/警察/特工/流浪歌手/僧人……）→ 直接决定 identity 字段，并让背景围绕这个职业展开。
   - 性格标签（社恐/i 人/暴躁/阳光/抑郁……）→ 直接体现在 personality，并让背景里发生过对应的人生事件。
   - 类型词（穿越/重生/末日/赛博朋克/玄幻/校园……）→ 这种情况说明用户想要超出现实的设定，那就放飞一点，不要再受"必须真实普通人"的约束。
   - 具体人物或作品（哈利波特/福尔摩斯/林黛玉……）→ 不要照抄原 IP，但可以借用气质和世界观感觉。
   - 多个词混用（"东北 + 社恐 + 程序员"）→ 必须全部体现。
3. 不要生硬贴标签，也不要在背景里出现"关键词是 XXX"这种元叙述。读者读完应该能感觉到关键词的影响，但说不出具体在哪一句。
4. 没有关键词时（用户留空），请纯随机生成一个真实普通人。

【输出要求】
- 只输出一个 JSON 对象，不要 markdown，不要解释，不要前后多余文字。
- 字段必须严格如下，且都必须为非空字符串：
{
  "name": "姓名",
  "gender": "性别，从这五项里挑一项：男性 / 女性 / 中性 / 非二元 / 不愿透露",
  "age": "年龄，写阿拉伯数字，如 '24'、'31'、'52'。如果是穿越/古代/末日等设定可放宽到 14~99",
  "identity": "职业或社会身份，一句话且具体（'急诊科护士' 而不是 '医生'）",
  "background": "身份背景，140~240 字，连贯小段落。要包含：①出生/成长地，②家庭情况，③学历或人生关键节点，④目前在哪里、过着什么样的日子，⑤一个不太愿意被提起的小秘密或隐情，⑥当下的目标或牵挂。语气克制不煽情，不要写成简历，要像一个朋友在背后悄悄给你介绍ta。",
  "personality": "性格，40 字以内，具体生活化，例如'慢热但回消息认真，吐槽人但从不针对人'，避免空泛标签"
}

【硬性禁忌】
- 没有"穿越/重生/末日/玄幻"等明确类型关键词时，绝不要写超能力、奇幻、重生、霸道总裁、顶流明星、豪门继承人、特工、退役佣兵、隐藏富豪等设定。
- 不要使用网文模板名（林风/苏苏/顾北辰/沈清辞/陆沉/傅寒洲/夜白/慕容/上官）。
- 背景与职业必须自洽，不能职业是护士但背景在写电竞战队。`;

            const userPrompt = hasKw
                ? `【随机种子（请基于此产生差异化结果）】\n${seed}\n\n【用户关键词】\n${keyword}\n\n请理解关键词语义，并据此构建一整套自洽的人设。直接输出 JSON。`
                : `【随机种子（请基于此产生差异化结果）】\n${seed}\n\n【关键词】\n（无，请纯随机）\n\n直接输出 JSON。`;

            const overrides = (typeof getShakeApiOverrides === 'function')
                ? { ...(getShakeApiOverrides() || {}), temperature: 1.15, top_p: 0.95, max_tokens: 1200 }
                : { temperature: 1.15, top_p: 0.95, max_tokens: 1200 };

            const raw = await callLLM([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ], overrides);
            return parseLLM(raw);
        }

        function parseLLM(raw) {
            if (!raw || typeof raw !== 'string') return null;
            let txt = raw.trim();
            // 去 markdown 代码块
            txt = txt.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/g, '').trim();
            const m = txt.match(/\{[\s\S]*\}/);
            if (!m) return null;
            try {
                const obj = JSON.parse(m[0]);
                const name = String(obj.name || obj.姓名 || '').trim();
                const gender = String(obj.gender || obj.性别 || '').trim();
                const ageRaw = String(obj.age || obj.年龄 || '').trim();
                const identity = String(obj.identity || obj.身份 || obj.职业 || obj.role || '').trim();
                const background = String(obj.background || obj.身份背景 || obj.背景 || obj.story || '').trim();
                const personality = String(obj.personality || obj.性格 || '').trim();
                if (!name || !gender || !identity || !personality || !background) return null;
                // age 容错：抓数字
                let age = ageRaw;
                const ageMatch = ageRaw.match(/\d{1,3}/);
                if (ageMatch) age = ageMatch[0];
                if (!age) age = String(18 + Math.floor(Math.random() * 25));
                return {
                    name: name.slice(0, 24),
                    gender: gender.slice(0, 16),
                    age: age.slice(0, 4),
                    identity: identity.slice(0, 40),
                    background: background.slice(0, 500),
                    personality: personality.slice(0, 80)
                };
            } catch (e) {
                return null;
            }
        }

        // ====== 渲染结果 ======
        let lastIdentity = null;
        function renderResult(idn) {
            lastIdentity = idn;
            const result = $('maskResult');
            if (!result) return;
            result.hidden = false;
            const setText = (id, val) => { const el = $(id); if (el) el.textContent = val || '-'; };
            setText('maskRName', idn.name);
            setText('maskRGender', idn.gender);
            setText('maskRAge', idn.age ? `${idn.age} 岁` : '-');
            setText('maskRIdentity', idn.identity);
            setText('maskRBackground', idn.background);
            setText('maskRPersonality', idn.personality);
            // 滚到结果卡片
            const scroll = pageEl() && pageEl().querySelector('.mask-scroll');
            if (scroll) {
                setTimeout(() => {
                    scroll.scrollTo({ top: scroll.scrollHeight, behavior: 'smooth' });
                }, 120);
            }
        }

        function onCopy() {
            if (!lastIdentity) return;
            const txt =
                `姓名：${lastIdentity.name}\n` +
                `性别：${lastIdentity.gender}\n` +
                `年龄：${lastIdentity.age || '-'}\n` +
                `职业：${lastIdentity.identity}\n` +
                `身份背景：${lastIdentity.background || '-'}\n` +
                `性格：${lastIdentity.personality}`;
            const done = () => {
                if (typeof showToast === 'function') showToast('已复制到剪贴板', 1200);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
            } else {
                fallbackCopy(txt, done);
            }
        }
        function fallbackCopy(text, cb) {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                if (cb) cb();
            } catch (e) {
                if (typeof showToast === 'function') showToast('复制失败', 1200);
            }
        }
    }
});