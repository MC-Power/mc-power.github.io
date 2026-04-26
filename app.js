// app.js
// Haupt-Datei für Initialisierung, Events und Admin-Logik

console.log('✅ app.js geladen');

// Logger für Debug-Konsole
const Logger = {
    log: function(msg, type = 'info') {
        const c = document.getElementById('debugConsole');
        if (c) {
            const t = new Date().toLocaleTimeString();
            const color = type === 'error' ? 'red' : type === 'success' ? '#0f0' : '#fff';
            c.innerHTML += `<div style="color:${color}">[${t}] ${msg}</div>`;
            c.scrollTop = c.scrollHeight;
        }
        console.log(`[APP] ${msg}`);
    }
};

// Event Listener binden
function bindEvents() {
    console.log('[App] Binde Events...');
    
    // Buttons
    const btnAuth = document.getElementById('btnAuth');
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const authModal = document.getElementById('authModal');
    const authClose = document.getElementById('authClose');
    const authToggle = document.getElementById('authToggle');
    const btnAuthSubmit = document.getElementById('btnAuthSubmit');
    const btnOpenAuth = document.getElementById('btnOpenAuth'); // Falls vorhanden
    const toggleDebug = document.getElementById('toggleDebug');

    if (btnLogin) btnLogin.onclick = window.openAuthModal || openAuth;
    if (btnLogout) btnLogout.onclick = window.doLogout || doLogout;
    if (authClose) authClose.onclick = window.closeAuthModal || closeAuth;
    if (authToggle) authToggle.onclick = window.toggleAuthMode || toggleAuthMode;
    if (btnAuthSubmit) btnAuthSubmit.onclick = window.handleAuth || handleAuth;
    if (btnOpenAuth) btnOpenAuth.onclick = window.openAuthModal || openAuth;

    // Debug Toggle
    if (toggleDebug) {
        toggleDebug.onclick = () => {
            const dc = document.getElementById('debugConsole');
            if (dc) dc.classList.toggle('visible');
        };
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'd') {
            const dc = document.getElementById('debugConsole');
            if (dc) dc.classList.toggle('visible');
        }
        if (e.key === 'Escape') {
            if (window.closeAuthModal) window.closeAuthModal();
        }
    });

    // Enter-Taste in Inputs
    const inpUser = document.getElementById('inpUser');
    const inpPass = document.getElementById('inpPass');
    if (inpUser) inpUser.onkeypress = (e) => { if (e.key === 'Enter') inpPass?.focus(); };
    if (inpPass) inpPass.onkeypress = (e) => { if (e.key === 'Enter') (window.handleAuth || handleAuth)(); };
    
    // Modal schließen beim Klick außerhalb
    if (authModal) {
        authModal.onclick = (e) => { if (e.target === authModal) (window.closeAuthModal || closeAuth)(); };
    }
}

// Haupt-Initialisierung
async function init() {
    Logger.log('🎮 MC Power App startet...', 'info');

    // Prüfen ob Abhängigkeiten geladen sind
    if (typeof window.supabase === 'undefined') {
        Logger.log('❌ FEHLER: Supabase Library nicht geladen!', 'error');
        return;
    }
    if (typeof CONFIG === 'undefined') {
        Logger.log('❌ FEHLER: Config nicht geladen!', 'error');
        return;
    }

    // Supabase Client initialisieren (aus supabase-client.js)
    if (typeof window.initSupabaseClient === 'function') {
        const connected = await window.initSupabaseClient();
        if (!connected) {
            Logger.log('❌ DB Verbindung fehlgeschlagen', 'error');
            return;
        }
    } else {
        // Fallback wenn keine separate Datei
        window.supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        Logger.log('✅ Supabase Client direkt erstellt', 'success');
    }

    bindEvents();
    generateTierOptions(); // Admin Dropdown füllen
    
    // Session prüfen und Leaderboard laden
    if (typeof window.checkSession === 'function') {
        await window.checkSession();
    } else {
        await checkSession(); // Lokaler Fallback
    }

    if (typeof window.loadLeaderboard === 'function') {
        await window.loadLeaderboard();
    } else {
        await loadLeaderboard(); // Lokaler Fallback
    }

    Logger.log('✅ App Initialisierung abgeschlossen', 'success');
}

// ===== ADMIN FUNKTIONEN (Hier war der Fehler!) =====

// Tier-Optionen für Admin-Panel generieren
function generateTierOptions() {
    const sel = document.getElementById('admTier');
    if (!sel) return;
    sel.innerHTML = '';
    for (let i = 10; i >= 1; i--) {
        sel.innerHTML += `<option value="LP${i}">LP${i}</option>`;
        sel.innerHTML += `<option value="HP${i}">HP${i}</option>`;
    }
}

// Nachricht im Admin-Panel anzeigen
function showAdminMsg(txt, ok) {
    const el = document.getElementById('adminMsg');
    if (el) {
        el.textContent = txt;
        el.className = 'msg show ' + (ok ? 'ok' : 'err');
        setTimeout(() => el.classList.remove('show'), 3000);
    }
}

