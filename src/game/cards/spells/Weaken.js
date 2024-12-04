export const Weaken = {
    id: 'weaken',
    name: 'Weaken',
    type: 'SPELL',
    manaCost: 2,
    description: 'Reduce a minion\'s attack by 2.',
    imageUrl: '/images/cards/weaken.png',
    requiresTarget: true,

    canTarget: (gameState, targetInfo) => {
        if (!targetInfo?.playerType || targetInfo?.index === undefined) return false;
        const target = gameState.players[targetInfo.playerType].board[targetInfo.index];
        return target && target.type === 'MINION' && target.attack > 0;
    },

    effect: (gameState, targetInfo) => {
        const newState = { ...gameState };
        
        if (targetInfo?.playerType && targetInfo?.index !== undefined) {
            const target = newState.players[targetInfo.playerType].board[targetInfo.index];
            if (target) {
                // Initialize buffs array if it doesn't exist
                if (!target.buffs) {
                    target.buffs = [];
                }

                // Add the weaken debuff
                target.buffs.push({
                    type: 'WEAKEN',
                    name: 'Weakened',
                    description: '-2 Attack',
                    effect: 'attack',
                    value: -2,
                    source: 'Weaken',
                    duration: 'permanent'
                });

                // Apply the attack reduction
                target.attack = Math.max(0, target.attack - 2);

                // Add weaken animation
                target.animation = {
                    isWeakened: true,
                    effect: 'weaken'
                };

                newState.actionLog.push(`${target.name}'s attack was reduced by 2!`);
            }
        }

        return newState;
    }
}; 