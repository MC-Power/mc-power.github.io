let supabase = null;
let isConnected = false;

async function initSupabaseClient() {
    console.log('[Supabase] Initialisiere...');
    try {
        if(typeof window.supabase === 'undefined') throw new Error('Supabase Library nicht geladen!');
        supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        console.log('[Supabase] Client erstellt');
        await testDatabaseConnection();
        isConnected = true;
        updateConnectionStatus('connected', 'Verbunden');
        console.log('[Supabase] ✅ Verbunden');
        return true;
    } catch(err) {
        console.error('[Supabase] ❌ Fehler:', err);
        updateConnectionStatus('disconnected', 'Fehler: ' + err.message);
        showBanner('Datenbank-Verbindung fehlgeschlagen: ' + err.message, 'error');
        return false;
    }
}

async function testDatabaseConnection() {
    console.log('[Supabase] Teste Verbindung...');
    const { data, error } = await supabase.from('players').select('count', { count: 'exact', head: true });
    if(error) {
        if(error.message.includes('does not exist')) throw new Error('Tabellen existieren nicht! Bitte SQL in Supabase ausführen.');
        throw error;
    }
    console.log('[Supabase] ✅ Datenbank-Test erfolgreich');
}

function updateConnectionStatus(status, text) {
    const el = document.getElementById('connectionStatus');
    if(!el) return;
    el.className = 'connection-status status-' + status;
    el.innerHTML = '<span>' + text + '</span>';
}

function showBanner(text, type) {
    const banner = document.getElementById('statusBanner');
    if(!banner) return;
    banner.className = 'status-banner ' + type + ' visible';
    banner.textContent = text;
    setTimeout(() => { banner.classList.remove('visible'); }, 5000);
}

console.log('[Supabase-Client] Geladen');
