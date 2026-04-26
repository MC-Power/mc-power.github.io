// supabase-client.js
console.log('✅ supabase-client.js wird geladen...');

// Globale Variablen explizit an window hängen
window.supabaseClient = null;
window.isConnected = false;

window.initSupabaseClient = async function() {
    console.log('[Supabase] initSupabaseClient() gestartet');
    try {
        if(typeof window.supabase === 'undefined') {
            throw new Error('Supabase Library fehlt! Prüfe Internet/CDN');
        }
        if(typeof CONFIG === 'undefined') {
            throw new Error('CONFIG nicht geladen! config.js prüfen');
        }
        
        window.supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        console.log('[Supabase] ✅ Client erstellt');
        
        // Test-Abfrage
        const { error } = await window.supabaseClient.from('players').select('count', { count: 'exact', head: true });
        if(error && error.message.includes('does not exist')) {
            throw new Error('Tabellen fehlen! SQL in Supabase ausführen');
        }
        if(error) throw error;
        
        window.isConnected = true;
        console.log('[Supabase] ✅ Verbunden');
        return true;
    } catch(err) {
        console.error('[Supabase] ❌ FEHLER:', err.message);
        alert('DB-Fehler: ' + err.message);
        return false;
    }
};

window.updateConnectionStatus = function(status, text) {
    const el = document.getElementById('connectionStatus');
    if(el) {
        el.className = 'connection-status status-' + status;
        el.innerHTML = '<span>' + text + '</span>';
    }
};

window.showBanner = function(text, type) {
    const banner = document.getElementById('statusBanner');
    if(banner) {
        banner.className = 'status-banner ' + type + ' visible';
        banner.textContent = text;
        setTimeout(() => banner.classList.remove('visible'), 5000);
    }
};

console.log('✅ supabase-client.js fertig geladen');
