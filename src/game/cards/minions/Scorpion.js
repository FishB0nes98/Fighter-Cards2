export const Scorpion = {
    id: 'scorpion',
    name: 'Scorpion',
    type: 'MINION',
    manaCost: 3,
    attack: 2,
    health: 4,
    baseHealth: 4,
    baseAttack: 2,
    attributes: ['Demon', 'Ninja'],
    description: 'Battlecry: Hook the weakest enemy minion to the field and attack it. If it dies, gain +2 attack.',
    imageUrl: 'images/cards/scorpion.png',

    battlecry: function(gameState) {
        const newState = { ...gameState };
        const currentPlayer = newState.players[newState.currentTurn];
        const opponent = newState.players[newState.currentTurn === 'player' ? 'opponent' : 'player'];
        
        // Find Scorpion's position
        const scorpionIndex = currentPlayer.board.findIndex(card => 
            card && card.id === 'scorpion' && card.isNewlyPlayed);
        
        if (scorpionIndex === -1) return newState;
        
        // Find the weakest minion in opponent's hand
        const weakestMinion = opponent.hand
            .map((card, index) => ({ card, index }))
            .filter(({ card }) => card.type === 'MINION')
            .sort((a, b) => (a.card.attack + a.card.health) - (b.card.attack + b.card.health))[0];

        if (!weakestMinion) return newState;

        // Find an empty slot on opponent's board
        const emptySlotIndex = opponent.board.findIndex(slot => slot === null);
        if (emptySlotIndex === -1) return newState;

        // Add hook animation to Scorpion
        currentPlayer.board[scorpionIndex].animation = {
            isHooking: true,
            effect: 'hook',
            targetIndex: emptySlotIndex,
            targetPlayerType: newState.currentTurn === 'player' ? 'opponent' : 'player'
        };

        // Move the minion from hand to board
        const targetCard = { ...opponent.hand[weakestMinion.index] };
        opponent.hand.splice(weakestMinion.index, 1);
        opponent.board[emptySlotIndex] = targetCard;

        // Add pulled animation to the target
        targetCard.animation = {
            isPulled: true,
            effect: 'hook-pulled'
        };

        newState.actionLog.push(`Scorpion hooked ${targetCard.name} to the battlefield!`);

        // Attack the pulled minion
        targetCard.health -= currentPlayer.board[scorpionIndex].attack;
        
        // Check if target dies and grant attack bonus
        if (targetCard.health <= 0) {
            opponent.board[emptySlotIndex] = null;
            currentPlayer.board[scorpionIndex].attack += 2;
            currentPlayer.board[scorpionIndex].baseAttack += 2;
            newState.actionLog.push(`${targetCard.name} was destroyed! Scorpion's attack increased by 2!`);
        }

        return newState;
    }
}; 