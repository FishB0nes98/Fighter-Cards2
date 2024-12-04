export const SophitiaSword = {
    id: 'sophitia-sword',
    name: 'Sophitia\'s Sword',
    type: 'SPELL',
    manaCost: 0,
    description: 'Give a minion +1 attack.',
    imageUrl: '/images/cards/Sophitia Sword.webp',
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
                    name: 'Divine Sword',
                    description: '+1 Attack',
                    effect: 'attack',
                    value: 1,
                    source: 'sophitia-sword'
                });

                // Update stats
                target.attack += 1;
                target.baseAttack = (target.baseAttack || target.attack) + 1;

                // Add animation
                target.animation = {
                    isBuffed: true,
                    effect: 'skillshot',
                    duration: 1500
                };

                newState.actionLog.push(`${target.name} gained +1 attack from Sophitia's Sword`);
            }
        }

        return newState;
    }
}; 