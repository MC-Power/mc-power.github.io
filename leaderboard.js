// leaderboard.js
console.log('✅ leaderboard.js geladen');

window.loadLeaderboard = async function() {
    console.log('[LB] Lade Leaderboard (öffentlich)...');
    const tbody = document.getElementById('lbBody');
    const countEl = document.getElementById('playerCount');
    
    if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="loading-cell"><div class="loading-container"><div class="spinner"></div><div class="loading-text">Lade Top 250...</div></div></td></tr>';
    
    try {
        // LIMIT AUF 250 ERHÖHT!
        const { data, error } = await window.supabaseClient
            .from('leaderboard')
            .select(`
                *,
                players (
                    id,
                    username,
                    display_name,
                    region,
                    role,
                    is_cheater,
                    is_banned
                )
            `)
            .order('points', { ascending: false })
            .limit(250);
        
        if(error) throw error;
        console.log('[LB] ✅', data?.length || 0, 'Einträge geladen');
        
        if(!data || data.length === 0) {
            if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="loading-cell" style="text-align:center">Noch keine Spieler im Leaderboard</td></tr>';
            if(countEl) countEl.textContent = '0 Spieler';
            return;
        }
        
        // Gruppiere nach Spieler (bestes Ergebnis pro User)
        const playerMap = new Map();
        data.forEach(entry => {
            const p = entry.players;
            if(!p || p.is_banned) return;
            if(!playerMap.has(p.id)) playerMap.set(p.id, { player: p, entries: [] });
            playerMap.get(p.id).entries.push(entry);
        });
        
        // Sortiere nach besten Punkten
        const sorted = Array.from(playerMap.values()).sort((a, b) => {
            const maxA = Math.max(...a.entries.map(e => e.points));
            const maxB = Math.max(...b.entries.map(e => e.points));
            return maxB - maxA;
        });
        
        // Render
        if(tbody) {
            tbody.innerHTML = sorted.map((item, idx) => {
                const p = item.player;
                const best = item.entries.reduce((max, e) => e.points > max.points ? e : max);
                const rankClass = idx < 3 ? `r${idx+1}` : 'rother';
                const tierClass = best.tier.includes('HP') ? 'hp' : 'lp';
                const tierSpecial = best.tier === 'HP1' ? 'hp1' : '';
                
                return `
                    <tr>
                        <td><span class="rank ${rankClass}">${idx + 1}</span></td>
                        <td><strong>${p.display_name || p.username}</strong></td>
                        <td>${p.region || '-'}</td>
                        <td>${best.gamemode}</td>
                        <td style="color:var(--primary)">${best.points}</td>
                        <td><span class="tier ${tierClass} ${tierSpecial}">${best.tier}</span></td>
                        <td><span class="role role-${p.role}">${p.role}</span></td>
                    </tr>
                `;
            }).join('');
        }
        
        if(countEl) countEl.textContent = `${sorted.length} Spieler`;
        console.log('[LB] ✅ '+sorted.length+' Spieler gerendert');
        
    } catch(err) {
        console.error('[LB] ❌ Fehler:', err.message);
        if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="loading-cell" style="color:var(--danger);text-align:center">Fehler: '+err.message+'</td></tr>';
    }
};
