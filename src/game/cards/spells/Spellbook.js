import { CardLoader } from '../../utils/CardLoader.js';

export const Spellbook = {
    id: 'spellbook',
    name: 'Spellbook',
    type: 'SPELL',
    manaCost: 1,
    description: 'Create a random spell in your hand and reduce its cost by 1.',
    imageUrl: '/images/cards/spellbook.png',
    requiresTarget: false,

    effect: (gameState) => {
        const newState = { ...gameState };
        const currentPlayer = newState.players[newState.currentTurn];

        // Get all spells from the card registry
        const allSpells = CardLoader.getAllCards().filter(card => 
            card.type === 'SPELL' && card.id !== 'spellbook' // Exclude Spellbook itself
        );

        if (allSpells.length > 0) {
            // Select a random spell
            const randomSpell = { ...allSpells[Math.floor(Math.random() * allSpells.length)] };
            
            // Reduce its cost by 1 (minimum 0)
            randomSpell.manaCost = Math.max(0, randomSpell.manaCost - 1);

            // Add animation to show card generation
            randomSpell.animation = {
                isGenerated: true,
                effect: 'dark-summon'
            };

            // Add the spell to hand
            currentPlayer.hand.push(randomSpell);

            newState.actionLog.push(`${currentPlayer.name} created a ${randomSpell.name} (Cost: ${randomSpell.manaCost})`);
        }

        return newState;
    }
}; 