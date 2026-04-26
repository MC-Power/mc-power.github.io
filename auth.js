// auth.js
console.log('✅ auth.js geladen');

window.currentUser = null;
window.userRole = 'guest';
window.isLoginMode = true;

window.openAuthModal = function() {
    document.getElementById('authModal').classList.add('active');
    document.getElementById('authMsg').className = 'status-msg';
    document.getElementById('inpUser').focus();
};

window.closeAuthModal = function() {
    document.getElementById('authModal').classList.remove('active');
};

window.toggleAuthMode = function() {
    window.isLoginMode = !window.isLoginMode;
    document.getElementById('authTitle').textContent = window.isLoginMode ? '🔐 Anmelden' : '📝 Registrieren';
    document.getElementById('btnAuthSubmit').textContent = window.isLoginMode ? 'Anmelden' : 'Registrieren';
    document.getElementById('authToggle').textContent = window.isLoginMode ? 'Noch kein Account? Registrieren' : 'Bereits Account? Anmelden';
    document.getElementById('authMsg').className = 'status-msg';
};

window.showAuthMessage = function(text, type) {
    const el = document.getElementById('authMsg');
    el.className = 'status-msg ' + type + ' visible';
    el.textContent = text;
};

window.handleAuth = async function() {
    const username = document.getElementById('inpUser').value.trim();
    const password = document.getElementById('inpPass').value;
    if(!username || !password) return showAuthMessage('❌ Felder ausfüllen', 'error');
    if(!window.isLoginMode && password.length < 6) return showAuthMessage('❌ Passwort mind. 6 Zeichen', 'error');
    
    const btn = document.getElementById('btnAuthSubmit');
    btn.disabled = true;
    
    try {
        const email = username.toLowerCase() + '@mcpower.local';
        if(window.isLoginMode) {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            if(error) throw error;
            await window.onAuthSuccess(data.user);
            showAuthMessage('✅ Eingeloggt!', 'success');
            setTimeout(window.closeAuthModal, 1000);
        } else {
            const { data, error } = await window.supabaseClient.auth.signUp({ email, password });
            if(error) throw error;
            if(data.user) {
                await window.supabaseClient.from('players').insert([{ user_id: data.user.id, username, display_name: username, role: 'player', region: 'DE' }]);
            }
            showAuthMessage('✅ Registriert! Bitte einloggen.', 'success');
            window.isLoginMode = true;
            window.toggleAuthMode();
        }
    } catch(err) {
        showAuthMessage('❌ ' + err.message, 'error');
    } finally {
        btn.disabled = false;
    }
};

window.onAuthSuccess = async function(user) {
    window.currentUser = user;
    document.getElementById('btnAuth').classList.add('hidden');
    document.getElementById('btnLogout').classList.remove('hidden');
    try {
        const { data } = await window.supabaseClient.from('players').select('role').eq('user_id', user.id).single();
        window.userRole = data?.role || 'player';
    } catch(e) { window.userRole = 'player'; }
    if(window.loadLeaderboard) await window.loadLeaderboard();
};

window.doLogout = async function() {
    await window.supabaseClient.auth.signOut();
    window.currentUser = null;
    window.userRole = 'guest';
    location.reload();
};

window.checkSession = async function() {
    try {
        const {  { session } } = await window.supabaseClient.auth.getSession();
        if(session?.user) await window.onAuthSuccess(session.user);
    } catch(e) {}
};
