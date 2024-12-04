export const Arrow = {
    id: 'arrow',
    name: 'Arrow',
    type: 'SPELL',
    manaCost: 1,
    description: 'Deal 1 damage to a minion.',
    imageUrl: '/images/cards/arrow.png',
    requiresTarget: true,

    canTarget: (gameState, targetInfo) => {
        if (!targetInfo?.playerType || targetInfo?.index === undefined) return false;
        const target = gameState.players[targetInfo.playerType].board[targetInfo.index];
        return target && target.type === 'MINION';
    },

    effect: (gameState, targetInfo) => {
        let newState = { ...gameState };
        
        if (targetInfo?.playerType && targetInfo?.index !== undefined) {
            const targetMinion = newState.players[targetInfo.playerType].board[targetInfo.index];
            if (targetMinion) {
                // Check for onDamaged effect first
                if (targetMinion.onDamaged) {
                    newState = targetMinion.onDamaged(newState, 1, targetInfo.index, targetInfo.playerType, {
                        type: 'SPELL',
                        id: 'arrow'
                    });
                } else {
                    targetMinion.health -= 1;
                    targetMinion.animation = { 
                        isDamaged: true,
                        effect: 'skillshot'
                    };
                    
                    newState.actionLog.push(`Arrow dealt 1 damage to ${targetMinion.name}`);
                    
                    // Check if target dies
                    if (targetMinion.health <= 0) {
                        newState.players[targetInfo.playerType].board[targetInfo.index] = null;
                        newState.actionLog.push(`${targetMinion.name} was destroyed`);
                    }
                }
            }
        }

        return newState;
    }
}; 