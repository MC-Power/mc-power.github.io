async function loadLeaderboard() {
    console.log('[Leaderboard] Lade...');
    const tbody = document.getElementById('lbBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Lade Daten...</td></tr>';
    try {
        const { data, error } = await supabase.from('leaderboard').select(`*, players ( id, username, display_name, region, role, is_cheater, is_banned )`).order('points', { ascending: false }).limit(100);
        if(error) throw error;
        console.log('[Leaderboard] ✅', data?.length || 0, 'Einträge');
        if(!data || data.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="loading">Keine Spieler gefunden</td></tr>'; return; }
        const playerMap = new Map();
        data.forEach(entry => { const p = entry.players; if(!p || p.is_banned) return; if(!playerMap.has(p.id)) playerMap.set(p.id, { player: p, entries: [] }); playerMap.get(p.id).entries.push(entry); });
        const sorted = Array.from(playerMap.values()).sort((a, b) => { const maxA = Math.max(...a.entries.map(e => e.points)); const maxB = Math.max(...b.entries.map(e => e.points)); return maxB - maxA; });
        tbody.innerHTML = sorted.map((item, idx) => { const p = item.player; const best = item.entries.reduce((max, e) => e.points > max.points ? e : max); const rankClass = idx < 3 ? 'rank-' + (idx+1) : 'rank-other'; const tierClass = best.tier.includes('HP') ? 'hp' : 'lp'; const initials = (p.display_name || p.username).substring(0, 2).toUpperCase(); return `<tr><td><span class="rank ${rankClass}">${idx + 1}</span></td><td><div class="player-cell"><div class="player-avatar">${initials}</div><div class="player-info"><div class="player-name">${escapeHtml(p.display_name || p.username)}</div>${p.is_cheater ? '<div class="player-sub" style="color: var(--danger);">⚠️ Cheater</div>' : ''}</div></div></td><td>${p.region || '-'}</td><td>${best.gamemode}</td><td><strong style="color: var(--primary)">${best.points}</strong></td><td><span class="tier ${tierClass}">${best.tier}</span></td><td><span class="role-badge role-${p.role}">${p.role}</span></td></tr>`; }).join('');
    } catch(err) { console.error('[Leaderboard] ❌', err); tbody.innerHTML = '<tr><td colspan="7" class="loading" style="color: var(--danger)">Fehler: ' + err.message + '</td></tr>'; }
}

function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
console.log('[Leaderboard] Geladen');
