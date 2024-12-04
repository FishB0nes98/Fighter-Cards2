export const Ibuki = {
    id: 'ibuki',
    name: 'Ibuki',
    type: 'MINION',
    manaCost: 1,
    attack: 1,
    health: 1,
    baseHealth: 1,
    attributes: ['Ninja'],
    description: 'Can attack immediately. After attacking, draw a card.',
    imageUrl: '/images/cards/ibuki.png',
    canAttackImmediately: true,
    onAttack: (gameState, attackerIndex, playerType) => {
        const newState = { ...gameState };
        const player = newState.players[playerType];
        
        // Draw a card after attacking
        if (player.deck.length > 0) {
            const drawnCard = player.deck.pop();
            if (player.hand.length < 10) {
                player.hand.push(drawnCard);
                newState.actionLog.push(`Ibuki's agility lets ${player.name} draw a card`);
            }
        }
        
        return newState;
    }
}; 