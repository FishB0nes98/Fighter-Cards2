export const SubZero = {
    id: 'sub-zero',
    name: 'Sub Zero',
    type: 'MINION',
    manaCost: 4,
    attack: 3,
    health: 4,
    baseHealth: 4,
    attributes: ['Ninja', 'Caster'],
    description: 'Freezes a minion for 4 turns when played.',
    imageUrl: 'images/cards/sub_zero.png',
    battlecry: (gameState, index) => {
        const newState = { ...gameState };
        
        // Enable targeting for freeze effect
        newState.targetingState = {
            sourceIndex: index,
            sourceType: newState.currentTurn,
            validTargets: 'ALL_MINIONS',
            effect: 'FREEZE',
            cancelable: true
        };
        
        return newState;
    },
    // This will be called when a target is selected
    onTargetSelected: (gameState, targetInfo, sourceIndex) => {
        const newState = { ...gameState };
        const targetMinion = newState.players[targetInfo.playerType].board[targetInfo.index];
        
        if (targetMinion) {
            if (!targetMinion.buffs) {
                targetMinion.buffs = [];
            }
            
            // Add freeze buff
            targetMinion.buffs.push({
                type: 'FREEZE',
                name: 'Frozen',
                description: 'Cannot attack for 4 turns',
                duration: 4,
                effect: 'frozen',
                source: 'Sub Zero'
            });

            // Add freeze animation and state
            targetMinion.animation = {
                isFrozen: true,
                effect: 'freeze'
            };
            targetMinion.isFrozen = true; // Add explicit frozen state

            newState.actionLog.push(`Sub Zero froze ${targetMinion.name}`);
        }

        // Clear targeting state
        newState.targetingState = null;
        
        return newState;
    }
}; 