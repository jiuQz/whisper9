const fs = require('fs');

// Fix chatSettings.js
let cs = fs.readFileSync('app/chatSettings.js', 'utf8');
cs = cs.replace("if (typeof closeApp === 'function') closeApp('pageChatSettings');", "if (typeof goBackToChat === 'function') { goBackToChat(); } else if (typeof closeApp === 'function') { closeApp('pageChatSettings'); }");
fs.writeFileSync('app/chatSettings.js', cs, 'utf8');

// Fix uchat.js backAgents to use history.back() because script.js uses history.back() for it (or wait, script.js overrides it?).
let uchat = fs.readFileSync('app/uchat.js', 'utf8');
// In uchat.js, backAgents calls closeApp('pageAgents'). 
// In script.js, backAgents calls history.back() (or wait, does it? "if ($('backAgents')) $('backAgents').addEventListener('click', () => { history.back(); })"). Let's check.
// I will just let script.js handle backAgents and closeChat if it's there. Actually, let's keep it simple.
// I will remove the duplicate bindings from script.js
let scriptjs = fs.readFileSync('script.js', 'utf8');
scriptjs = scriptjs.replace("$('closeChat').addEventListener('click', closeApp);", "// $('closeChat').addEventListener('click', closeApp);");
scriptjs = scriptjs.replace("$('backSettings').addEventListener('click', closeApp);", "// $('backSettings').addEventListener('click', closeApp);");
scriptjs = scriptjs.replace("$('backTheme').addEventListener('click', closeApp);", "// $('backTheme').addEventListener('click', closeApp);");
scriptjs = scriptjs.replace("$('backChatSettings').addEventListener('click', goBackToChat);", "// $('backChatSettings').addEventListener('click', goBackToChat);");
scriptjs = scriptjs.replace("$('backMusic').addEventListener('click', closeApp);", "// $('backMusic').addEventListener('click', closeApp);");
scriptjs = scriptjs.replace("$('backSafari').addEventListener('click', closeApp);", "// $('backSafari').addEventListener('click', closeApp);");
scriptjs = scriptjs.replace("$('backWeather').addEventListener('click', closeApp);", "// $('backWeather').addEventListener('click', closeApp);");
scriptjs = scriptjs.replace("$('backNotes').addEventListener('click', closeApp);", "// $('backNotes').addEventListener('click', closeApp);");
scriptjs = scriptjs.replace("$('backClock').addEventListener('click', closeApp);", "// $('backClock').addEventListener('click', closeApp);");

// Let's also fix uchat.js init function so it matches the old behavior.
uchat = uchat.replace(
    "if (typeof closeApp === 'function') closeApp('pageChat');",
    "if (typeof closeApp === 'function') closeApp();"
);
uchat = uchat.replace(
    "if (typeof closeApp === 'function') closeApp('pageAgents');",
    "if (typeof history !== 'undefined') history.back(); else if (typeof closeApp === 'function') closeApp();"
);

fs.writeFileSync('app/uchat.js', uchat, 'utf8');
fs.writeFileSync('script.js', scriptjs, 'utf8');
console.log('Cleanup finished.');