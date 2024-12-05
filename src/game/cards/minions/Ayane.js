export const Ayane = {
    id: 'ayane',
    name: 'Ayane',
    type: 'MINION',
    manaCost: 1,
    attack: 3,
    health: 2,
    baseHealth: 2,
    attributes: ['Ninja'],
    description: 'Dies instantly when damaged by any source.',
    imageUrl: 'images/cards/ayane.png',
    onDamaged: (gameState, damage, index, playerType) => {
        const newState = { ...gameState };
        const minion = newState.players[playerType].board[index];
        
        if (minion && damage > 0) {
            minion.health = 0;
            minion.animation = { 
                isDying: true,
                effect: 'death'
            };
            newState.players[playerType].board[index] = null;
            newState.actionLog.push(`Ayane's fragility caused her to perish instantly`);
        }
        
        return newState;
    }
}; 