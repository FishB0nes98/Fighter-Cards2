import { HealthPotion } from '../spells/HealthPotion.js';

export const Fang = {
    id: 'fang',
    name: 'FANG',
    type: 'MINION',
    manaCost: 3,
    attack: 0,
    health: 4,
    baseHealth: 4,
    attributes: ['Healer'],
    description: 'At the start of your turn, create a Health Potion in your hand (costs 1 less).',
    imageUrl: '/images/cards/fang.png',

    onTurnStart: (gameState, index, playerType) => {
        const newState = { ...gameState };
        const player = newState.players[playerType];

        // Create a new Health Potion with reduced cost
        const potion = { 
            ...HealthPotion,
            manaCost: Math.max(0, HealthPotion.manaCost - 1),
            animation: {
                isGenerated: true,
                effect: 'nature-heal'
            },
            effect: HealthPotion.effect
        };

        // Add it to the player's hand
        player.hand.push(potion);

        newState.actionLog.push(`FANG created a Health Potion (Cost: ${potion.manaCost})`);
        return newState;
    }
}; 