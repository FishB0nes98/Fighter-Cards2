import { Arrow } from '../spells/Arrow.js';

export const PrimalKagome = {
    id: 'primal-kagome',
    name: 'Primal Kagome',
    type: 'MINION',
    manaCost: 6,
    attack: 4,
    health: 4,
    baseHealth: 4,
    attributes: ['Primal', 'Hunter'],
    description: 'At the end of your turn, create an Arrow spell in your hand.',
    imageUrl: '/images/cards/primal_kagome.png',
    onTurnEnd: (gameState, index, playerType) => {
        const newState = { ...gameState };
        // Only create Arrow if it's the owner's turn end
        if (playerType === newState.currentTurn) {
            const currentPlayer = newState.players[playerType];
            
            // Only add Arrow if hand isn't full
            if (currentPlayer.hand.length < 10) {
                const arrow = { 
                    ...Arrow,
                    animation: {
                        effect: 'skillshot'
                    }
                };
                currentPlayer.hand.push(arrow);
                newState.actionLog.push(`Primal Kagome created an Arrow spell`);
            } else {
                newState.actionLog.push(`Primal Kagome tried to create an Arrow, but your hand was full`);
            }
        }
        
        return newState;
    }
}; 