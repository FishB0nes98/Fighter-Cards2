export const ChamCham = {
    id: 'cham-cham',
    name: 'Cham Cham',
    type: 'MINION',
    manaCost: 6,
    attack: 4,
    health: 6,
    baseHealth: 6,
    baseAttack: 4,
    attributes: ['Beast'],
    description: 'Can attack twice each turn.',
    imageUrl: '/images/cards/cham_cham.png',
    attacksThisTurn: 0,
    maxAttacksPerTurn: 2,

    // Override the default attack check
    canAttack: function(gameState, index, playerType) {
        const card = gameState.players[playerType].board[index];
        return !card.isNewlyPlayed && 
               !card.buffs?.some(buff => buff.type === 'FREEZE') && 
               (!card.hasAttackedThisTurn || card.attacksThisTurn < card.maxAttacksPerTurn);
    },

    // Track number of attacks
    onAttack: function(gameState, index, playerType) {
        const newState = { ...gameState };
        const card = newState.players[playerType].board[index];
        
        // Increment attack counter
        card.attacksThisTurn = (card.attacksThisTurn || 0) + 1;
        
        // Only set hasAttackedThisTurn to true after second attack
        if (card.attacksThisTurn >= card.maxAttacksPerTurn) {
            card.hasAttackedThisTurn = true;
        } else {
            // Ensure hasAttackedThisTurn is false until max attacks reached
            card.hasAttackedThisTurn = false;
        }

        return newState;
    },

    // Reset attack counter on turn start
    onTurnStart: function(gameState, index, playerType) {
        const newState = { ...gameState };
        const card = newState.players[playerType].board[index];
        card.attacksThisTurn = 0;
        card.hasAttackedThisTurn = false;
        return newState;
    }
}; 