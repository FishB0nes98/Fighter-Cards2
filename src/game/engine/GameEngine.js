import { CardLoader } from '../utils/CardLoader.js';
import { AttributeBonus } from './AttributeBonus.js';
import { AttributeBonusDisplay } from '../../components/AttributeBonusDisplay.js';

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
        for (let i = 0; i < 5; i++) {
            this.drawCard(this.state.players.player);
            this.drawCard(this.state.players.opponent);
        }

        // Initialize attribute bonus display after state is fully set up
        requestAnimationFrame(() => {
            this.applyAttributeBonuses();
        });

        // Start continuous attribute bonus checking
        if (typeof window !== 'undefined') {
            this.lastBonusState = '';
            setInterval(() => this.checkAttributeBonuses(), 100);
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
            
            // Store base stats before applying any effects
            minionCard.baseAttack = minionCard.attack;
            minionCard.baseHealth = minionCard.health;

            currentPlayer.board[slotIndex] = minionCard;

            // Apply buffs and effects
            this.applyBuffField(this.state.currentTurn, slotIndex);
            this.checkAndApplyAuras(this.state.currentTurn, slotIndex);
            this.checkBoardEffects(this.state.currentTurn, slotIndex);
            
            // Apply attribute bonuses after placing minion
            this.applyAttributeBonuses();
            
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

        // After combat resolution
        this.applyAttributeBonuses();

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

        // Apply attribute bonuses for the new turn
        this.applyAttributeBonuses();

        // Increment Hunter bonus
        ['player', 'opponent'].forEach(playerType => {
            this.state.players[playerType].board.forEach(card => {
                if (card?.attributes?.includes('Hunter')) {
                    if (!card.hunterBonusAttack) card.hunterBonusAttack = 0;
                    card.hunterBonusAttack += 1;
                    card.attack = card.baseAttack + card.hunterBonusAttack;
                }
            });
        });

        // Reset Healer bonus flags
        ['player', 'opponent'].forEach(playerType => {
            this.state.players[playerType].board.forEach(card => {
                if (card) {
                    card.hasHealerBonus = false;
                }
            });
        });

        this.checkAttributeBonuses();
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

    applyAttributeBonuses() {
        const newState = { ...this.state };
        
        // Apply bonuses for both players
        ['player', 'opponent'].forEach(playerType => {
            const board = newState.players[playerType].board;
            
            // Reset stats to base values first
            board.forEach(card => {
                if (card) {
                    // Store current buffs before reset
                    const currentBuffs = card.buffs || [];
                    
                    // Initialize buffs if needed
                    if (!card.buffs) card.buffs = [];
                    
                    // Reset attack to base value
                    if (card.baseAttack !== undefined) {
                        card.attack = card.baseAttack;
                    }

                    // Remove old attribute buffs but keep ninja bonus if it should be maintained
                    card.buffs = card.buffs.filter(buff => 
                        buff.type === 'NINJA_BONUS' || 
                        buff.type !== 'ATTRIBUTE'
                    );
                    
                    // Add new attribute buffs
                    card.buffs.push(...AttributeBonus.getAttributeBuffs(card));
                }
            });
            
            // Apply warrior bonuses
            board.forEach((card, index) => {
                if (card?.attributes?.includes('Warrior')) {
                    const bonus = AttributeBonus.calculateWarriorBonus(newState, card, playerType);
                    if (bonus > 0) {
                        card.attack += bonus;
                        card.buffs = card.buffs.filter(buff => buff.type !== 'WARRIOR_BONUS');
                        card.buffs.push({
                            type: 'WARRIOR_BONUS',
                            name: 'Warrior Might',
                            description: `+${bonus} Attack from allies`,
                            effect: 'attack',
                            value: bonus,
                            source: 'warrior-synergy'
                        });
                        card.animation = {
                            isBuffed: true,
                            effect: 'warrior-power'
                        };
                    }
                }
            });

            // Apply ninja bonuses
            board.forEach((card, index) => {
                if (card?.attributes?.includes('Ninja')) {
                    const bonus = AttributeBonus.calculateNinjaBonus(newState, card, playerType);
                    
                    // Remove ninja bonus if conditions aren't met
                    if (!bonus.maintainBonus) {
                        card.buffs = card.buffs.filter(buff => buff.type !== 'NINJA_BONUS');
                    }
                    
                    // Apply new bonus if needed
                    if (bonus.shouldApply) {
                        card.attack += bonus.attack;
                        card.health += bonus.health;
                        card.buffs.push({
                            type: 'NINJA_BONUS',
                            name: 'Ninja Power',
                            description: 'Stats doubled from Ninja synergy',
                            effect: 'stats',
                            value: bonus.attack,
                            source: 'ninja-synergy'
                        });
                        card.animation = {
                            isBuffed: true,
                            effect: 'ninja-power'
                        };
                    }
                }
            });

            // Apply caster bonus to spell costs in hand
            const casterBonus = AttributeBonus.calculateCasterBonus(newState, playerType);
            if (casterBonus > 0) {
                newState.players[playerType].hand.forEach(card => {
                    if (card.type === 'SPELL') {
                        // Store original mana cost if not already stored
                        if (card.originalManaCost === undefined) {
                            card.originalManaCost = card.manaCost;
                        }
                        card.manaCost = Math.max(0, card.originalManaCost - casterBonus);
                        card.buffs = card.buffs?.filter(buff => buff.type !== 'CASTER_BONUS') || [];
                        card.buffs.push({
                            type: 'CASTER_BONUS',
                            name: 'Spell Discount',
                            description: `Costs ${casterBonus} less from Caster synergy`,
                            effect: 'mana',
                            value: -casterBonus,
                            source: 'caster-synergy'
                        });
                    }
                });
            }
        });

        this.state = newState;
        AttributeBonusDisplay.update(this.state, this.state.currentTurn);
    }

    removeCard(playerType, index, reason = 'destroyed') {
        const card = this.state.players[playerType].board[index];
        if (!card) return;

        // Trigger any removal effects
        if (card.onRemove) {
            this.state = card.onRemove(this.state, index, playerType);
        }

        // Remove the card
        this.state.players[playerType].board[index] = null;

        // Check for demon bonus if card was destroyed
        if (reason === 'destroyed') {
            const opposingPlayer = playerType === 'player' ? 'opponent' : 'player';
            if (AttributeBonus.calculateDemonBonus(this.state, opposingPlayer)) {
                AttributeBonus.applyDemonBonus(this.state, opposingPlayer);
            }
        }

        // Recalculate attribute bonuses
        this.applyAttributeBonuses();
    }

    static attack(gameState, attackerIndex, defenderInfo) {
        let newState = { ...gameState };
        const attacker = newState.players[newState.currentTurn].board[attackerIndex];
        const defender = newState.players[defenderInfo.playerType].board[defenderInfo.index];

        if (!attacker || !defender) return newState;

        // Apply damage
        defender.health -= attacker.attack;
        attacker.health -= defender.attack;

        // Check for deaths
        if (defender.health <= 0) {
            newState = this.removeCard(newState, defenderInfo.playerType, defenderInfo.index, 'destroyed');
        }
        if (attacker.health <= 0) {
            newState = this.removeCard(newState, newState.currentTurn, attackerIndex, 'destroyed');
        }

        // Mark attacker as having attacked
        if (attacker.health > 0) {
            attacker.hasAttackedThisTurn = true;
        }

        return newState;
    }

    static endTurn(gameState) {
        let newState = { ...gameState };
        
        // Switch current turn
        newState.currentTurn = newState.currentTurn === 'player' ? 'opponent' : 'player';
        
        // Reset all cards' attack status
        const currentPlayer = newState.players[newState.currentTurn];
        currentPlayer.board.forEach(card => {
            if (card) {
                card.hasAttackedThisTurn = false;
                if (card.onTurnStart) {
                    newState = card.onTurnStart(newState, index, newState.currentTurn);
                }
            }
        });

        // Recalculate attribute bonuses for new turn
        newState = this.applyAttributeBonuses(newState);
        AttributeBonusDisplay.update(newState, newState.currentTurn);
        
        return newState;
    }

    checkAttributeBonuses() {
        let newState = { ...this.state };
        let hasChanges = false;

        // Create a string representation of current board state for comparison
        const currentBoardState = ['player', 'opponent'].map(playerType => 
            this.state.players[playerType].board.map(card => 
                card ? `${card.id}-${card.attack}-${card.health}` : 'empty'
            ).join(',')
        ).join(';');

        // Only proceed if board state has changed
        if (currentBoardState === this.lastBonusState) {
            return;
        }

        ['player', 'opponent'].forEach(playerType => {
            const board = newState.players[playerType].board;
            
            // Reset all field cards to base stats first
            board.forEach(card => {
                if (card) {
                    // Store original stats if not set
                    if (card.baseAttack === undefined) {
                        card.baseAttack = card.attack;
                    }
                    if (card.baseHealth === undefined) {
                        card.baseHealth = card.health;
                    }

                    // Reset to base stats if not ninja bonus or hunter bonus
                    if (!card.hasNinjaBonus) {
                        if (card.attack !== (card.baseAttack + (card.hunterBonusAttack || 0))) {
                            card.attack = card.baseAttack + (card.hunterBonusAttack || 0);
                            hasChanges = true;
                        }
                        if (card.health > card.baseHealth) {
                            card.health = card.baseHealth;
                            hasChanges = true;
                        }
                    }

                    // Remove old attribute buffs except NINJA_BONUS and HUNTER_BONUS
                    if (card.buffs) {
                        const oldLength = card.buffs.length;
                        card.buffs = card.buffs.filter(buff => 
                            buff.type === 'NINJA_BONUS' || 
                            buff.type === 'HUNTER_BONUS' ||
                            !['WARRIOR_BONUS', 'ATTRIBUTE', 'HEALER_BONUS'].includes(buff.type)
                        );
                        if (oldLength !== card.buffs.length) hasChanges = true;
                    }
                }
            });

            // Check Ninja conditions first
            const ninjaCount = board.filter(card => card?.attributes?.includes('Ninja')).length;
            const shouldHaveNinjaBonus = ninjaCount === 1 || ninjaCount === 6;

            // Apply or remove ninja bonuses
            board.forEach((card, index) => {
                if (card?.attributes?.includes('Ninja')) {
                    if (shouldHaveNinjaBonus && !card.hasNinjaBonus) {
                        // Apply bonus
                        card.attack = card.baseAttack * 2;
                        card.health = card.baseHealth * 2;
                        card.hasNinjaBonus = true;
                        
                        if (!card.buffs) card.buffs = [];
                        card.buffs.push({
                            type: 'NINJA_BONUS',
                            name: 'Ninja Power',
                            description: 'Stats doubled from Ninja synergy',
                            effect: 'stats',
                            value: card.baseAttack,
                            source: 'ninja-synergy'
                        });
                        hasChanges = true;
                    } else if (!shouldHaveNinjaBonus && card.hasNinjaBonus) {
                        // Remove bonus
                        card.attack = card.baseAttack;
                        card.health = Math.min(card.health, card.baseHealth);
                        card.hasNinjaBonus = false;
                        if (card.buffs) {
                            card.buffs = card.buffs.filter(buff => buff.type !== 'NINJA_BONUS');
                        }
                        hasChanges = true;
                    } else if (shouldHaveNinjaBonus && card.hasNinjaBonus) {
                        // Ensure bonus is maintained
                        if (card.attack !== card.baseAttack * 2) {
                            card.attack = card.baseAttack * 2;
                            hasChanges = true;
                        }
                    }
                }
            });

            // Apply warrior bonuses
            board.forEach((card, index) => {
                if (card?.attributes?.includes('Warrior')) {
                    const bonus = AttributeBonus.calculateWarriorBonus(newState, card, playerType);
                    if (bonus > 0) {
                        card.attack += bonus;
                        if (!card.buffs) card.buffs = [];
                        card.buffs.push({
                            type: 'WARRIOR_BONUS',
                            name: 'Warrior Might',
                            description: `+${bonus} Attack from allies`,
                            effect: 'attack',
                            value: bonus,
                            source: 'warrior-synergy'
                        });
                        hasChanges = true;
                    }
                }
            });

            // Apply God cost reduction to hand
            const godBonus = AttributeBonus.calculateGodBonus(newState, playerType);
            newState.players[playerType].hand.forEach(card => {
                const newCost = Math.max(0, card.baseCost || card.cost - godBonus);
                if (card.cost !== newCost) {
                    if (card.baseCost === undefined) {
                        card.baseCost = card.cost;
                    }
                    card.cost = newCost;
                    hasChanges = true;
                }
            });

            // Apply Healer bonus
            const healerBonus = AttributeBonus.calculateHealerBonus(newState, playerType);
            if (healerBonus.bonus > 0) {
                const validTargets = board.filter(card => card && !card.hasHealerBonus);
                if (validTargets.length > 0) {
                    const targetCount = healerBonus.count === -1 ? validTargets.length : healerBonus.count;
                    const shuffled = [...validTargets].sort(() => Math.random() - 0.5);
                    
                    for (let i = 0; i < Math.min(targetCount, shuffled.length); i++) {
                        const target = shuffled[i];
                        target.health += healerBonus.bonus;
                        target.hasHealerBonus = true;
                        if (!target.buffs) target.buffs = [];
                        target.buffs.push({
                            type: 'HEALER_BONUS',
                            name: 'Healing Touch',
                            description: `+${healerBonus.bonus} Health from Healer synergy`,
                            effect: 'health',
                            value: healerBonus.bonus,
                            source: 'healer-synergy'
                        });
                        hasChanges = true;
                    }
                }
            }

            // Apply Hunter bonus (increment happens in endTurn)
            board.forEach(card => {
                if (card?.attributes?.includes('Hunter')) {
                    const bonus = AttributeBonus.calculateHunterBonus(card);
                    if (bonus > 0) {
                        if (!card.buffs) card.buffs = [];
                        const existingBuff = card.buffs.find(b => b.type === 'HUNTER_BONUS');
                        if (!existingBuff) {
                            card.buffs.push({
                                type: 'HUNTER_BONUS',
                                name: 'Hunter\'s Mark',
                                description: `+${bonus} Attack from Hunter synergy`,
                                effect: 'attack',
                                value: bonus,
                                source: 'hunter-synergy'
                            });
                            hasChanges = true;
                        } else if (existingBuff.value !== bonus) {
                            existingBuff.value = bonus;
                            existingBuff.description = `+${bonus} Attack from Hunter synergy`;
                            hasChanges = true;
                        }
                    }
                }
            });
        });

        // Only update state and display if there were changes
        if (hasChanges) {
            this.state = newState;
            this.lastBonusState = currentBoardState;
            AttributeBonusDisplay.update(this.state, this.state.currentTurn);
        }
    }

    onCardAttack(attackingCard, defendingCard) {
        // ... existing attack code ...

        // Check Primal draw trigger
        if (attackingCard.attributes?.includes('Primal')) {
            const playerType = this.getCardOwner(attackingCard);
            if (AttributeBonus.shouldTriggerPrimalDraw(this.state, playerType)) {
                this.drawCard(playerType);
            }
        }

        // ... rest of attack code ...
    }
} 