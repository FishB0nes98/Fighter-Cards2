export const Shinnok = {
    id: 'shinnok',
    name: 'Shinnok',
    type: 'MINION',
    manaCost: 7,
    attack: 3,
    health: 7,
    baseHealth: 7,
    attributes: ['Demon', 'Caster', 'God'],
    description: 'Whenever a spell is played while Shinnok is on the field, deal 1 damage to a random enemy minion.',
    imageUrl: '/images/cards/shinnok.png',

    // Called when any spell is played
    onSpellPlayed: (gameState, index, playerType) => {
        const newState = { ...gameState };
        const opponent = playerType === 'player' ? 'opponent' : 'player';
        
        // Find all enemy minions
        const validTargets = newState.players[opponent].board
            .map((card, index) => card ? index : null)
            .filter(index => index !== null);

        if (validTargets.length > 0) {
            // Pick a random target
            const targetIndex = validTargets[Math.floor(Math.random() * validTargets.length)];
            const target = newState.players[opponent].board[targetIndex];

            // Deal 1 damage
            target.health -= 1;

            // Add damage animation
            target.animation = {
                isDamaged: true,
                effect: 'dark-summon',
                duration: 1500
            };

            // Add Shinnok's attack animation
            const shinnok = newState.players[playerType].board[index];
            shinnok.animation = {
                isAttacking: true,
                effect: 'dark-summon'
            };

            newState.actionLog.push(`Shinnok dealt 1 damage to ${target.name}`);

            // Check if target died
            if (target.health <= 0) {
                newState.players[opponent].board[targetIndex] = null;
                newState.actionLog.push(`${target.name} was destroyed`);
            }
        }

        return newState;
    }
}; 