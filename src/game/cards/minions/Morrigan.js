export const Morrigan = {
    id: 'morrigan',
    name: 'Morrigan',
    type: 'MINION',
    manaCost: 4,
    attack: 1,
    health: 6,
    baseHealth: 6,
    attributes: ['Demon', 'Caster', 'Love'],
    description: 'At the start of your turn, deals 1 damage to a random enemy minion.',
    imageUrl: '/images/cards/morrigan.png',
    onTurnStart: (gameState, index, playerType) => {
        let newState = { ...gameState };
        const opponent = playerType === 'player' ? 'opponent' : 'player';
        const validTargets = newState.players[opponent].board
            .map((card, idx) => card ? { card, index: idx } : null)
            .filter(target => target !== null);

        if (validTargets.length > 0) {
            const randomTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
            const targetCard = randomTarget.card;
            
            if (targetCard.onDamaged) {
                newState = targetCard.onDamaged(newState, 1, randomTarget.index, opponent);
            } else {
                targetCard.health -= 1;
                targetCard.animation = {
                    isDamaged: true,
                    effect: 'thorn-damage'
                };

                const morriganCard = newState.players[playerType].board[index];
                if (morriganCard) {
                    morriganCard.animation = {
                        effect: 'thorn-damage'
                    };
                }

                newState.actionLog.push(`Morrigan's thorns dealt 1 damage to ${targetCard.name}`);

                if (targetCard.health <= 0) {
                    newState.players[opponent].board[randomTarget.index] = null;
                    newState.actionLog.push(`${targetCard.name} was destroyed`);
                }
            }
        }

        return newState;
    }
}; 