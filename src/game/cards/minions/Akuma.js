import { Hadoken } from '../spells/Hadoken.js';

export const Akuma = {
    id: 'akuma',
    name: 'Akuma',
    type: 'MINION',
    manaCost: 2,
    attack: 1,
    health: 2,
    baseHealth: 2,
    attributes: ['Demon', 'Caster'],
    description: 'Creates a Hadoken spell in your hand.',
    imageUrl: '/images/cards/akuma.png',
    battlecry: (gameState) => {
        const newState = { ...gameState };
        const currentPlayer = newState.players[newState.currentTurn];
        
        // Only add Hadoken if hand isn't full
        if (currentPlayer.hand.length < 10) {
            const hadoken = { 
                ...Hadoken,
                animation: {
                    effect: 'dark-summon'
                }
            };
            currentPlayer.hand.push(hadoken);
            newState.actionLog.push(`Akuma created a Hadoken spell`);
        } else {
            newState.actionLog.push(`Akuma tried to create a Hadoken, but your hand was full`);
        }
        
        return newState;
    }
}; 