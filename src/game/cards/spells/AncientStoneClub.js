export const AncientStoneClub = {
    id: 'ancient-stone-club',
    name: 'Ancient Stone Club',
    type: 'SPELL',
    manaCost: 2,
    description: 'Give all Primal minions +2 attack permanently.',
    imageUrl: '/images/cards/ancient_stone_club.png',
    effect: (gameState) => {
        let newState = { ...gameState };
        const currentPlayer = newState.players[newState.currentTurn];
        let buffedCount = 0;

        // Buff all Primal minions
        currentPlayer.board.forEach((card, idx) => {
            // Check if card exists, is a minion, and has attributes before checking for Primal
            if (card && card.type === 'MINION' && card.attributes && card.attributes.includes('Primal')) {
                // Initialize buffs array if it doesn't exist
                if (!card.buffs) card.buffs = [];
                
                // Add buff
                card.buffs.push({
                    type: 'PERMANENT',
                    name: 'Ancient Power',
                    description: '+2 Attack',
                    effect: 'attack',
                    value: 2,
                    source: 'Ancient Stone Club',
                    duration: 'permanent'
                });

                // Update stats
                card.attack += 2;
                card.baseAttack = (card.baseAttack || card.attack) + 2;

                // Add animation
                card.animation = {
                    isBuffed: true,
                    effect: 'primal-power',
                    duration: 1500
                };

                buffedCount++;
                newState.actionLog.push(`${card.name} gained +2 attack from Ancient Stone Club`);
            }
        });

        if (buffedCount === 0) {
            newState.actionLog.push('No Primal minions to buff!');
        }

        return newState;
    }
}; 