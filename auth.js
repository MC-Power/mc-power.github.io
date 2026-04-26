let currentUser = null;
let userRole = 'guest';
let isLoginMode = true;

function openAuthModal() {
    document.getElementById('authModal').classList.add('active');
    document.getElementById('authMsg').className = 'status-msg';
    document.getElementById('inpUser').value = '';
    document.getElementById('inpPass').value = '';
    document.getElementById('inpUser').focus();
    console.log('[Auth] Modal geöffnet');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
    console.log('[Auth] Modal geschlossen');
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').textContent = isLoginMode ? '🔐 Anmelden' : '📝 Registrieren';
    document.getElementById('btnAuthSubmit').textContent = isLoginMode ? 'Anmelden' : 'Registrieren';
    document.getElementById('authToggle').textContent = isLoginMode ? 'Noch kein Account? Registrieren' : 'Bereits Account? Anmelden';
    document.getElementById('authMsg').className = 'status-msg';
    console.log('[Auth] Mode:', isLoginMode ? 'LOGIN' : 'REGISTER');
}

function showAuthMessage(text, type) {
    const el = document.getElementById('authMsg');
    el.className = 'status-msg ' + type + ' visible';
    el.textContent = text;
    console.log('[Auth]', type.toUpperCase(), text);
}

async function handleAuth() {
    const username = document.getElementById('inpUser').value.trim();
    const password = document.getElementById('inpPass').value;
    console.log('[Auth] Versuch:', username);
    if(!username || !password) { showAuthMessage('❌ Bitte alle Felder ausfüllen', 'error'); return; }
    if(!isLoginMode && password.length < 6) { showAuthMessage('❌ Passwort mind. 6 Zeichen', 'error'); return; }
    
    const btn = document.getElementById('btnAuthSubmit');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = isLoginMode ? 'Anmelden...' : 'Registriere...';
    
    try {
        const email = username.toLowerCase() + '@mcpower.local';
        if(isLoginMode) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if(error) throw error;
            console.log('[Auth] ✅ Login erfolgreich');
            await onAuthSuccess(data.user);
            showAuthMessage('✅ Erfolgreich eingeloggt!', 'success');
            setTimeout(closeAuthModal, 1000);
        } else {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if(error) throw error;
            if(data.user) {
                await supabase.from('players').insert([{ user_id: data.user.id, username: username, display_name: username, role: 'player', region: 'DE' }]);
                console.log('[Auth] ✅ Spieler erstellt');
            }
            showAuthMessage('✅ Registriert! Bitte einloggen.', 'success');
            isLoginMode = true;
            toggleAuthMode();
        }
    } catch(err) {
        console.error('[Auth] ❌ Fehler:', err);
        let msg = err.message;
        if(msg.includes('Invalid login')) msg = '❌ Falsche Zugangsdaten';
        if(msg.includes('User already registered')) msg = '❌ Account existiert bereits';
        showAuthMessage(msg, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function onAuthSuccess(user) {
    currentUser = user;
    console.log('[Auth] User:', user.email);
    document.getElementById('btnAuth').classList.add('hidden');
    document.getElementById('btnLogout').classList.remove('hidden');
    try {
        const { data } = await supabase.from('players').select('role').eq('user_id', user.id).single();
        userRole = data?.role || 'player';
        console.log('[Auth] Rolle:', userRole);
    } catch(err) { console.warn('[Auth] Rolle laden fehlgeschlagen'); userRole = 'player'; }
    if(window.loadLeaderboard) await loadLeaderboard();
}

async function doLogout() {
    console.log('[Auth] Logout...');
    await supabase.auth.signOut();
    currentUser = null;
    userRole = 'guest';
    document.getElementById('btnAuth').classList.remove('hidden');
    document.getElementById('btnLogout').classList.add('hidden');
    showBanner('Abgemeldet', 'success');
    if(window.loadLeaderboard) await loadLeaderboard();
}

async function checkSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if(session?.user) { console.log('[Auth] Session gefunden'); await onAuthSuccess(session.user); }
    } catch(err) { console.error('[Auth] Session-Check:', err); }
}

console.log('[Auth] Geladen');
