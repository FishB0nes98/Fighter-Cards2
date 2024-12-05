import { CardLoader } from '../../utils/CardLoader.js';

export const ErronBlack = {
    id: 'erron-black',
    name: 'Erron Black',
    type: 'MINION',
    manaCost: 2,
    attack: 3,
    health: 2,
    baseHealth: 2,
    baseAttack: 3,
    attributes: ['Hunter'],
    description: 'At the start of your turn, 20% chance to create a Coin card in your hand.',
    imageUrl: 'images/cards/erron_black.png',

    onTurnStart: function(gameState, index, playerType) {
        const newState = { ...gameState };
        const player = newState.players[playerType];
        const card = player.board[index];

        // 20% chance to create a coin
        if (Math.random() < 0.2 && player.hand.length < 10) {
            // Create a coin card
            const coinCard = { ...CardLoader.getCardById('coin') };
            player.hand.push(coinCard);

            // Add coin animation
            card.animation = {
                isCreatingCoin: true,
                effect: 'coin-toss'
            };

            newState.actionLog.push(`Erron Black created a Coin!`);
        }

        return newState;
    }
}; 