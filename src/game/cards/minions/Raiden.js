export const Raiden = {
    id: 'raiden',
    name: 'Raiden',
    type: 'MINION',
    manaCost: 7,
    attack: 7,
    health: 6,
    baseHealth: 6,
    attributes: ['Caster', 'God'],
    description: 'When played: Deal 3 damage to 3 random cards. Your spells deal 1 extra damage.',
    imageUrl: 'images/cards/raiden.png',

    battlecry: (gameState) => {
        let newState = { ...gameState };
        const currentPlayer = newState.players[newState.currentTurn];
        const opponent = newState.players[newState.currentTurn === 'player' ? 'opponent' : 'player'];

        // Find Raiden's position first
        const raidenIndex = currentPlayer.board.findIndex(card => 
            card && card.id === 'raiden' && card.isNewlyPlayed
        );

        // Add thunder animation to Raiden
        if (raidenIndex !== -1) {
            currentPlayer.board[raidenIndex].animation = {
                isCasting: true,
                effect: 'thunder-cast',
                duration: 1500
            };
        }

        // Get all valid targets (all minions except Raiden)
        const allTargets = [];
        
        // Add opponent's minions
        opponent.board.forEach((card, index) => {
            if (card) {
                allTargets.push({ 
                    card, 
                    index, 
                    playerType: newState.currentTurn === 'player' ? 'opponent' : 'player' 
                });
            }
        });

        // Add player's minions (excluding Raiden)
        currentPlayer.board.forEach((card, index) => {
            if (card && index !== raidenIndex) {
                allTargets.push({ 
                    card, 
                    index, 
                    playerType: newState.currentTurn 
                });
            }
        });

        // Randomly select 3 targets
        for (let i = 0; i < 3 && allTargets.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * allTargets.length);
            const target = allTargets.splice(randomIndex, 1)[0];

            // Deal damage to target
            if (target.card.onDamaged) {
                newState = target.card.onDamaged(newState, 3, target.index, target.playerType);
            } else {
                target.card.health -= 3;
                
                // Set lightning strike animation on target
                newState.players[target.playerType].board[target.index].animation = {
                    isDamaged: true,
                    effect: 'lightning-strike',
                    duration: 1500
                };

                newState.actionLog.push(`Raiden's lightning dealt 3 damage to ${target.card.name}`);

                // Check if target dies
                if (target.card.health <= 0) {
                    newState.players[target.playerType].board[target.index] = null;
                    newState.actionLog.push(`${target.card.name} was destroyed by the lightning`);
                }
            }
        }

        return newState;
    },

    // Add spell damage buff to all spells
    onSpellPlayed: (gameState, spellCard) => {
        // If the spell deals damage, increase it by 1
        if (spellCard.effect && typeof spellCard.damage === 'number') {
            spellCard.damage += 1;
            gameState.actionLog.push(`Raiden's power increased the spell damage by 1`);
        }
        return gameState;
    }
};