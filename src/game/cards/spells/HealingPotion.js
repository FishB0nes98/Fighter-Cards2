export const HealingPotion = {
    id: 'healing-potion',
    name: 'Healing Potion',
    type: 'SPELL',
    manaCost: 1,
    description: 'Restore 3 HP to a minion.',
    imageUrl: 'images/cards/healing_potion.png',
    requiresTarget: true,

    canTarget: (gameState, targetInfo) => {
        if (!targetInfo?.playerType || targetInfo?.index === undefined) return false;
        const target = gameState.players[targetInfo.playerType].board[targetInfo.index];
        return target && target.type === 'MINION' && target.health < target.baseHealth;
    },

    effect: (gameState, targetInfo) => {
        const newState = { ...gameState };
        
        if (targetInfo?.playerType && targetInfo?.index !== undefined) {
            const target = newState.players[targetInfo.playerType].board[targetInfo.index];
            if (target) {
                // Heal for 3, but don't exceed max health
                const healAmount = Math.min(3, target.baseHealth - target.health);
                target.health += healAmount;

                // Add heal animation
                target.animation = {
                    isHealing: true,
                    effect: 'nature-heal'
                };

                newState.actionLog.push(`${target.name} was healed for ${healAmount} HP`);
            }
        }

        return newState;
    }
}; 