export const Yugo = {
    id: 'yugo-human',
    name: 'Yugo: Human',
    type: 'MINION',
    manaCost: 4,
    attack: 3,
    health: 4,
    baseHealth: 4,
    attributes: ['Shapeshifter'],
    description: 'Transforms into a wolf after killing an enemy minion.',
    imageUrl: '/images/cards/yugo_human.png',
    onKill: (gameState, index, playerType) => {
        const newState = { ...gameState };
        const card = newState.players[playerType].board[index];

        // Only transform if in human form and survived
        if (card && card.id === 'yugo-human' && card.health > 0) {
            // Transform into wolf form
            card.id = 'yugo-wolf';
            card.name = 'Yugo: Wolf';
            card.attack = 5;
            card.health = 6;
            card.baseHealth = 6;
            card.attributes = ['Shapeshifter', 'Beast'];
            card.description = 'Heals 1 HP after killing a minion.';
            card.imageUrl = '/images/cards/yugo_wolf.png';
            
            // Full heal on transformation
            card.health = card.baseHealth;

            // Add transform animation
            card.animation = {
                effect: 'transform',
                from: 'human',
                to: 'wolf'
            };

            // Update onKill effect for wolf form
            card.onKill = (gameState, index, playerType) => {
                const newState = { ...gameState };
                const wolfCard = newState.players[playerType].board[index];
                
                if (wolfCard && wolfCard.health > 0) {
                    // Heal 1 HP after kill
                    wolfCard.health = Math.min(wolfCard.health + 1, wolfCard.baseHealth);
                    wolfCard.animation = {
                        effect: 'nature-heal'
                    };
                    newState.actionLog.push(`Yugo healed 1 HP after the kill`);
                }
                
                return newState;
            };

            newState.actionLog.push(`Yugo transformed into his wolf form!`);
        }

        return newState;
    },
    // Add onDamaged to handle kills when being attacked
    onDamaged: (gameState, damage, index, playerType) => {
        let newState = { ...gameState };
        const card = newState.players[playerType].board[index];
        
        // Apply damage first
        card.health -= damage;
        card.animation = {
            isDamaged: true
        };
        
        // If the attacker died (meaning Yugo killed it in combat)
        const opponent = playerType === 'player' ? 'opponent' : 'player';
        const attackerIndex = newState.animations?.sourceIndex;
        if (attackerIndex !== undefined && 
            !newState.players[opponent].board[attackerIndex] && 
            card && card.id === 'yugo-human' && 
            card.health > 0) {
            // Call onKill effect
            newState = card.onKill(newState, index, playerType);
        }
        
        return newState;
    }
}; 