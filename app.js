const Logger = { log(msg) { const console = document.getElementById('debugConsole'); if(!console) return; const time = new Date().toLocaleTimeString(); console.innerHTML += `<div class="log-entry log-info">[${time}] ${msg}</div>`; console.scrollTop = console.scrollHeight; } };

function bindEvents() {
    console.log('[App] Binde Events...');
    document.getElementById('btnAuth').addEventListener('click', openAuthModal);
    document.getElementById('btnLogout').addEventListener('click', doLogout);
    document.getElementById('authClose').addEventListener('click', closeAuthModal);
    document.getElementById('authToggle').addEventListener('click', toggleAuthMode);
    document.getElementById('btnAuthSubmit').addEventListener('click', handleAuth);
    document.getElementById('inpUser').addEventListener('keypress', (e) => { if(e.key === 'Enter') document.getElementById('inpPass').focus(); });
    document.getElementById('inpPass').addEventListener('keypress', (e) => { if(e.key === 'Enter') handleAuth(); });
    document.getElementById('authModal').addEventListener('click', (e) => { if(e.target.id === 'authModal') closeAuthModal(); });
    document.getElementById('toggleDebug').addEventListener('click', () => { document.getElementById('debugConsole').classList.toggle('visible'); });
    document.addEventListener('keydown', (e) => { if(e.key.toLowerCase() === 'd' && e.target.tagName !== 'INPUT') { e.preventDefault(); document.getElementById('debugConsole').classList.toggle('visible'); } if(e.key === 'Escape') closeAuthModal(); });
    console.log('[App] ✅ Events gebunden');
}

async function init() {
    console.log('[App] 🎮 MC Power startet...');
    Logger.log('App startet...');
    try {
        bindEvents();
        const connected = await initSupabaseClient();
        if(connected) { await checkSession(); await loadLeaderboard(); Logger.log('✅ Initialisierung abgeschlossen'); showBanner('Willkommen bei MC Power!', 'success'); }
    } catch(err) { console.error('[App] ❌ Fataler Fehler:', err); Logger.log('❌ Fehler: ' + err.message); showBanner('Kritischer Fehler: ' + err.message, 'error'); }
}

if(document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
console.log('[App] Geladen');
