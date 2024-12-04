import { CardLoader } from '../utils/CardLoader.js';

export class GameEngine {
    constructor(playerDeck, opponentDeck) {
        // Generate random buff field positions
        const playerBuffField = Math.floor(Math.random() * 6);
        const opponentBuffField = Math.floor(Math.random() * 6);

        this.state = {
            currentTurn: 'player',
            turnNumber: 1,
            gameStatus: 'IN_PROGRESS',
            winner: null,
            players: {
                player: {
                    name: 'Player',
                    health: 30,
                    maxMana: 1,
                    currentMana: 1,
                    deck: this.shuffleDeck([...playerDeck]),
                    hand: [],
                    board: Array(6).fill(null),
                    buffField: playerBuffField,
                    isBot: false
                },
                opponent: {
                    name: 'Opponent',
                    health: 30,
                    maxMana: 1,
                    currentMana: 1,
                    deck: this.shuffleDeck([...opponentDeck]),
                    hand: [],
                    board: Array(6).fill(null),
                    buffField: opponentBuffField,
                    isBot: true
                }
            },
            actionLog: [],
            animations: {
                isAnimating: false,
                type: null,
                sourceIndex: null,
                targetIndex: null,
                playerType: null
            },
            targetingState: null,
            isProcessingTurn: false
        };

        // Draw initial hands
        for (let i = 0; i < 4; i++) {
            this.drawCard(this.state.players.player);
            this.drawCard(this.state.players.opponent);
        }
    }

    getCurrentPlayer() {
        return this.state.currentTurn === 'player' 
            ? this.state.players.player 
            : this.state.players.opponent;
    }

    getOpponentPlayer() {
        return this.state.currentTurn === 'player' 
            ? this.state.players.opponent 
            : this.state.players.player;
    }

    getGameState() {
        return this.state;
    }

    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    drawCard(player) {
        if (player.deck.length === 0) {
            player.health -= 2;
            this.state.actionLog.push(`${player.name} took 2 fatigue damage`);
            
            if (player.health <= 0) {
                this.state.gameStatus = 'FINISHED';
                this.state.winner = this.state.currentTurn === 'player' ? 'opponent' : 'player';
            }
            if (typeof window !== 'undefined' && window.updateUI) {
                window.updateUI();
            }
            return;
        }
        
        if (player.hand.length < 10) {
            const drawnCard = player.deck.pop();
            player.hand.push(drawnCard);
            if (typeof window !== 'undefined' && window.updateUI) {
                window.updateUI();
            }
        }
    }

    addBuff(card, buff) {
        if (!card.buffs) {
            card.buffs = [];
        }
        card.buffs.push(buff);
    }

    applyBuffField(playerType, slotIndex) {
        const player = this.state.players[playerType];
        if (slotIndex === player.buffField && player.board[slotIndex]) {
            const card = player.board[slotIndex];
            this.addBuff(card, {
                type: 'BUFF_FIELD',
                name: 'Buff Field',
                description: '+1 HP per turn',
                effect: 'health',
                value: 1,
                duration: 'permanent',
                source: 'field'
            });
            card.health += 1;
            card.baseHealth += 1;
            this.state.actionLog.push(`${card.name} gained +1 HP from the buff field`);
        }
    }

