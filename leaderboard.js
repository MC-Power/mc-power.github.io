// leaderboard.js - REPARIERTE VERSION
console.log('✅ leaderboard.js geladen');

window.loadLeaderboard = async function() {
    console.log('📊 Lade Leaderboard (öffentlich)...');
    const tb = document.getElementById('lbBody');
    if (!tb) return;
    
    tb.innerHTML = '<tr><td colspan="7" class="loading">Lade Top 250...</td></tr>';

    try {
        // Daten laden
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
                    is_banned
                )
            `)
            .order('points', { ascending: false })
            .limit(250);

        if (error) throw error;
        console.log('📦 Rohdaten geladen:', data?.length || 0);

        if (!data || data.length === 0) {
            tb.innerHTML = '<tr><td colspan="7" class="loading">Noch keine Spieler im Leaderboard</td></tr>';
            return;
        }

        // 1. Filtere ungültige Einträge (kein Spieler oder gebannt)
        const validEntries = data.filter(r => r.players && !r.players.is_banned);
        console.log('✅ Valide Einträge (nicht gebannt):', validEntries.length);

        // 2. Gruppiere nach Spieler - behalte nur den BESTEN Eintrag pro Spieler
        const playerMap = new Map();
        validEntries.forEach(r => {
            const p = r.players;
            if (!playerMap.has(p.id)) {
                // Erster Eintrag für diesen Spieler
                playerMap.set(p.id, { player: p, best: r });
            } else {
                // Vergleiche mit bisher bestem Eintrag
                const currentBest = playerMap.get(p.id).best;
                if (r.points > currentBest.points) {
                    playerMap.set(p.id, { player: p, best: r });
                }
            }
        });

        // 3. In Array umwandeln und sortieren
        const sorted = Array.from(playerMap.values())
            .sort((a, b) => b.best.points - a.best.points);

        console.log('🏆 Finale Liste:', sorted.length, 'Spieler');

        // 4. Tabelle rendern
        if (sorted.length === 0) {
            tb.innerHTML = '<tr><td colspan="7" class="loading">Keine aktiven Spieler</td></tr>';
            return;
        }

        tb.innerHTML = sorted.map((item, idx) => {
            const p = item.player;
            const best = item.best;
            
            // Rang-Badge Farbe
            const rc = idx === 0 ? 'r1' : idx === 1 ? 'r2' : idx === 2 ? 'r3' : 'rother';
            
            // Tier Farbe
            const tc = best.tier.includes('HP') ? 'hp' : 'lp';
            const tc1 = best.tier === 'HP1' ? 'hp1' : '';

            return `
                <tr>
                    <td><span class="rank ${rc}">${idx + 1}</span></td>
                    <td><strong>${p.display_name || p.username}</strong></td>
                    <td>${p.region || '-'}</td>
                    <td>${best.gamemode}</td>
                    <td style="color:var(--primary)">${best.points}</td>
                    <td><span class="tier ${tc} ${tc1}">${best.tier}</span></td>
                    <td><span class="role role-${p.role}">${p.role}</span></td>
                </tr>
            `;
        }).join('');

        console.log('✅ Leaderboard erfolgreich gerendert!');

    } catch (err) {
        console.error('❌ Leaderboard Fehler:', err);
        tb.innerHTML = `<tr><td colspan="7" class="loading" style="color:var(--danger)">Fehler: ${err.message}</td></tr>`;
    }
};
