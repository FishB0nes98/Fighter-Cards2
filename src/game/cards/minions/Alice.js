export const Alice = {
    id: 'alice',
    name: 'Alice',
    type: 'MINION',
    manaCost: 6,
    attack: 5,
    health: 6,
    baseHealth: 6,
    baseAttack: 5,
    attributes: ['Beast', 'Love'],
    description: 'Takes only half damage from all sources.',
    imageUrl: 'images/cards/alice.png',

    // Override damage handling to halve all damage
    onDamaged: function(gameState, damage, index, playerType) {
        const newState = { ...gameState };
        const card = newState.players[playerType].board[index];
        
        // Calculate halved damage (rounded up)
        const reducedDamage = Math.ceil(damage / 2);
        
        // Apply the reduced damage
        card.health -= reducedDamage;
        
        // Add damage reduction animation
        card.animation = {
            isDamaged: true,
            effect: 'damage-reduced',
            reducedAmount: damage - reducedDamage
        };
        
        newState.actionLog.push(`Alice's ability reduced damage from ${damage} to ${reducedDamage}!`);
        
        // Check if Alice dies
        if (card.health <= 0) {
            newState.players[playerType].board[index] = null;
            newState.actionLog.push(`${card.name} was destroyed`);
        }
        
        return newState;
    }
}; 