export const Julia = {
    id: 'julia',
    name: 'Julia',
    type: 'MINION',
    manaCost: 1,
    attack: 1,
    health: 1,
    baseHealth: 1,
    attributes: ['Healer'],
    description: 'When played, increase a random ally minion\'s max HP by 1 (including herself).',
    imageUrl: 'images/cards/julia.png',
    battlecry: (gameState) => {
        const newState = { ...gameState };
        const currentPlayer = newState.players[newState.currentTurn];
        const board = currentPlayer.board;
        
        const validTargets = board.reduce((acc, minion, index) => {
            if (minion) {
                acc.push(index);
            }
            return acc;
        }, []);

        if (validTargets.length > 0) {
            const randomIndex = validTargets[Math.floor(Math.random() * validTargets.length)];
            const targetMinion = board[randomIndex];
            
            if (targetMinion) {
                if (!targetMinion.buffs) {
                    targetMinion.buffs = [];
                }
                targetMinion.buffs.push({
                    type: 'PERMANENT',
                    name: 'Julia\'s Blessing',
                    description: '+1 Max HP',
                    effect: 'health',
                    value: 1,
                    source: 'Julia',
                    animation: 'nature-heal'
                });

                targetMinion.baseHealth += 1;
                targetMinion.health += 1;
                targetMinion.animation = { 
                    isHealing: true,
                    effect: 'nature-heal'
                };
                
                newState.actionLog.push(
                    targetMinion.id === 'julia' 
                        ? `Julia increased her own max HP by 1`
                        : `Julia increased ${targetMinion.name}'s max HP by 1`
                );
            }
        }

        return newState;
    }
}; 