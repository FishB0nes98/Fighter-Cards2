export const Noel = {
    id: 'noel',
    name: 'Noel',
    type: 'MINION',
    manaCost: 3,
    attack: 2,
    health: 3,
    baseHealth: 3,
    attributes: ['Hunter'],
    description: 'Deals 2 damage to two random opponent minions.',
    imageUrl: '/images/cards/noel.png',
    battlecry: (gameState) => {
        let newState = { ...gameState };
        const opponentIndex = newState.currentTurn === 'player' ? 'opponent' : 'player';
        const opponent = newState.players[opponentIndex];
        
        // Get all valid targets (non-null minions on opponent's board)
        const validTargets = opponent.board
            .map((card, index) => card ? { card, index } : null)
            .filter(target => target !== null);

        // If there are targets, randomly select up to 2
        if (validTargets.length > 0) {
            // Shuffle array and take up to 2 targets
            const selectedTargets = validTargets
                .sort(() => Math.random() - 0.5)
                .slice(0, 2);

            // Deal damage to each selected target
            selectedTargets.forEach(({ card, index }) => {
                if (card.onDamaged) {
                    newState = card.onDamaged(newState, 2, index, opponentIndex);
                } else {
                    card.health -= 2;
                    card.animation = {
                        isDamaged: true,
                        effect: 'dual-laser',
                        duration: 1500
                    };
                    
                    newState.actionLog.push(`Noel shot ${card.name} for 2 damage`);
                    
                    // Remove the minion if it dies
                    if (card.health <= 0) {
                        opponent.board[index] = null;
                        newState.actionLog.push(`${card.name} was destroyed`);
                    }
                }
            });

            // Add animation to Noel
            const currentPlayer = newState.players[newState.currentTurn];
            const noelCard = currentPlayer.board.find(card => card && card.id === 'noel');
            if (noelCard) {
                noelCard.animation = {
                    battlecry: true,
                    effect: 'dual-laser',
                    duration: 1500
                };
            }
        }

        return newState;
    }
}; 