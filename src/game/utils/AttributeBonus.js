export class AttributeBonus {
    static calculateWarriorBonus(gameState, card, playerType) {
        const board = gameState.players[playerType].board;
        let bonus = 0;
        
        // Count allies excluding self
        board.forEach((ally, index) => {
            if (ally && ally !== card) {
                bonus += 1; // +1 for each ally
                if (ally.attributes && ally.attributes.includes('Warrior')) {
                    bonus += 1; // Additional +1 for Warrior allies
                }
            }
        });

        return bonus;
    }

    static calculateNinjaBonus(gameState, card, playerType) {
        const board = gameState.players[playerType].board;
        let ninjaCount = 0;

        // Count total ninjas
        board.forEach(ally => {
            if (ally && ally.attributes && ally.attributes.includes('Ninja')) {
                ninjaCount++;
            }
        });

        // Check if conditions are met for ninja bonus
        const shouldHaveBonus = ninjaCount === 1 || ninjaCount === 6;
        
        // If card should have bonus
        if (shouldHaveBonus) {
            // If card doesn't have bonus yet
            if (!card.buffs?.some(buff => buff.type === 'NINJA_BONUS')) {
                return {
                    attack: card.baseAttack || card.attack,
                    health: card.baseHealth || card.health,
                    shouldApply: true
                };
            }
            // If card already has bonus, maintain it
            return {
                attack: 0,
                health: 0,
                shouldApply: false,
                maintainBonus: true
            };
        }
        
        // If conditions aren't met, remove bonus
        return {
            attack: 0,
            health: 0,
            shouldApply: false,
            maintainBonus: false
        };
    }

    static calculateCasterBonus(gameState, playerType) {
        const board = gameState.players[playerType].board;
        let casterCount = 0;

        // Count total casters
        board.forEach(card => {
            if (card && card.attributes && card.attributes.includes('Caster')) {
                casterCount++;
            }
        });

        // Return mana reduction
        if (casterCount >= 4) return 2;
        if (casterCount >= 2) return 1;
        return 0;
    }

    static calculateDemonBonus(gameState, playerType) {
        const board = gameState.players[playerType].board;
        let demonCount = 0;

        // Count total demons
        board.forEach(card => {
            if (card && card.attributes && card.attributes.includes('Demon')) {
                demonCount++;
            }
        });

        return demonCount >= 3;
    }

    static applyDemonBonus(gameState, playerType) {
        const board = gameState.players[playerType].board;
        
        board.forEach(card => {
            if (card && card.attributes && card.attributes.includes('Demon')) {
                card.attack += 2;
                card.health += 2;
                card.baseHealth += 2;
                
                // Add buff to track the bonus
                if (!card.buffs) card.buffs = [];
                card.buffs.push({
                    type: 'DEMON_BONUS',
                    name: 'Demon Power',
                    description: '+2/+2 from enemy death',
                    effect: 'stats',
                    value: 2,
                    source: 'demon-synergy'
                });
                
                // Add visual effect
                card.animation = {
                    isBuffed: true,
                    effect: 'demon-power'
                };
            }
        });
    }

    static getActiveAttributeBonuses(gameState, playerType) {
        const bonuses = [];
        const board = gameState.players[playerType].board;
        
        // Check for Warrior bonus
        const hasWarriors = board.some(card => card?.attributes?.includes('Warrior'));
        if (hasWarriors) {
            const warriorCount = board.filter(card => card?.attributes?.includes('Warrior')).length;
            bonuses.push({
                attribute: 'Warrior',
                description: `+1 attack per ally (+2 if Warrior) [${warriorCount} Warriors]`
            });
        }

        // Check for Ninja bonus
        const ninjaCount = board.filter(card => card?.attributes?.includes('Ninja')).length;
        if (ninjaCount === 1 || ninjaCount === 6) {
            bonuses.push({
                attribute: 'Ninja',
                description: ninjaCount === 1 ? 'Double stats (solo Ninja)' : 'Double stats (6 Ninjas)'
            });
        }

        // Check for Caster bonus
        const casterCount = board.filter(card => card?.attributes?.includes('Caster')).length;
        if (casterCount >= 2) {
            bonuses.push({
                attribute: 'Caster',
                description: casterCount >= 4 ? 'Spells cost 2 less' : 'Spells cost 1 less'
            });
        }

        // Check for Demon bonus
        const demonCount = board.filter(card => card?.attributes?.includes('Demon')).length;
        if (demonCount >= 3) {
            bonuses.push({
                attribute: 'Demon',
                description: `Demons gain +2/+2 when enemies die [${demonCount} Demons]`
            });
        }

        return bonuses;
    }

    static getAttributeBuffs(card) {
        const buffs = [];
        if (!card.attributes) return buffs;

        card.attributes.forEach(attr => {
            switch (attr) {
                case 'Warrior':
                    buffs.push({
                        type: 'ATTRIBUTE',
                        name: 'Warrior',
                        description: 'Gains attack based on allies',
                        effect: 'attack',
                        source: 'attribute'
                    });
                    break;
                case 'Ninja':
                    buffs.push({
                        type: 'ATTRIBUTE',
                        name: 'Ninja',
                        description: 'May double stats based on Ninja count',
                        effect: 'stats',
                        source: 'attribute'
                    });
                    break;
                case 'Caster':
                    buffs.push({
                        type: 'ATTRIBUTE',
                        name: 'Caster',
                        description: 'Reduces spell costs',
                        effect: 'mana',
                        source: 'attribute'
                    });
                    break;
                case 'Demon':
                    buffs.push({
                        type: 'ATTRIBUTE',
                        name: 'Demon',
                        description: 'Gains stats when enemies die',
                        effect: 'stats',
                        source: 'attribute'
                    });
                    break;
            }
        });

        return buffs;
    }
} 