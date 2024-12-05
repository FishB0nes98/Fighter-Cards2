export const Hadoken = {
    id: 'hadoken',
    name: 'Hadoken',
    type: 'SPELL',
    manaCost: 1,
    description: 'Deal 2 damage to a minion.',
    imageUrl: 'images/cards/hadoken.png',
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
                    newState = targetMinion.onDamaged(newState, 2, targetInfo.index, targetInfo.playerType, {
                        type: 'SPELL',
                        id: 'hadoken'
                    });
                } else {
                    targetMinion.health -= 2;
                    targetMinion.animation = { 
                        isDamaged: true,
                        effect: 'skillshot'
                    };
                    
                    newState.actionLog.push(`Hadoken dealt 2 damage to ${targetMinion.name}`);
                    
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