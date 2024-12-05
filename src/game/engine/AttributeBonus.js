export class AttributeBonus {
    static calculateGodBonus(state, playerType) {
        if (!state?.players?.[playerType]?.board) return 0;
        const godCount = state.players[playerType].board.filter(card => 
            card?.attributes?.includes('God')).length;
        return godCount; // -1 cost per God
    }

    static calculateNinjaBonus(state, playerType) {
        if (!state?.players?.[playerType]?.board) return false;
        const ninjaCount = state.players[playerType].board.filter(card => 
            card?.attributes?.includes('Ninja')).length;
        return ninjaCount === 1 || ninjaCount === 6;
    }

    static calculateWarriorBonus(state, card, playerType) {
        if (!state?.players?.[playerType]?.board) return 0;
        const warriorCount = state.players[playerType].board.filter(c => 
            c?.attributes?.includes('Warrior') && c !== card).length;
        return warriorCount; // +1 attack per other warrior
    }

    static calculateHealerBonus(state, playerType) {
        if (!state?.players?.[playerType]?.board) return { count: 0, bonus: 0 };
        const healerCount = state.players[playerType].board.filter(card => 
            card?.attributes?.includes('Healer')).length;
        
        if (healerCount <= 0) return { count: 0, bonus: 0 };
        if (healerCount <= 2) return { count: 1, bonus: 1 };
        if (healerCount <= 4) return { count: 1, bonus: 3 };
        if (healerCount === 5) return { count: 2, bonus: 3 };
        return { count: -1, bonus: 4 }; // -1 means all allies
    }

    static calculateHunterBonus(card) {
        if (!card) return 0;
        // The actual increment happens in GameEngine
        return card.hunterBonusAttack || 0;
    }

    static shouldTriggerPrimalDraw(state, playerType) {
        if (!state?.players?.[playerType]?.board) return false;
        const primalCount = state.players[playerType].board.filter(card => 
            card?.attributes?.includes('Primal')).length;
        return primalCount >= 2;
    }

    static calculateCasterBonus(state, card, playerType) {
        if (!state?.players?.[playerType]?.board) return 0;
        const casterCount = state.players[playerType].board.filter(c => 
            c?.attributes?.includes('Caster')).length;
        return casterCount >= 2 ? 1 : 0; // +1 spell damage with 2+ casters
    }

    static getAttributeBuffs(state, card, playerType) {
        if (!card || !state?.players?.[playerType]?.board) return [];
        
        const buffs = [];
        
        // Ninja bonus
        const hasNinjaBonus = this.calculateNinjaBonus(state, playerType);
        if (hasNinjaBonus && card.attributes?.includes('Ninja')) {
            buffs.push({
                type: 'NINJA_BONUS',
                name: 'Ninja Power',
                description: 'Stats doubled from Ninja synergy',
                effect: 'stats',
                value: card.baseAttack,
                source: 'ninja-synergy'
            });
        }

        // Warrior bonus
        const warriorBonus = this.calculateWarriorBonus(state, card, playerType);
        if (warriorBonus > 0 && card.attributes?.includes('Warrior')) {
            buffs.push({
                type: 'WARRIOR_BONUS',
                name: 'Warrior Might',
                description: `+${warriorBonus} Attack from Warrior synergy`,
                effect: 'attack',
                value: warriorBonus,
                source: 'warrior-synergy'
            });
        }

        // Hunter bonus
        const hunterBonus = this.calculateHunterBonus(card);
        if (hunterBonus > 0 && card.attributes?.includes('Hunter')) {
            buffs.push({
                type: 'HUNTER_BONUS',
                name: 'Hunter\'s Mark',
                description: `+${hunterBonus} Attack from Hunter synergy`,
                effect: 'attack',
                value: hunterBonus,
                source: 'hunter-synergy'
            });
        }

        // Caster bonus
        const casterBonus = this.calculateCasterBonus(state, card, playerType);
        if (casterBonus > 0 && card.attributes?.includes('Caster')) {
            buffs.push({
                type: 'CASTER_BONUS',
                name: 'Spell Power',
                description: '+1 Spell Damage from Caster synergy',
                effect: 'spell_damage',
                value: casterBonus,
                source: 'caster-synergy'
            });
        }

        // God bonus (only for cards in hand)
        if (card.location === 'hand') {
            const godBonus = this.calculateGodBonus(state, playerType);
            if (godBonus > 0) {
                buffs.push({
                    type: 'GOD_BONUS',
                    name: 'Divine Discount',
                    description: `-${godBonus} Cost from God synergy`,
                    effect: 'cost',
                    value: -godBonus,
                    source: 'god-synergy'
                });
            }
        }

        // Healer bonus
        const healerBonus = this.calculateHealerBonus(state, playerType);
        if (healerBonus.bonus > 0 && card.hasHealerBonus) {
            buffs.push({
                type: 'HEALER_BONUS',
                name: 'Healing Touch',
                description: `+${healerBonus.bonus} Health from Healer synergy`,
                effect: 'health',
                value: healerBonus.bonus,
                source: 'healer-synergy'
            });
        }

        return buffs;
    }
} 