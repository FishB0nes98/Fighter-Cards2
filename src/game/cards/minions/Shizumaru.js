export const Shizumaru = {
    id: 'shizumaru',
    name: 'Shizumaru',
    type: 'MINION',
    manaCost: 3,
    attack: 4,
    health: 3,
    baseHealth: 3,
    attributes: ['Warrior', 'Ninja'],
    description: 'Immune to harmful spells.',
    imageUrl: '/images/cards/shizumaru.png',

    // Override onDamaged to handle spell immunity
    onDamaged: (gameState, damage, index, playerType, source) => {
        let newState = { ...gameState };
        const card = newState.players[playerType].board[index];

        // Check if damage is from a spell
        if (source?.type === 'SPELL') {
            // Add spell deflect animation
            card.animation = {
                isDeflecting: true,
                effect: 'spell-deflect'
            };
            newState.actionLog.push(`${card.name} deflected the spell!`);
            return newState;
        }

        // Handle normal damage
        card.health -= damage;
        card.animation = {
            isDamaged: true
        };

        // Check if dies from damage
        if (card.health <= 0) {
            newState.players[playerType].board[index] = null;
            newState.actionLog.push(`${card.name} was destroyed`);
        }

        return newState;
    },

    // Override canBeTargeted to prevent harmful spell targeting
    canBeTargeted: (gameState, targetInfo, sourceCard) => {
        // Allow targeting by minions and beneficial spells
        if (!sourceCard || sourceCard.type !== 'SPELL') return true;

        // List of harmful spells
        const harmfulSpells = ['purify', 'hadoken', 'weaken', 'arrow'];
        return !harmfulSpells.includes(sourceCard.id);
    }
}; 