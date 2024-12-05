import { CardLoader } from '../../utils/CardLoader.js';

export const Sophitia = {
    id: 'sophitia',
    name: 'Sophitia',
    type: 'MINION',
    manaCost: 2,
    attack: 2,
    health: 2,
    baseHealth: 2,
    attributes: ['Warrior'],
    description: 'When destroyed, creates a Sword and Shield in your hand.',
    imageUrl: 'images/cards/sophitia.png',

    onDamaged: function(gameState, damage, index, playerType) {
        let newState = { ...gameState };
        const card = newState.players[playerType].board[index];
        
        // Apply damage
        card.health -= damage;
        card.animation = {
            isDamaged: true
        };

        // If dying from damage, create equipment before removal
        if (card.health <= 0) {
            const player = newState.players[playerType];

            // Create Sword
            if (player.hand.length < 10) {
                const sword = { 
                    ...CardLoader.getCardById('sophitia-sword'),
                    animation: {
                        isGenerated: true,
                        effect: 'skillshot'
                    }
                };
                player.hand.push(sword);
                newState.actionLog.push(`Sophitia's Sword was created`);
            }

            // Create Shield
            if (player.hand.length < 10) {
                const shield = { 
                    ...CardLoader.getCardById('sophitia-shield'),
                    animation: {
                        isGenerated: true,
                        effect: 'nature-heal'
                    }
                };
                player.hand.push(shield);
                newState.actionLog.push(`Sophitia's Shield was created`);
            }

            // Remove from board
            newState.players[playerType].board[index] = null;
            newState.actionLog.push(`${card.name} was destroyed`);
        }

        return newState;
    },

    onRemove: (gameState, index, playerType) => {
        const newState = { ...gameState };
        const player = newState.players[playerType];

        // Create Sword
        if (player.hand.length < 10) {
            const sword = { 
                ...CardLoader.getCardById('sophitia-sword'),
                animation: {
                    isGenerated: true,
                    effect: 'skillshot'
                }
            };
            player.hand.push(sword);
            newState.actionLog.push(`Sophitia's Sword was created`);
        }

        // Create Shield
        if (player.hand.length < 10) {
            const shield = { 
                ...CardLoader.getCardById('sophitia-shield'),
                animation: {
                    isGenerated: true,
                    effect: 'nature-heal'
                }
            };
            player.hand.push(shield);
            newState.actionLog.push(`Sophitia's Shield was created`);
        }

        return newState;
    }
}; 