export const Berserk = {
    id: 'berserk',
    name: 'Berserk',
    type: 'SPELL',
    manaCost: 4,
    description: 'Give all allied minions +3 attack this turn.',
    imageUrl: 'images/cards/berserk.png',
    requiresTarget: false,

    effect: (gameState, targetInfo) => {
        const newState = { ...gameState };
        const currentPlayer = newState.players[newState.currentTurn];
        let buffedMinions = 0;

        // Apply buff to all allied minions
        currentPlayer.board.forEach((card, index) => {
            if (card && card.type === 'MINION') {
                // Initialize buffs array if it doesn't exist
                if (!card.buffs) {
                    card.buffs = [];
                }

                // Add the berserk buff
                card.buffs.push({
                    type: 'BERSERK',
                    name: 'Berserk',
                    description: '+3 Attack',
                    effect: 'attack',
                    value: 3,
                    duration: 1,
                    source: 'Berserk'
                });

                // Apply the attack boost
                card.attack += 3;
                buffedMinions++;

                // Add berserk animation
                card.animation = {
                    isBerserking: true,
                    effect: 'berserk'
                };
            }
        });

        if (buffedMinions > 0) {
            newState.actionLog.push(`All allied minions gained +3 attack this turn!`);
        } else {
            newState.actionLog.push(`No minions to buff!`);
        }

        return newState;
    }
}; 