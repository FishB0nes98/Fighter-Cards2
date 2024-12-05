export const Panda = {
    id: 'panda',
    name: 'Panda',
    type: 'MINION',
    manaCost: 6,
    attack: 3,
    health: 5,
    baseHealth: 5,
    attributes: ['Primal', 'Beast'],
    description: 'While Panda is on the field, all allies gain +2 max HP (aura).',
    imageUrl: 'images/cards/panda.png',

    onPlay: (gameState, index, playerType) => {
        const newState = { ...gameState };
        const currentPlayer = newState.players[playerType];

        // Apply aura to all allies including Panda
        currentPlayer.board.forEach((card, cardIndex) => {
            if (card && card.type === 'MINION') {
                if (!card.buffs) card.buffs = [];
                
                // Add aura buff
                card.buffs.push({
                    type: 'AURA',
                    name: 'Panda\'s Protection',
                    description: '+2 Max HP',
                    effect: 'maxHealth',
                    value: 2,
                    source: 'panda',
                    sourceIndex: index,
                    duration: 'aura'
                });

                // Apply the max HP increase
                card.baseHealth += 2;
                card.health += 2;
            }
        });

        return newState;
    },

    onRemove: (gameState, index, playerType) => {
        const newState = { ...gameState };
        const currentPlayer = newState.players[playerType];

        // Remove aura from all affected allies
        currentPlayer.board.forEach(card => {
            if (card && card.type === 'MINION') {
                // Find and remove Panda's aura buff
                const auraIndex = card.buffs?.findIndex(buff => 
                    buff.type === 'AURA' && 
                    buff.source === 'panda' && 
                    buff.sourceIndex === index
                );

                if (auraIndex !== -1) {
                    // Calculate health percentage before removing buff
                    const healthPercentage = card.health / card.baseHealth;
                    
                    // Remove the buff
                    card.buffs.splice(auraIndex, 1);
                    
                    // Decrease max HP
                    card.baseHealth -= 2;
                    
                    // Calculate new health while maintaining percentage, minimum 1
                    card.health = Math.max(1, Math.floor(healthPercentage * card.baseHealth));
                }
            }
        });

        return newState;
    }
}; 