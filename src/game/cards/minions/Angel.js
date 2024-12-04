export const Angel = {
    id: 'angel',
    name: 'Angel',
    type: 'MINION',
    manaCost: 8,
    attack: 2,
    health: 8,
    baseHealth: 8,
    attributes: ['God', 'Healer'],
    description: 'When summoned: Deal 4 damage to all enemies.',
    imageUrl: '/images/cards/angel.png',

    battlecry: (gameState) => {
        let newState = { ...gameState };
        const opponent = newState.players[newState.currentTurn === 'player' ? 'opponent' : 'player'];

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
                        effect: 'divine-light-damage'
                    };
                    newState.actionLog.push(`Angel's divine light dealt 4 damage to ${card.name}`);

                    // Check if enemy dies
                    if (card.health <= 0) {
                        opponent.board[idx] = null;
                        newState.actionLog.push(`${card.name} was destroyed by the divine light`);
                    }
                }
            }
        }

        // Add divine light animation to Angel herself
        const angelIndex = newState.players[newState.currentTurn].board.findIndex(card => 
            card && card.id === 'angel' && card.isNewlyPlayed
        );
        if (angelIndex !== -1) {
            newState.players[newState.currentTurn].board[angelIndex].animation = {
                isCasting: true,
                effect: 'divine-light'
            };
        }

        return newState;
    }
}; 