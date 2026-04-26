async function savePlayer(){
    const name = document.getElementById('admName').value.trim();
    const region = document.getElementById('admRegion').value;
    const mode = document.getElementById('admMode').value;
    const points = parseInt(document.getElementById('admPoints').value) || 0;
    const tier = document.getElementById('admTier').value;
    const role = document.getElementById('admRole').value;
    const msg = document.getElementById('adminMsg');
    
    if(!name) {
        showAdminMsg('❌ Name erforderlich', false);
        return;
    }
    
    try {
        // 1. Prüfen ob Spieler existiert
        const { data: existingPlayer, error: searchError } = await window.supabaseClient
            .from('players')
            .select('id')
            .eq('username', name)
            .single();
        
        let playerId;
        
        if(existingPlayer && existingPlayer.id) {
            // Spieler existiert - aktualisieren
            playerId = existingPlayer.id;
            const { error: updateError } = await window.supabaseClient
                .from('players')
                .update({ 
                    display_name: name,
                    region: region,
                    role: role 
                })
                .eq('id', playerId);
            
            if(updateError) throw updateError;
            console.log('[Admin] ✅ Spieler aktualisiert:', playerId);
        } else {
            // Spieler existiert nicht - neu erstellen
            const { data: newPlayer, error: insertError } = await window.supabaseClient
                .from('players')
                .insert([{
                    username: name,
                    display_name: name,
                    region: region,
                    role: role
                }])
                .select('id')
                .single();
            
            if(insertError) throw insertError;
            if(!newPlayer || !newPlayer.id) throw new Error('Keine ID vom neuen Spieler erhalten');
            
            playerId = newPlayer.id;
            console.log('[Admin] ✅ Spieler erstellt:', playerId);
        }
        
        // 2. Leaderboard Eintrag erstellen/aktualisieren
        const { error: lbError } = await window.supabaseClient
            .from('leaderboard')
            .upsert({
                player_id: playerId,
                gamemode: mode,
                points: points,
                tier: tier
            }, {
                onConflict: 'player_id,gamemode'
            });
        
        if(lbError) throw lbError;
        
        showAdminMsg('✅ Gespeichert!', true);
        document.getElementById('admName').value = '';
        document.getElementById('admPoints').value = '0';
        
        // Refresh
        await window.loadLeaderboard();
        await window.loadAllPlayers();
        
    } catch(err) {
        console.error('[Admin] ❌ Fehler:', err);
        showAdminMsg('❌ ' + err.message, false);
    }
}

function showAdminMsg(txt, ok) {
    const el = document.getElementById('adminMsg');
    if(el) {
        el.textContent = txt;
        el.className = 'msg show ' + (ok ? 'ok' : 'err');
        setTimeout(() => el.classList.remove('show'), 3000);
    }
}
