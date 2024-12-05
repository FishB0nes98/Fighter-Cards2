export const HealthPotion = {
    id: 'health-potion',
    name: 'Health Potion',
    type: 'SPELL',
    manaCost: 2,
    description: 'Restore 3 HP to a minion.',
    imageUrl: 'images/cards/health-potion.png',
    requiresTarget: true,
    
    canTarget: (gameState, targetInfo) => {
        if (!targetInfo?.playerType || targetInfo?.index === undefined) return false;
        const target = gameState.players[targetInfo.playerType].board[targetInfo.index];
        return target && target.type === 'MINION' && target.health < target.baseHealth;
    },

    effect: (gameState, targetInfo) => {
        const newState = { ...gameState };
        
        if (targetInfo?.playerType && targetInfo?.index !== undefined) {
            const targetMinion = newState.players[targetInfo.playerType].board[targetInfo.index];
            if (targetMinion) {
                const healAmount = Math.min(3, targetMinion.baseHealth - targetMinion.health);
                
                if (healAmount > 0) {
                    targetMinion.health += healAmount;
                    targetMinion.animation = { 
                        isHealing: true,
                        effect: 'nature-heal'
                    };
                    newState.actionLog.push(`Health Potion restored ${healAmount} HP to ${targetMinion.name}`);
                } else {
                    newState.actionLog.push(`${targetMinion.name} is already at full health`);
                }
            }
        }

        return newState;
    }
}; 