    // New method to check and apply auras
    checkAndApplyAuras(playerType, targetIndex) {
        const player = this.state.players[playerType];
        const targetCard = player.board[targetIndex];
        
        if (!targetCard || targetCard.type !== 'MINION') return;

        // Check each minion on the board for auras
        player.board.forEach((card, index) => {
            if (card && card.id === 'panda' && index !== targetIndex) {
                if (!targetCard.buffs) targetCard.buffs = [];
                
                // Add aura buff
                targetCard.buffs.push({
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
                targetCard.baseHealth += 2;
                targetCard.health += 2;
            }
        });
    }

    // Add this method to handle board state changes
    checkBoardEffects(playerType, changedIndex) {
        const player = this.state.players[playerType];
        const board = player.board;

        // Check for R Mika and update her effects
        board.forEach((card, index) => {
            if (card && card.id === 'r-mika') {
                // Update R Mika's attack based on allies
                if (card.onBoardChanged) {
                    this.state = card.onBoardChanged(this.state, index, playerType);
                }
                // Reapply auras to adjacent minions
                if (card.onPlay) {
                    this.state = card.onPlay(this.state, index, playerType);
                }
            }
        });
    }

    playCard(cardIndex, targetInfo) {
        const currentPlayer = this.getCurrentPlayer();
        const card = currentPlayer.hand[cardIndex];

        if (!card || card.manaCost > currentPlayer.currentMana) {
            return false;
        }

        // Create a copy of the current state
        let newState = { ...this.state };
        
        // Remove card from hand and deduct mana
        currentPlayer.hand.splice(cardIndex, 1);
        currentPlayer.currentMana -= card.manaCost;

        if (card.type === 'MINION') {
            // Get the slot index from targetInfo
            const slotIndex = targetInfo?.index ?? currentPlayer.board.findIndex(slot => slot === null);

            if (slotIndex === -1 || currentPlayer.board[slotIndex] !== null) {
                return false;
            }

            const minionCard = { 
                ...card, 
                isNewlyPlayed: !card.canAttackImmediately,
                hasAttackedThisTurn: false,
                animation: {},
                buffs: [] // Initialize buffs array
            };
            
            currentPlayer.board[slotIndex] = minionCard;

            // Check if card is placed on buff field
            this.applyBuffField(this.state.currentTurn, slotIndex);
            
            // Check for and apply any auras from existing minions
            this.checkAndApplyAuras(this.state.currentTurn, slotIndex);
            
            // After placing minion, check board effects
            this.checkBoardEffects(this.state.currentTurn, slotIndex);
            
            // Trigger onPlay if it exists
            if (minionCard.onPlay) {
                newState = minionCard.onPlay(newState, slotIndex, this.state.currentTurn);
            }
            
            // Trigger battlecry if it exists
            if (minionCard.battlecry) {
                newState = minionCard.battlecry(newState, slotIndex);
            }

            newState.actionLog.push(`${currentPlayer.name} played ${card.name}`);
        } else if (card.type === 'SPELL') {
            // Check for Raiden's spell damage buff
            const hasRaiden = currentPlayer.board.some(card => card && card.id === 'raiden');
            if (hasRaiden && typeof card.damage === 'number') {
                card.damage += 1;
                this.state.actionLog.push(`Raiden's power increased the spell damage!`);
            }

            // For spells that don't require targets, just cast them
            if (!card.requiresTarget) {
                newState = card.effect(newState, targetInfo);
            }
            // Only try to cast targeted spell if we have a valid target
            else if (targetInfo && card.effect) {
                newState = card.effect(newState, targetInfo);
                newState.animations = {
                    isAnimating: true,
                    type: 'SPELL',
                    sourceIndex: cardIndex,
                    targetIndex: targetInfo.index,
                    playerType: newState.currentTurn
                };
            } else {
                return false;
            }

            // Trigger onSpellPlayed effects for all minions
            ['player', 'opponent'].forEach(playerType => {
                const player = newState.players[playerType];
                player.board.forEach((minion, index) => {
                    if (minion && minion.onSpellPlayed) {
                        newState = minion.onSpellPlayed(newState, index, playerType);
                    }
                });
            });
        }

        // Update the game state
        this.state = newState;
        if (typeof window !== 'undefined' && window.updateUI) {
            window.updateUI();
        }

        return true;
    }

    attack(attackerIndex, targetIndex) {
        const currentPlayer = this.getCurrentPlayer();
        const opponent = this.getOpponentPlayer();
        const attacker = currentPlayer.board[attackerIndex];
        const target = opponent.board[targetIndex];

        // Check if attacker can attack using custom or default logic
        if (!attacker || !target || attacker.isNewlyPlayed) {
            return false;
        }

        // Check for stun effect
        const isStunned = attacker.buffs?.some(buff => buff.type === 'STUN');
        if (isStunned) {
            return false;
        }

        // Use custom canAttack if available, otherwise use default check
        if (attacker.canAttack) {
            if (!attacker.canAttack(this.state, attackerIndex, this.state.currentTurn)) {
                return false;
            }
        } else if (attacker.hasAttackedThisTurn || attacker.buffs?.some(buff => buff.type === 'FREEZE')) {
            return false;
        }

        // Clear any existing animations
        currentPlayer.board.forEach(card => {
            if (card) card.animation = {};
        });
        opponent.board.forEach(card => {
            if (card) card.animation = {};
        });

        // Set up animation and targeting state
        this.state.animations = {
            sourceIndex: attackerIndex,
            targetIndex: targetIndex,
            isAnimating: true
        };

        // Add attack animations
        attacker.animation = {
            isAttacking: true
        };

        // Deal damage using onDamaged handlers if they exist
        if (target.onDamaged) {
            this.state = target.onDamaged(this.state, attacker.attack, targetIndex, this.state.currentTurn === 'player' ? 'opponent' : 'player');
        } else {
            target.health -= attacker.attack;
            target.animation = {
                isDamaged: true
            };
        }

        if (attacker.onDamaged) {
            this.state = attacker.onDamaged(this.state, target.attack, attackerIndex, this.state.currentTurn);
        } else {
            attacker.health -= target.attack;
            attacker.animation = {
                isDamaged: true
            };
        }

        // Trigger onAttack effect before death checks
        if (attacker.onAttack) {
            this.state = attacker.onAttack(this.state, attackerIndex, this.state.currentTurn);
        } else {
            // Only set hasAttackedThisTurn if card doesn't handle its own attack state
            attacker.hasAttackedThisTurn = true;
        }

        // Check for deaths and trigger onKill effects
        if (target.health <= 0) {
            // Before removing the minion, trigger board effects
            this.checkBoardEffects(this.state.currentTurn === 'player' ? 'opponent' : 'player', targetIndex);
            
            // Trigger onKill effect before removing the target
            if (attacker.onKill && attacker.health > 0) {
                this.state = attacker.onKill(this.state, attackerIndex, this.state.currentTurn);
            }
            
            // Check for onDeath effects from buffs
            const reviveBuff = target.buffs?.find(buff => buff.onDeath);
            if (reviveBuff) {
                this.state = reviveBuff.onDeath(this.state, targetIndex, this.state.currentTurn === 'player' ? 'opponent' : 'player');
            } else {
                // Only remove the minion if it wasn't revived
                opponent.board[targetIndex] = null;
                this.state.actionLog.push(`${target.name} was destroyed`);
            }
        }

        if (attacker.health <= 0) {
            // Before removing the minion, trigger board effects
            this.checkBoardEffects(this.state.currentTurn, attackerIndex);
            
            // Check for onDeath effects from buffs
            const reviveBuff = attacker.buffs?.find(buff => buff.onDeath);
            if (reviveBuff) {
                this.state = reviveBuff.onDeath(this.state, attackerIndex, this.state.currentTurn);
            } else {
                // Only remove the minion if it wasn't revived
                currentPlayer.board[attackerIndex] = null;
                this.state.actionLog.push(`${attacker.name} was destroyed`);
            }
        }

        // Schedule animation cleanup
        setTimeout(() => {
            if (attacker && !attacker.onKill) attacker.animation = {};
            if (target) target.animation = {};
            if (typeof window !== 'undefined' && window.updateUI) {
                window.updateUI();
            }
        }, 600);

        if (typeof window !== 'undefined' && window.updateUI) {
            window.updateUI();
        }

        return true;
    }

    // New method to process auras
    processAuras(playerType) {
        const player = this.state.players[playerType];
        
        // First, remove all existing aura buffs and their effects
        player.board.forEach(card => {
            if (card && card.type === 'MINION') {
                // Find and remove all aura buffs
                if (card.buffs) {
                    const auraBuffs = card.buffs.filter(buff => buff.type === 'AURA');
                    auraBuffs.forEach(auraBuff => {
                        // Remove the buff's effect
                        if (auraBuff.effect === 'maxHealth') {
                            card.baseHealth -= auraBuff.value;
                            // If health would go below 1, set it to 1
                            if (card.health > card.baseHealth) {
                                card.health = card.baseHealth;
                            }
                            if (card.health <= 0) {
                                card.health = 1;
                            }
                        }
                    });
                    // Remove all aura buffs
                    card.buffs = card.buffs.filter(buff => buff.type !== 'AURA');
                }
            }
        });

        // Then, apply auras from all current sources
        player.board.forEach((source, sourceIndex) => {
            if (source && source.id === 'panda') {
                // Apply Panda's aura to all minions
                player.board.forEach(card => {
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
                            sourceIndex: sourceIndex
                        });

                        // Apply the max HP increase
                        card.baseHealth += 2;
                        card.health += 2;
                    }
                });
            }
            // Add other aura effects here as needed
        });
    }

    endTurn() {
        if (this.state.isProcessingTurn) return;

        // Process turn end effects for the current player's minions
        const currentPlayer = this.getCurrentPlayer();
        currentPlayer.board.forEach((minion, index) => {
            if (minion) {
                // Keep stunned minions exhausted
                const isStunned = minion.buffs?.some(buff => buff.type === 'STUN');
                if (isStunned) {
                    minion.hasAttackedThisTurn = true;
                }

                if (minion.onTurnEnd) {
                    this.state = minion.onTurnEnd(this.state, index, this.state.currentTurn);
                }
            }
        });

        this.state.currentTurn = this.state.currentTurn === 'player' ? 'opponent' : 'player';
        
        // Only increment turn number and mana when opponent's turn ends (every 2nd turn)
        if (this.state.currentTurn === 'player') {
            this.state.turnNumber++;
            
            // Increment max mana for both players
            Object.values(this.state.players).forEach(player => {
                player.maxMana = Math.min(player.maxMana + 1, 10);
            });
        }

        // Always refresh current mana to max for the next player
        const nextPlayer = this.getCurrentPlayer();
        nextPlayer.currentMana = nextPlayer.maxMana;
        
        this.drawCard(nextPlayer);
        
        // Process turn start effects for the next player's minions
        nextPlayer.board.forEach((minion, index) => {
            if (minion && minion.onTurnStart) {
                this.state = minion.onTurnStart(this.state, index, this.state.currentTurn);
            }
        });

        // Process auras for both players
        this.processAuras('player');
        this.processAuras('opponent');

        // Process all minions for cleanup and buffs
        ['player', 'opponent'].forEach(playerType => {
            const player = this.state.players[playerType];
            player.board.forEach((minion, index) => {
                if (minion) {
                    // Only reset turn-based flags if not stunned
                    const isStunned = minion.buffs?.some(buff => buff.type === 'STUN');
                    if (!isStunned) {
                        minion.hasAttackedThisTurn = false;
                    }
                    minion.isNewlyPlayed = false;

                    // Process buffs
                    if (minion.buffs) {
                        minion.buffs = minion.buffs.map(buff => {
                            // If buff has duration, decrease it
                            if (buff.duration !== undefined) {
                                buff.duration -= 1;
                                // If buff expires, remove its effect
                                if (buff.duration <= 0) {
                                    // Remove buff effects
                                    if (buff.effect === 'attack') {
                                        minion.attack -= buff.value;
                                    }
                                    // If stun effect expires, allow attacks again
                                    if (buff.type === 'STUN') {
                                        minion.hasAttackedThisTurn = false;
                                    }
                                }
                            }
                            return buff;
                        }).filter(buff => buff.duration === undefined || buff.duration > 0);
                    }
                }
            });
        });

        // Clear animations from hand cards
        nextPlayer.hand.forEach(card => {
            if (card) {
                card.animation = {};
            }
        });
        
        this.state.actionLog.push(`${nextPlayer.name}'s turn started`);
        
        // If it's the bot's turn, execute their actions
        if (nextPlayer.isBot) {
            this.playBotTurn();
        }
        
        if (typeof window !== 'undefined' && window.updateUI) {
            window.updateUI();
        }
    }

    // Add this new method to handle target selection
    handleTargetSelection(targetInfo) {
        if (!this.state.targetingState) return false;

        const { sourceIndex, sourceType, effect } = this.state.targetingState;
        const sourceCard = this.state.players[sourceType].board[sourceIndex];

        if (!sourceCard) return false;

        // Call the appropriate handler based on the targeting state
        if (sourceCard.onTargetSelected) {
            this.state = sourceCard.onTargetSelected(this.state, targetInfo, sourceIndex);
            if (typeof window !== 'undefined' && window.updateUI) {
                window.updateUI();
            }
            return true;
        }

        return false;
    }

    playBotTurn() {
        const opponent = this.getOpponentPlayer();
        const player = this.getCurrentPlayer();

        // Play cards
        for (let i = 0; i < player.hand.length; i++) {
            const card = player.hand[i];
            if (card.manaCost <= player.currentMana) {
                if (card.type === 'MINION') {
                    const emptySlot = player.board.findIndex(slot => slot === null);
                    if (emptySlot !== -1) {
                        this.playCard(i, { index: emptySlot });
                        i--; // Adjust index since card was removed from hand
                    }
                } else if (card.type === 'SPELL') {
                    // Find valid target for spell
                    const validTargets = [];
                    
                    // Add opponent board targets
                    opponent.board.forEach((card, idx) => {
                        if (card) {
                            validTargets.push({ card, index: idx, playerType: 'opponent' });
                        }
                    });
                    
                    // Add player board targets
                    player.board.forEach((card, idx) => {
                        if (card) {
                            validTargets.push({ card, index: idx, playerType: 'player' });
                        }
                    });

                    if (validTargets.length > 0) {
                        const target = validTargets[Math.floor(Math.random() * validTargets.length)];
                        this.playCard(i, { 
                            index: target.index,
                            playerType: target.playerType
                        });
                        i--; // Adjust index since card was removed from hand
                    }
                }
            }
        }

        // Attack with minions
        for (let i = 0; i < player.board.length; i++) {
            const attacker = player.board[i];
            if (attacker && !attacker.hasAttackedThisTurn && !attacker.isNewlyPlayed) {
                const validTargets = opponent.board
                    .map((card, index) => card ? index : null)
                    .filter(index => index !== null);

                if (validTargets.length > 0) {
                    const targetIndex = validTargets[Math.floor(Math.random() * validTargets.length)];
                    this.attack(i, targetIndex);
                } else {
                    // Attack opponent directly if no minions
                    this.attack(i);
                }
            }
        }

        this.endTurn();
    }

    // Debug method to add cards and mana
    debugAddCardsAndMana() {
        const allCards = CardLoader.getAllCards().filter(card => card.type === 'MINION');
        
        ['player', 'opponent'].forEach(playerType => {
            const player = this.state.players[playerType];
            
            // Add 9 mana
            player.maxMana = Math.min(player.maxMana + 9, 10);
            player.currentMana = player.maxMana;
            
            // Add 4 random minions to empty board slots
            let addedCards = 0;
            for (let i = 0; i < player.board.length && addedCards < 4; i++) {
                if (player.board[i] === null) {
                    const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
                    const minionCard = { 
                        ...randomCard, 
                        isNewlyPlayed: false,
                        hasAttackedThisTurn: false,
                        animation: {},
                        buffs: []
                    };
                    player.board[i] = minionCard;
                    addedCards++;
                }
            }
        });

        // Update UI
        if (typeof window !== 'undefined' && window.updateUI) {
            window.updateUI();
        }
    }
} 