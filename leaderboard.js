// leaderboard.js
console.log('✅ leaderboard.js geladen');

window.loadLeaderboard = async function() {
    console.log('[LB] Lade...');
    const tbody = document.getElementById('lbBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Lade...</td></tr>';
    
    try {
        const { data, error } = await window.supabaseClient
            .from('leaderboard')
            .select('*, players(username, display_name, region, role, is_banned)')
            .order('points', { ascending: false })
            .limit(100);
        
        if(error) throw error;
        tbody.innerHTML = '';
        if(!data || !data.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Keine Spieler</td></tr>'; return; }
        
        // Einfaches Rendering
        data.forEach((r, i) => {
            if(r.players?.is_banned) return;
            const rc = i<1?'gold':i<2?'silver':i<3?'#cd7f32':'#64748b';
            const tc = r.tier.includes('HP')?'hp':'lp', tc1 = r.tier==='HP1'?'hp1':'';
            tbody.innerHTML += `<tr><td style="color:${rc};font-weight:bold">#${i+1}</td><td><strong>${r.players?.display_name||'?'}</strong></td><td>${r.players?.region||'-'}</td><td>${r.gamemode}</td><td style="color:#00ff88">${r.points}</td><td><span class="tier ${tc} ${tc1}">${r.tier}</span></td><td><span class="role-badge role-${r.players?.role||'player'}">${r.players?.role||'player'}</span></td></tr>`;
        });
    } catch(err) {
        console.error('[LB] Fehler:', err);
        tbody.innerHTML = `<tr><td colspan="7" style="color:red;text-align:center">Fehler: ${err.message}</td></tr>`;
    }
};
