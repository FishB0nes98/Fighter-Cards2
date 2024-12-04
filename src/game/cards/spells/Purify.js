import { CardLoader } from '../../utils/CardLoader.js';

export const Purify = {
    id: 'purify',
    name: 'Purify',
    type: 'SPELL',
    manaCost: 4,
    description: 'Remove all buffs and effects from a target card, restoring it to its base state (except HP loss)',
    imageUrl: '/images/cards/purify.png',
    requiresTarget: true,
    canTarget: (gameState, targetInfo) => {
        if (!targetInfo?.playerType || targetInfo?.index === undefined) return false;
        const target = gameState.players[targetInfo.playerType].board[targetInfo.index];
        return target && (
            target.buffs?.length > 0 || 
            target.attack !== target.baseAttack || 
            target.baseHealth !== CardLoader.getCardById(target.id)?.baseHealth ||
            target.isFrozen
        );
    },
    effect: (gameState, targetInfo) => {
        const newState = { ...gameState };
        
        if (targetInfo?.playerType && targetInfo?.index !== undefined) {
            const target = newState.players[targetInfo.playerType].board[targetInfo.index];
            if (target) {
                // Get original card stats
                const originalCard = CardLoader.getCardById(target.id);
                if (!originalCard) return newState;

                // Calculate health proportion before max HP changes
                const currentHealthPercent = target.health / target.baseHealth;
                
                // Reset stats to original values
                target.attack = originalCard.attack;
                target.baseAttack = originalCard.attack;
                
                // Handle max HP changes carefully
                const healthDiff = target.baseHealth - originalCard.baseHealth;
                target.baseHealth = originalCard.baseHealth;
                
                // Calculate new health value
                if (healthDiff > 0) {
                    // If we're removing max HP, ensure health doesn't go below 1
                    target.health = Math.max(1, Math.floor(currentHealthPercent * target.baseHealth));
                }
                
                // Clear all buffs and effects
                target.buffs = [];
                target.isFrozen = false;
                
                // Add purify animation
                target.animation = {
                    isPurified: true,
                    effect: 'purify'
                };
                
                newState.actionLog.push(`Purify restored ${target.name} to its base state`);
            }
        }

        return newState;
    }
}; 