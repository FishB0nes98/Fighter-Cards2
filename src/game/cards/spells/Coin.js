export const Coin = {
    id: 'coin',
    name: 'Coin',
    type: 'SPELL',
    manaCost: 2,
    description: 'Double a minion\'s attack this turn.',
    imageUrl: '/images/cards/coin.png',
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

                const attackBonus = target.attack;

                // Add the coin buff
                target.buffs.push({
                    type: 'COIN',
                    name: 'Double Attack',
                    description: `+${attackBonus} Attack`,
                    effect: 'attack',
                    value: attackBonus,
                    duration: 1,
                    source: 'Coin'
                });

                // Apply the attack boost
                target.attack += attackBonus;

                // Add coin animation
                target.animation = {
                    isBuffed: true,
                    effect: 'coin-buff'
                };

                newState.actionLog.push(`${target.name}'s attack was doubled!`);
            }
        }

        return newState;
    }
}; 