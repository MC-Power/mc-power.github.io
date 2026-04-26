// app.js
console.log('✅ app.js geladen');

const Logger = {
    log: function(msg) {
        const c = document.getElementById('debugConsole');
        if(c) {
            const t = new Date().toLocaleTimeString();
            c.innerHTML += `<div class="log-entry">[${t}] ${msg}</div>`;
            c.scrollTop = c.scrollHeight;
        }
    }
};

function bindEvents() {
    console.log('[App] Binde Events...');
    const btnAuth = document.getElementById('btnAuth');
    const btnLogout = document.getElementById('btnLogout');
    const authModal = document.getElementById('authModal');
    
    if(btnAuth) btnAuth.onclick = window.openAuthModal;
    if(btnLogout) btnLogout.onclick = window.doLogout;
    if(document.getElementById('authClose')) document.getElementById('authClose').onclick = window.closeAuthModal;
    if(document.getElementById('authToggle')) document.getElementById('authToggle').onclick = window.toggleAuthMode;
    if(document.getElementById('btnAuthSubmit')) document.getElementById('btnAuthSubmit').onclick = window.handleAuth;
    
    // Debug Toggle
    const dbgBtn = document.getElementById('toggleDebug');
    if(dbgBtn) dbgBtn.onclick = () => {
        const dc = document.getElementById('debugConsole');
        if(dc) dc.classList.toggle('visible');
    };
    
    // Keyboard
    document.addEventListener('keydown', (e) => {
        if(e.key.toLowerCase() === 'd') {
            const dc = document.getElementById('debugConsole');
            if(dc) dc.classList.toggle('visible');
        }
    });
}

async function init() {
    Logger.log('🎮 MC Power startet...');
    
    // Prüfe ob alle Funktionen da sind
    if(typeof window.initSupabaseClient !== 'function') {
        Logger.log('❌ FEHLER: initSupabaseClient nicht gefunden!');
        Logger.log('🔍 Mögliche Ursachen:');
        Logger.log('  1. supabase-client.js nicht gespeichert?');
        Logger.log('  2. Browser-Cache? Drücke STRG+F5!');
        Logger.log('  3. Syntax-Fehler in config.js?');
        alert('Fehler: supabase-client.js nicht geladen. Bitte STRG+F5 drücken!');
        return;
    }
    
    bindEvents();
    const ok = await window.initSupabaseClient();
    if(ok) {
        await window.checkSession();
        await window.loadLeaderboard();
        Logger.log('✅ Start erfolgreich');
    }
}

if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
