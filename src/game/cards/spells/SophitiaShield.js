export const SophitiaShield = {
    id: 'sophitia-shield',
    name: 'Sophitia\'s Shield',
    type: 'SPELL',
    manaCost: 0,
    description: 'Give a minion +1 health.',
    imageUrl: 'images/cards/Sophitia Shield.webp',
    requiresTarget: true,

    canTarget: (gameState, targetInfo) => {
        if (!targetInfo?.playerType || targetInfo?.index === undefined) return false;
        const target = gameState.players[targetInfo.playerType].board[targetInfo.index];
        return target && target.type === 'MINION';
    },

    effect: (gameState, targetInfo) => {
        const newState = { ...gameState };
        
        if (targetInfo?.playerType && targetInfo?.index !== undefined) {
            const target = newState.players[targetInfo.playerType].board[targetInfo.index];
            if (target) {
                // Initialize buffs array if it doesn't exist
                if (!target.buffs) target.buffs = [];
                
                // Add buff
                target.buffs.push({
                    type: 'PERMANENT',
                    name: 'Divine Shield',
                    description: '+1 HP',
                    effect: 'health',
                    value: 1,
                    source: 'sophitia-shield'
                });

                // Update stats
                target.baseHealth += 1;
                target.health += 1;

                // Add animation
                target.animation = {
                    isBuffed: true,
                    effect: 'nature-heal',
                    duration: 1500
                };

                newState.actionLog.push(`${target.name} gained +1 HP from Sophitia's Shield`);
            }
        }

        return newState;
    }
}; 