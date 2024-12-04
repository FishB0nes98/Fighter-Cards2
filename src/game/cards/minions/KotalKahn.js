export const KotalKahn = {
    id: 'kotal-kahn',
    name: 'Kotal Kahn',
    type: 'MINION',
    manaCost: 10,
    attack: 8,
    health: 8,
    baseHealth: 8,
    attributes: ['Healer', 'Warrior'],
    description: 'When summoned: Heal all damaged allies to full health and deal 4 damage to all enemies.',
    imageUrl: '/images/cards/kotal_kahn.png',

    battlecry: (gameState) => {
        let newState = { ...gameState };
        const currentPlayer = newState.players[newState.currentTurn];
        const opponent = newState.players[newState.currentTurn === 'player' ? 'opponent' : 'player'];

        // Heal all damaged allies
        currentPlayer.board.forEach((card, idx) => {
            if (card && card.type === 'MINION' && card.health < card.baseHealth) {
                const healAmount = card.baseHealth - card.health;
                card.health = card.baseHealth;
                card.animation = {
                    isHealing: true,
                    effect: 'harsh-sunlight-heal',
                    duration: 1500
                };
                newState.actionLog.push(`Kotal Kahn's sunlight restored ${healAmount} HP to ${card.name}`);
            }
        });

        // Damage all enemies
        for (let idx = 0; idx < opponent.board.length; idx++) {
            const card = opponent.board[idx];
            if (card && card.type === 'MINION') {
                if (card.onDamaged) {
                    newState = card.onDamaged(newState, 4, idx, newState.currentTurn === 'player' ? 'opponent' : 'player');
                } else {
                    card.health -= 4;
                    card.animation = {
                        isDamaged: true,
                        effect: 'harsh-sunlight-damage'
                    };
                    newState.actionLog.push(`Kotal Kahn's sunlight dealt 4 damage to ${card.name}`);

                    // Check if enemy dies
                    if (card.health <= 0) {
                        opponent.board[idx] = null;
                        newState.actionLog.push(`${card.name} was destroyed by the harsh sunlight`);
                    }
                }
            }
        }

        // Add sunlight animation to Kotal Kahn himself
        const kotalIndex = currentPlayer.board.findIndex(card => card && card.id === 'kotal-kahn' && card.isNewlyPlayed);
        if (kotalIndex !== -1) {
            currentPlayer.board[kotalIndex].animation = {
                isCasting: true,
                effect: 'harsh-sunlight'
            };
        }

        return newState;
    }
}; 