// SPIELER SPEICHERN (Repariert)
async function savePlayer() {
    Logger.log('💾 Versuche Spieler zu speichern...', 'info');
    
    const name = document.getElementById('admName')?.value.trim();
    const region = document.getElementById('admRegion')?.value;
    const mode = document.getElementById('admMode')?.value;
    const points = parseInt(document.getElementById('admPoints')?.value) || 0;
    const tier = document.getElementById('admTier')?.value;
    const role = document.getElementById('admRole')?.value;
    
    if (!name) {
        showAdminMsg('❌ Name ist erforderlich!', false);
        return;
    }
    
    const btn = document.querySelector('.admin-card .btn-success');
    if(btn) { btn.disabled = true; btn.textContent = 'Speichere...'; }

    try {
        const client = window.supabaseClient || window.sb;
        if (!client) throw new Error('Supabase Client nicht verfügbar');

        // 1. Prüfen ob Spieler in DB existiert
        const { data: existingPlayer, error: searchError } = await client
            .from('players')
            .select('id')
            .eq('username', name)
            .single();
            
        if (searchError && searchError.code !== 'PGRST116') { // PGRST116 = Nicht gefunden (ist okay)
            throw searchError;
        }

        let playerId;

        if (existingPlayer && existingPlayer.id) {
            // Spieler existiert -> Update
            playerId = existingPlayer.id;
            Logger.log(`Spieler ${name} existiert bereits (ID: ${playerId}). Update...`, 'info');
            
            const { error: updateError } = await client
                .from('players')
                .update({ 
                    display_name: name,
                    region: region,
                    role: role 
                })
                .eq('id', playerId);
            
            if (updateError) throw updateError;
        } else {
            // Spieler existiert nicht -> Insert
            Logger.log(`Spieler ${name} neu anlegen...`, 'info');
            
            const { data: newPlayer, error: insertError } = await client
                .from('players')
                .insert([{
                    username: name,
                    display_name: name,
                    region: region,
                    role: role
                }])
                .select('id')
                .single();
            
            if (insertError) throw insertError;
            if (!newPlayer || !newPlayer.id) throw new Error('Keine ID zurückgegeben');
            
            playerId = newPlayer.id;
            Logger.log(`Spieler erstellt mit ID: ${playerId}`, 'success');
        }

        // 2. Leaderboard Eintrag upserten
        Logger.log(`Leaderboard Eintrag für ${name} schreiben...`, 'info');
        const { error: lbError } = await client
            .from('leaderboard')
            .upsert({
                player_id: playerId,
                gamemode: mode,
                points: points,
                tier: tier
            }, {
                onConflict: 'player_id,gamemode'
            });
        
        if (lbError) throw lbError;

        showAdminMsg('✅ Erfolgreich gespeichert!', true);
        
        // Formular leeren
        document.getElementById('admName').value = '';
        document.getElementById('admPoints').value = '0';
        
        // Listen aktualisieren
        if (typeof window.loadLeaderboard === 'function') await window.loadLeaderboard();
        if (typeof window.loadAllPlayers === 'function') await window.loadAllPlayers();

    } catch (err) {
        Logger.log('❌ Fehler beim Speichern: ' + err.message, 'error');
        showAdminMsg('❌ ' + err.message, false);
    } finally {
        if(btn) { btn.disabled = false; btn.textContent = '💾 Speichern'; }
    }
}

// ===== FALLBACK FUNKTIONEN (Falls externe Dateien fehlen) =====
// Diese werden nur genutzt, wenn auth.js oder leaderboard.js nicht geladen sind.

function openAuth() {
    const m = document.getElementById('authModal');
    if(m) m.classList.add('show');
}
function closeAuth() {
    const m = document.getElementById('authModal');
    if(m) m.classList.remove('show');
}
function toggleAuthMode() {
    const t = document.getElementById('authToggle');
    const btn = document.getElementById('btnAuth');
    const title = document.getElementById('authTitle');
    // Einfacher Toggle Logik
    const isLogin = btn.textContent.includes('Einloggen') || btn.textContent === 'Los'; // Vereinfacht
    // Hier müsste man den Status speichern, aber wir verlassen uns auf auth.js
    console.log('Auth Toggle geklickt (Fallback)');
}

async function checkSession() {
    try {
        const client = window.supabaseClient || window.sb;
        if(!client) return;
        const { data: { session } } = await client.auth.getSession();
        if (session?.user) {
            window.currentUser = session.user;
            if(window.applyAuthState) window.applyAuthState();
        }
    } catch(e) {}
}

async function loadLeaderboard() {
    try {
        const client = window.supabaseClient || window.sb;
        if(!client) return;
        const { data } = await client.from('leaderboard').select('*, players(*)').order('points', { ascending: false }).limit(250);
        // Render Logik hier vereinfacht, normalerweise in leaderboard.js
        console.log('Leaderboard Daten geladen:', data?.length);
    } catch(e) {}
}

// Starten wenn DOM bereit ist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
