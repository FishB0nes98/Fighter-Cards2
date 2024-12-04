export const Birdie = {
    id: 'birdie',
    name: 'Birdie',
    type: 'MINION',
    manaCost: 3,
    attack: 2,
    health: 3,
    baseHealth: 3,
    attributes: ['Warrior'],
    description: 'When played: Stun an enemy for 2 turns.',
    imageUrl: '/images/cards/birdie.png',

    battlecry: (gameState) => {
        let newState = { ...gameState };
        
        // Enable targeting for stun effect
        newState.targetingState = {
            sourceIndex: newState.players[newState.currentTurn].board.findIndex(
                card => card && card.id === 'birdie' && card.isNewlyPlayed
            ),
            sourceType: newState.currentTurn,
            validTargets: 'ALL_MINIONS',
            effect: 'STUN',
            cancelable: true
        };
        
        return newState;
    },

    onTargetSelected: (gameState, targetInfo, sourceIndex) => {
        const newState = { ...gameState };
        const targetMinion = newState.players[targetInfo.playerType].board[targetInfo.index];
        
        if (targetMinion) {
            if (!targetMinion.buffs) {
                targetMinion.buffs = [];
            }
            
            // Add stun buff with visual effect
            targetMinion.buffs.push({
                type: 'STUN',
                name: 'Stunned',
                description: 'Cannot attack for 2 turns',
                duration: 2,
                effect: 'chain-bind',
                source: 'Birdie'
            });

            // Add initial chain animation
            targetMinion.animation = {
                isStunned: true,
                effect: 'chain-bind',
                duration: 1500
            };

            // Add casting animation to Birdie
            const birdieCard = newState.players[newState.currentTurn].board[sourceIndex];
            if (birdieCard) {
                birdieCard.animation = {
                    isCasting: true,
                    effect: 'chain-cast',
                    duration: 1500
                };
            }

            newState.actionLog.push(`Birdie stunned ${targetMinion.name}`);
        }

        // Clear targeting state
        newState.targetingState = null;
        
        return newState;
    }
}; 