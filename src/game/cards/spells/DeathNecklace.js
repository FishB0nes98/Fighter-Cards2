import { CardLoader } from '../../utils/CardLoader.js';

export const DeathNecklace = {
    id: 'death-necklace',
    name: 'Death Necklace',
    type: 'SPELL',
    manaCost: 5,
    description: 'Place a Reviving buff on a minion. When it dies, it will be resurrected with base stats.',
    imageUrl: 'images/cards/death_necklace.png',
    requiresTarget: true,

    canTarget: (gameState, targetInfo) => {
        if (!targetInfo?.playerType || targetInfo?.index === undefined) return false;
        const target = gameState.players[targetInfo.playerType].board[targetInfo.index];
        return target && target.type === 'MINION' && 
               !target.buffs?.some(buff => buff.type === 'REVIVING');
    },

    effect: (gameState, targetInfo) => {
        const newState = { ...gameState };
        
        if (targetInfo?.playerType && targetInfo?.index !== undefined) {
            const target = newState.players[targetInfo.playerType].board[targetInfo.index];
            if (target) {
                // Initialize buffs array if it doesn't exist
                if (!target.buffs) target.buffs = [];

                // Add the reviving buff
                target.buffs.push({
                    type: 'REVIVING',
                    name: 'Death\'s Protection',
                    description: 'When this minion dies, it will be resurrected with base stats.',
                    source: 'death-necklace',
                    onDeath: (state, index, playerType) => {
                        const newState = { ...state };
                        const player = newState.players[playerType];
                        
                        // Get original card stats
                        const originalCard = CardLoader.getCardById(target.id);
                        if (!originalCard) return newState;

                        // Create resurrected version with base stats
                        const resurrectedCard = {
                            ...originalCard,
                            isNewlyPlayed: true,
                            hasAttackedThisTurn: true,
                            animation: {
                                isReviving: true,
                                effect: 'revive'
                            },
                            buffs: [] // Clear all buffs
                        };

                        // Place the resurrected card
                        player.board[index] = resurrectedCard;
                        
                        newState.actionLog.push(`${target.name} was resurrected by Death's Protection!`);
                        return newState;
                    }
                });

                // Add necklace animation
                target.animation = {
                    isBuffed: true,
                    effect: 'death-necklace'
                };

                newState.actionLog.push(`Death Necklace was placed on ${target.name}`);
            }
        }

        return newState;
    }
}; 