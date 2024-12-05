export const RMika = {
    id: 'r-mika',
    name: 'R Mika',
    type: 'MINION',
    manaCost: 5,
    attack: 0,
    health: 8,
    baseHealth: 8,
    attributes: ['Warrior'],
    description: 'Adjacent allies gain +2/+2. Gains +2 attack for each ally on the board.',
    imageUrl: 'images/cards/R Mika.png',

    // Called when played or when board state changes
    onPlay: (gameState, index, playerType) => {
        let newState = { ...gameState };
        const player = newState.players[playerType];

        // Apply aura to adjacent minions
        applyAdjacentAuras(newState, index, playerType);

        // Calculate R Mika's attack bonus
        updateMikaAttack(newState, index, playerType);

        return newState;
    },

    // Update when board changes
    onBoardChanged: (gameState, index, playerType) => {
        let newState = { ...gameState };
        
        // Recalculate R Mika's attack
        updateMikaAttack(newState, index, playerType);
        
        return newState;
    },

    // Remove auras when R Mika leaves the board
    onRemove: (gameState, index, playerType) => {
        let newState = { ...gameState };
        const player = newState.players[playerType];

        // Remove auras from adjacent minions
        removeAdjacentAuras(newState, index, playerType);

        return newState;
    }
};

// Helper function to apply auras to adjacent minions
function applyAdjacentAuras(gameState, index, playerType) {
    const player = gameState.players[playerType];
    const board = player.board;

    // First remove any existing R Mika auras to prevent stacking
    removeAdjacentAuras(gameState, index, playerType);

    // Check left adjacent minion
    if (index > 0 && board[index - 1]) {
        const leftMinion = board[index - 1];
        if (!leftMinion.buffs) leftMinion.buffs = [];
        
        leftMinion.buffs.push({
            type: 'AURA',
            name: 'Tag Team Power',
            description: '+2/+2 from R Mika',
            effect: 'stats',
            attack: 2,
            health: 2,
            source: 'r-mika',
            sourceIndex: index,
            class: 'tag-team'
        });

        leftMinion.attack += 2;
        leftMinion.baseHealth += 2;
        leftMinion.health += 2;

        // Add buff animation and arrow effect
        leftMinion.animation = {
            isBuffed: true,
            effect: 'tag-team',
            duration: 1500,
            showArrow: true
        };
    }

    // Check right adjacent minion
    if (index < board.length - 1 && board[index + 1]) {
        const rightMinion = board[index + 1];
        if (!rightMinion.buffs) rightMinion.buffs = [];
        
        rightMinion.buffs.push({
            type: 'AURA',
            name: 'Tag Team Power',
            description: '+2/+2 from R Mika',
            effect: 'stats',
            attack: 2,
            health: 2,
            source: 'r-mika',
            sourceIndex: index,
            class: 'tag-team'
        });

        rightMinion.attack += 2;
        rightMinion.baseHealth += 2;
        rightMinion.health += 2;

        // Add buff animation and arrow effect
        rightMinion.animation = {
            isBuffed: true,
            effect: 'tag-team',
            duration: 1500,
            showArrow: true
        };
    }
}

// Helper function to remove auras from adjacent minions
function removeAdjacentAuras(gameState, index, playerType) {
    const player = gameState.players[playerType];
    const board = player.board;

    [-1, 1].forEach(offset => {
        const adjacentIndex = index + offset;
        if (adjacentIndex >= 0 && adjacentIndex < board.length && board[adjacentIndex]) {
            const minion = board[adjacentIndex];
            
            // Remove R Mika's aura buffs
            if (minion.buffs) {
                // Find all R Mika auras from this source
                const auraIndices = minion.buffs
                    .map((buff, idx) => 
                        buff.type === 'AURA' && 
                        buff.source === 'r-mika' && 
                        buff.sourceIndex === index ? idx : -1
                    )
                    .filter(idx => idx !== -1)
                    .reverse(); // Reverse to remove from end to start

                // Remove each aura and its effects
                auraIndices.forEach(auraIndex => {
                    // Remove stats
                    minion.attack -= 2;
                    minion.baseHealth -= 2;
                    minion.health = Math.max(1, minion.health - 2);
                    
                    // Remove the buff
                    minion.buffs.splice(auraIndex, 1);
                });
            }
        }
    });
}

// Helper function to update R Mika's attack based on allies
function updateMikaAttack(gameState, index, playerType) {
    const player = gameState.players[playerType];
    const mika = player.board[index];
    
    if (mika && mika.id === 'r-mika') {
        // Count allies on board (excluding R Mika)
        const allyCount = player.board.filter(card => card && card !== mika).length;
        
        // Calculate new attack (2 per ally)
        const newAttack = allyCount * 2;
        
        // Only update if attack value changed
        if (mika.attack !== newAttack) {
            mika.attack = newAttack;
            
            // Add power up animation if attack increased
            mika.animation = {
                isPoweredUp: true,
                effect: 'power-up',
                duration: 1500
            };
        }
    }
} 