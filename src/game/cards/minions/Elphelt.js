export const Elphelt = {
    id: 'elphelt',
    name: 'Elphelt',
    type: 'MINION',
    manaCost: 5,
    attack: 3,
    health: 5,
    baseHealth: 5,
    attributes: ['Love', 'Hunter'],
    description: 'Whenever she damages a card or is damaged by a card, reduces its attack by 2.',
    imageUrl: '/images/cards/elphelt.png',

    // When Elphelt attacks
    onAttack: (gameState, index, playerType) => {
        const newState = { ...gameState };
        const opponent = playerType === 'player' ? 'opponent' : 'player';
        const targetIndex = newState.animations?.targetIndex;

        if (targetIndex !== undefined) {
            const target = newState.players[opponent].board[targetIndex];
            if (target && target.attack > 0) {
                // Add weaken animation
                target.animation = {
                    isWeakened: true,
                    effect: 'weaken'
                };

                // Add debuff
                if (!target.buffs) target.buffs = [];
                target.buffs.push({
                    type: 'WEAKEN',
                    name: 'Love\'s Embrace',
                    description: '-2 Attack',
                    effect: 'attack',
                    value: -2,
                    source: 'elphelt',
                    duration: 'permanent'
                });

                // Reduce attack
                target.attack = Math.max(0, target.attack - 2);
                target.baseAttack = Math.max(0, target.baseAttack - 2);

                newState.actionLog.push(`Elphelt reduced ${target.name}'s attack by 2`);
            }
        }

        return newState;
    },

    // When Elphelt is damaged
    onDamaged: (gameState, damage, index, playerType) => {
        let newState = { ...gameState };
        const opponent = playerType === 'player' ? 'opponent' : 'player';
        const sourceIndex = newState.animations?.sourceIndex;
        
        // Apply damage first
        const elphelt = newState.players[playerType].board[index];
        elphelt.health -= damage;
        elphelt.animation = {
            isDamaged: true
        };

        // Then apply her effect to the attacker
        if (sourceIndex !== undefined) {
            const attacker = newState.players[opponent].board[sourceIndex];
            if (attacker && attacker.attack > 0) {
                // Add weaken animation
                attacker.animation = {
                    isWeakened: true,
                    effect: 'weaken'
                };

                // Add debuff
                if (!attacker.buffs) attacker.buffs = [];
                attacker.buffs.push({
                    type: 'WEAKEN',
                    name: 'Love\'s Embrace',
                    description: '-2 Attack',
                    effect: 'attack',
                    value: -2,
                    source: 'elphelt',
                    duration: 'permanent'
                });

                // Reduce attack
                attacker.attack = Math.max(0, attacker.attack - 2);
                attacker.baseAttack = Math.max(0, attacker.baseAttack - 2);

                newState.actionLog.push(`Elphelt reduced ${attacker.name}'s attack by 2`);
            }
        }

        return newState;
    }
}; 