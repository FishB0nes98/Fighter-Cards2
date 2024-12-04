import { GameEngine } from './game/engine/GameEngine.js';
import { CardLoader } from './game/utils/CardLoader.js';

let selectedCard = null;
let gameEngine = null;
let gameState;
let draggedCard = null;
let isDragging = false;
let targetingState = null;

function showCardInfo(card, event) {
    const infoBox = document.getElementById('card-info');
    if (!infoBox) return;

    // Position the info box near the cursor
    const x = event.clientX + 20;
    const y = event.clientY - 20;
    
    // Update info box content
    infoBox.innerHTML = `
        <div class="card-info-image" style="background-image: url('${card.imageUrl}')"></div>
        <div class="card-info-name">${card.name}</div>
        ${card.attributes ? `
            <div class="card-info-type">
                ${card.attributes.map(attr => `
                    <div class="card-info-tag">${attr}</div>
                `).join('')}
            </div>
        ` : ''}
        <div class="card-info-stats">
            <div class="card-info-stat">
                <span class="card-info-stat-icon">💧</span>
                <span class="card-info-stat-value">${card.manaCost}</span>
            </div>
            ${card.type === 'MINION' ? `
                <div class="card-info-stat">
                    <span class="card-info-stat-icon">⚔️</span>
                    <span class="card-info-stat-value">${card.attack}</span>
                </div>
                <div class="card-info-stat">
                    <span class="card-info-stat-icon">${card.health < card.baseHealth ? '❤️' : '💚'}</span>
                    <span class="card-info-stat-value">${card.health}<span class="card-info-max-hp">(${card.baseHealth})</span></span>
                </div>
            ` : ''}
        </div>
        <div class="card-info-description">${card.description}</div>
        ${card.buffs && card.buffs.length > 0 ? `
            <div class="card-info-buffs">
                <div class="card-info-section-title">Active Buffs</div>
                ${card.buffs.map(buff => `
                    <div class="card-info-buff">
                        <div class="buff-name">${buff.name}</div>
                        <div class="buff-description">${buff.description}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;

    // Make sure the info box doesn't go off screen
    const box = infoBox.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position if it would go off the right edge
    if (x + box.width > viewportWidth) {
        infoBox.style.left = `${viewportWidth - box.width - 20}px`;
    } else {
        infoBox.style.left = `${x}px`;
    }

    // Adjust vertical position if it would go off the bottom edge
    if (y + box.height > viewportHeight) {
        infoBox.style.top = `${viewportHeight - box.height - 20}px`;
    } else {
        infoBox.style.top = `${y}px`;
    }

    infoBox.classList.add('show');
}

function hideCardInfo() {
    const infoBox = document.getElementById('card-info');
    if (infoBox) {
        infoBox.classList.remove('show');
    }
}

function cleanupAnimations() {
    document.querySelectorAll('.card').forEach(card => {
        const animationContainer = card.querySelector('.animation-container');
        if (animationContainer) {
            const duration = parseInt(animationContainer.dataset.duration) || 1500;
            
            setTimeout(() => {
                if (animationContainer.parentNode) {
                    animationContainer.remove();
                }
                // Clear the animation state from the card object
                const cardIndex = card.dataset.cardIndex;
                const playerType = card.closest('[data-player-type]')?.dataset.playerType;
                if (gameEngine && cardIndex !== undefined && playerType) {
                    const cardObj = gameEngine.state.players[playerType].board[cardIndex];
                    if (cardObj) {
                        cardObj.animation = {};
                    }
                }
            }, duration);
        }
    });
}

function createCardHTML(card, index, isPlayable = false) {
    const isExhausted = card.type === 'MINION' && (card.hasAttackedThisTurn || card.isNewlyPlayed);
    const isSelected = selectedCard === index && card.type === 'MINION';
    const isDamaged = card.type === 'MINION' && card.health < card.baseHealth;
    const isFrozen = card.type === 'MINION' && (
        card.isFrozen || 
        card.buffs?.some(buff => buff.type === 'FREEZE') ||
        card.animation?.isFrozen
    );

    // Animation classes and effects
    const animationClasses = [];
    const effectElements = [];
    let dataAnimation = '';
    
    if (card?.animation) {
        if (card.animation.effect === 'spell-deflect') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container spell-deflect-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'spell-deflect';
        }
        if (card.animation.effect === 'primal-power') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container primal-power-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'primal-power';
        }
        if (card.animation.effect === 'nature-heal') {
            animationClasses.push('ring-4 ring-green-400 z-50');
            effectElements.push(`<div class="animation-container nature-heal-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'nature-heal';
        }
        if (card.animation.effect === 'dual-laser') {
            animationClasses.push('ring-4 ring-red-400 z-50');
            effectElements.push(`<div class="animation-container dual-laser-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'dual-laser';
        }
        if (card.animation.effect === 'dark-summon') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container dark-summon-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'dark-summon';
        }
        if (card.animation.effect === 'harsh-sunlight') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container harsh-sunlight-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'harsh-sunlight';
        }
        if (card.animation.effect === 'harsh-sunlight-heal') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container harsh-sunlight-heal-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'harsh-sunlight-heal';
        }
        if (card.animation.effect === 'harsh-sunlight-damage') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container harsh-sunlight-damage-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'harsh-sunlight-damage';
        }
        if (card.animation.effect === 'death-necklace') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container death-necklace-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'death-necklace';
        }
        if (card.animation.effect === 'revive') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container revive-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'revive';
        }
        if (card.animation.effect === 'freeze') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container freeze-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'freeze';
        }
        if (card.animation.effect === 'thaw') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container thaw-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'thaw';
        }
        if (card.animation.effect === 'transform') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container transform-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'transform';
        }
        if (card.animation.effect === 'hook') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container hook-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'hook';
        }
        if (card.animation.effect === 'hook-pulled') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container hook-pulled-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'hook-pulled';
        }
        if (card.animation.effect === 'damage-reduced') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container damage-reduced-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'damage-reduced';
        }
        if (card.animation.effect === 'weaken') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container weaken-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'weaken';
        }
        if (card.animation.effect === 'berserk') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container berserk-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'berserk';
        }
        if (card.animation.effect === 'coin-toss') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container coin-toss-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'coin-toss';
        }
        if (card.animation.effect === 'coin-buff') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container coin-buff-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'coin-buff';
        }
        if (card.animation.isDamaged) {
            animationClasses.push('animate-shake ring-4 ring-red-400 z-50');
        }
        if (card.animation.isAttacking) {
            animationClasses.push('animate-bounce z-50');
        }
        if (card.animation.effect === 'thunder-cast') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container thunder-cast-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'thunder-cast';
        }
        if (card.animation.effect === 'lightning-strike') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container lightning-strike-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'lightning-strike';
        }
        if (card.animation.effect === 'chain-cast') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container chain-cast-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'chain-cast';
        }
        if (card.animation.effect === 'chain-bind') {
            animationClasses.push('z-50');
            effectElements.push(`<div class="animation-container chain-bind-effect" data-duration="${card.animation.duration || 1500}"></div>`);
            dataAnimation = 'chain-bind';
        }
    }

    // Add frozen effect element if card is frozen
    if (isFrozen && !card.animation?.effect) {
        effectElements.push(`<div class="freeze-effect" data-duration="${card.animation?.duration || 1500}"></div>`);
    }

    // Remove buff display text but keep animations and effects
    let buffDisplay = '';
    if (card.buffs && card.buffs.length > 0) {
        card.buffs.forEach(buff => {
            // Add visual effect for stun buff
            if (buff.type === 'STUN') {
                effectElements.push(`<div class="animation-container chain-bind-effect" data-duration="${buff.duration * 1000}"></div>`);
            }
        });
    }

    // Add tag team arrow effect if card has R Mika's buff
    const hasTagTeamBuff = card.buffs?.some(buff => 
        buff.type === 'AURA' && 
        buff.source === 'r-mika' && 
        buff.class === 'tag-team'
    );

    const tagTeamClass = hasTagTeamBuff ? 'tag-team-buffed' : '';
    const tagTeamArrow = hasTagTeamBuff ? '<div class="tag-team-arrow"></div>' : '';

    return `
        <div class="card ${isPlayable ? 'playable' : ''} 
                     ${isExhausted ? 'exhausted' : ''} 
                     ${isSelected ? 'selected' : ''} 
                     ${isFrozen ? 'frozen' : ''}
                     ${animationClasses.join(' ')} 
                     ${tagTeamClass}
                     ${card.type ? card.type.toLowerCase() : ''}"
            draggable="${isPlayable && !isFrozen}"
            data-card-index="${index}"
            data-card-type="${card.type || ''}"
            data-animation="${dataAnimation}"
            style="background-image: url('${card.imageUrl}');">
            
            ${effectElements.join('')}
            ${tagTeamArrow}
            
            <div class="card-title">
                <div class="card-name">${card.name}</div>
            </div>

            ${card.type === 'MINION' && card.attributes ? `
                <div class="card-attributes">
                    ${card.attributes.map(attr => `
                        <div class="attribute-tag">${attr}</div>
                    `).join('')}
                </div>
            ` : ''}

            <div class="stats-bar">
                <div class="stat">
                    <span class="stat-icon mana-icon">💧</span>
                    ${card.manaCost}
                </div>

                ${card.type === 'MINION' ? `
                    <div class="stat">
                        <span class="stat-icon attack-icon">⚔️</span>
                        ${card.attack}
                    </div>
                    <div class="stat">
                        <span class="stat-icon health-icon">${isDamaged ? '❤️' : '💚'}</span>
                        ${card.health}<span class="max-hp">(${card.baseHealth})</span>
                    </div>
                ` : ''}
            </div>

            ${isExhausted ? `
                <div class="exhausted-text">
                    ${card.isNewlyPlayed ? 'Summoning Sickness' : 'Exhausted'}
                </div>
            ` : ''}

            ${isFrozen ? `
                <div class="exhausted-text">
                    Frozen
                </div>
            ` : ''}
        </div>
    `;
}

function createEmptySlotHTML(index, playerType) {
    const player = gameState.players[playerType];
    const isBuffField = player.buffField === index;
    
    // Debug logging
    console.log(`Creating slot ${index} for ${playerType}. Buff field: ${player.buffField}. Is buff field: ${isBuffField}`);
    
    return `<div class="board-slot ${isBuffField ? 'buff-field' : ''}"
             data-slot-index="${index}"
             data-player-type="${playerType}">
        </div>`;
}

function updateActionLog() {
    const actionLogContent = document.getElementById('action-log-content');
    if (!actionLogContent || !gameEngine) return;

    const state = gameEngine.getGameState();
    if (!state) return;
    
    actionLogContent.innerHTML = state.actionLog
        .map(entry => `<div class="log-entry">${entry}</div>`)
        .join('');
    
    // Auto-scroll to bottom
    actionLogContent.scrollTop = actionLogContent.scrollHeight;
}

function updateUI() {
    if (!gameEngine) return;

    const state = gameEngine.getGameState();
    if (!state) return;

    const playerBoard = document.getElementById('player-board');
    const opponentBoard = document.getElementById('opponent-board');
    const playerHand = document.getElementById('player-hand');
    const opponentHand = document.getElementById('opponent-hand');
    const playerMana = document.getElementById('player-mana');
    const opponentMana = document.getElementById('opponent-mana');
    const playerHealth = document.getElementById('player-health');
    const opponentHealth = document.getElementById('opponent-health');
    const turnInfo = document.getElementById('turn-info');

    // Debug logging
    console.log('Game State:', {
        currentTurn: state.currentTurn,
        playerHand: state.players.player.hand,
        playerBoard: state.players.player.board,
        opponentHand: state.players.opponent.hand,
        opponentBoard: state.players.opponent.board
    });

    // Update hands
    playerHand.innerHTML = state.players.player.hand
        .map((card, i) => createCardHTML(
            card, 
            i, 
            state.currentTurn === 'player' && card.manaCost <= state.players.player.currentMana
        )).join('');

    opponentHand.innerHTML = state.players.opponent.hand
        .map(() => `<div class="card back w-48 h-64 bg-indigo-900/50 rounded-2xl"></div>`).join('');

    // Create board containers
    playerBoard.innerHTML = `<div class="board">${
        Array(6).fill(null).map((_, i) => {
            const card = state.players.player.board[i];
            const isBuffField = state.players.player.buffField === i;
            return `<div class="board-slot ${isBuffField ? 'buff-field' : ''}"
                        data-slot-index="${i}"
                        data-player-type="player">
                ${card ? createCardHTML(card, i) : ''}
            </div>`;
        }).join('')
    }</div>`;

    opponentBoard.innerHTML = `<div class="board">${
        Array(6).fill(null).map((_, i) => {
            const card = state.players.opponent.board[i];
            const isBuffField = state.players.opponent.buffField === i;
            return `<div class="board-slot ${isBuffField ? 'buff-field' : ''}"
                        data-slot-index="${i}"
                        data-player-type="opponent">
                ${card ? createCardHTML(card, i) : ''}
            </div>`;
        }).join('')
    }</div>`;

    // Update game info
    turnInfo.textContent = `${state.currentTurn === 'player' ? 'Your' : 'Opponent\'s'} Turn (${state.turnNumber})`;
    playerMana.textContent = `${state.players.player.currentMana}/${state.players.player.maxMana}`;
    opponentMana.textContent = `${state.players.opponent.currentMana}/${state.players.opponent.maxMana}`;
    playerHealth.textContent = state.players.player.health;
    opponentHealth.textContent = state.players.opponent.health;

    // Update action log
    const actionLogContent = document.getElementById('action-log-content');
    if (actionLogContent) {
        actionLogContent.innerHTML = state.actionLog
            .map(entry => `<div class="log-entry">${entry}</div>`)
            .join('');
        actionLogContent.scrollTop = actionLogContent.scrollHeight;
    }

    // Add event listeners after updating UI
    initDragAndDrop();
    initCardHandlers();
    initCardInfo();
    
    // Update targeting UI
    if (state.targetingState) {
        const validTargets = state.targetingState.validTargets;
        const sourceCard = state.players[state.targetingState.sourceType]
            .board[state.targetingState.sourceIndex];

        document.querySelectorAll('.board-slot').forEach(slot => {
            const hasMinion = slot.querySelector('.card.minion');
            if (validTargets === 'ALL_MINIONS' && hasMinion) {
                slot.classList.add('valid-target');
                // Add freeze effect if Sub Zero is targeting
                if (sourceCard && sourceCard.id === 'sub-zero') {
                    slot.classList.add('targeting-freeze');
                }
                slot.style.cursor = 'pointer';
            }
        });
    } else if (selectedCard !== null) {
        // Show valid attack targets
        document.querySelectorAll('#opponent-board .board-slot').forEach(slot => {
            if (slot.querySelector('.card.minion')) {
                slot.classList.add('valid-target');
                slot.style.cursor = 'crosshair';
            }
        });
    }

    // Clean up animations after updating UI
    cleanupAnimations();
}

function initDragAndDrop() {
    const cards = document.querySelectorAll('.card.playable');
    const slots = document.querySelectorAll('.board-slot');
    const boardCards = document.querySelectorAll('.board-slot .card');

    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });

    slots.forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);
    });

    // Add drop handlers to board cards for spell targeting
    boardCards.forEach(card => {
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    const cardElement = e.target;
    const cardIndex = parseInt(cardElement.dataset.cardIndex);
    const card = gameEngine.state.players.player.hand[cardIndex];
    
    if (!card) return;

    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', cardIndex);
    
    // Show valid targets based on card type
    if (card.type === 'SPELL') {
        document.querySelectorAll('.board-slot .card.minion').forEach(minion => {
            minion.closest('.board-slot').classList.add('valid-target');
            minion.style.cursor = 'crosshair';
        });
    } else {
        document.querySelectorAll('#player-board .board-slot:empty').forEach(slot => {
            slot.classList.add('valid-target');
        });
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    // Clear targeting UI
    document.querySelectorAll('.valid-target').forEach(element => {
        element.classList.remove('valid-target');
        element.style.cursor = '';
    });
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const cardIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const card = gameEngine.state.players.player.hand[cardIndex];
    
    if (!card) return;

    const slot = e.target.closest('.board-slot');
    if (!slot) return;

    const slotIndex = parseInt(slot.dataset.slotIndex);
    const playerType = slot.dataset.playerType;

    if (card.type === 'SPELL') {
        // For spells that require targets, need a valid target
        if (card.requiresTarget) {
            const targetCard = slot.querySelector('.card');
            if (targetCard) {
                const targetIndex = parseInt(slot.dataset.slotIndex);
                const targetPlayerType = slot.dataset.playerType;
                
                if (gameEngine.playCard(cardIndex, { 
                    index: targetIndex,
                    playerType: targetPlayerType
                })) {
                    updateUI();
                }
            }
        } 
        // For non-targeted spells, can play on any slot
        else {
            if (gameEngine.playCard(cardIndex)) {
                updateUI();
            }
        }
    } else {
        // Handle minion placement
        if (slot && !slot.querySelector('.card')) {
            if (gameEngine.playCard(cardIndex, { index: slotIndex })) {
                updateUI();
            }
        }
    }

    // Clear targeting UI
    document.querySelectorAll('.valid-target').forEach(element => {
        element.classList.remove('valid-target');
        element.style.cursor = '';
    });
}

// Add this function to handle animation delays
function waitForAnimation(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
}

// Update the GameEngine's playBotTurn to use async/await
async function playBotTurn() {
    if (!gameEngine) return;
    
    const opponent = gameEngine.getOpponentPlayer();
    const player = gameEngine.getCurrentPlayer();

    let madeMove = false;

    // Play cards
    for (let i = 0; i < player.hand.length; i++) {
        const card = player.hand[i];
        if (card.manaCost <= player.currentMana) {
            if (card.type === 'MINION') {
                const emptySlot = player.board.findIndex(slot => slot === null);
                if (emptySlot !== -1) {
                    gameEngine.playCard(i, { index: emptySlot });
                    updateUI();
                    await waitForAnimation(500);
                    i--; // Adjust index since card was removed from hand
                    madeMove = true;
                }
            } else if (card.type === 'SPELL') {
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
                    gameEngine.playCard(i, { 
                        index: target.index,
                        playerType: target.playerType
                    });
                    updateUI();
                    await waitForAnimation(500);
                    i--; // Adjust index since card was removed from hand
                    madeMove = true;
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
                gameEngine.attack(i, targetIndex);
                updateUI();
                await waitForAnimation(500);
                madeMove = true;
            } else {
                // Attack opponent directly if no minions
                gameEngine.attack(i);
                updateUI();
                await waitForAnimation(300);
                madeMove = true;
            }
        }
    }

    // Check if any moves are possible
    const hasPlayableCards = player.hand.some(card => card.manaCost <= player.currentMana);
    const hasAttackableMinions = player.board.some(minion => 
        minion && !minion.hasAttackedThisTurn && !minion.isNewlyPlayed && 
        !minion.buffs?.some(buff => buff.type === 'FREEZE')
    );

    // End turn if no moves were made or no moves are possible
    if (!madeMove && !hasPlayableCards && !hasAttackableMinions) {
        if (gameEngine && gameEngine.state.currentTurn === 'opponent') {
            gameEngine.endTurn();
            updateUI();
        }
    } else {
        // End turn after all actions are complete
        setTimeout(() => {
            if (gameEngine && gameEngine.state.currentTurn === 'opponent') {
                gameEngine.endTurn();
                updateUI();
            }
        }, 500);
    }
}

// Initialize game engine with proper bot turn handling
function initGame() {
    // Initialize game engine
    gameEngine = new GameEngine(
        CardLoader.getRandomDeck(),
        CardLoader.getRandomDeck()
    );

    // Override the engine's playBotTurn with our async version
    gameEngine.playBotTurn = function() {
        playBotTurn().catch(console.error);
    };

    // Initialize end turn button
    const endTurnButton = document.getElementById('end-turn');
    if (endTurnButton) {
        endTurnButton.onclick = () => {
            if (gameEngine && gameEngine.state.currentTurn === 'player') {
                gameEngine.endTurn();
                updateUI();
            }
        };
    }

    // Initial UI update
    updateUI();
}

// Call initGame when the page loads
window.addEventListener('DOMContentLoaded', initGame);

// Add keyboard event handling for debug features
window.addEventListener('keydown', (e) => {
    if (e.code === 'Numpad5') {
        if (gameEngine && gameEngine.state.players.player) {
            const sophitiaCard = { ...CardLoader.getCardById('sophitia') };
            gameEngine.state.players.player.hand.push(sophitiaCard);
            updateUI();
        }
    }
});

function handleCardClick(event) {
    const cardElement = event.target.closest('.card');
    if (!cardElement) return;

    const cardIndex = parseInt(cardElement.dataset.cardIndex);
    const playerType = cardElement.closest('#opponent-board') ? 'opponent' : 'player';

    // Handle targeting state
    if (gameEngine.state.targetingState) {
        if (gameEngine.handleTargetSelection({ 
            index: cardIndex,
            playerType: playerType
        })) {
            // Clear targeting UI after successful selection
            document.querySelectorAll('.valid-target').forEach(element => {
                element.classList.remove('valid-target');
                element.style.cursor = '';
            });
            updateUI();
        }
        return;
    }

    // Handle attack selection
    if (playerType === 'player' && gameEngine.state.currentTurn === 'player') {
        const card = gameEngine.state.players.player.board[cardIndex];
        if (card && !card.hasAttackedThisTurn && !card.isNewlyPlayed && !card.buffs?.some(buff => buff.type === 'FREEZE')) {
            selectedCard = cardIndex;
            // Show valid attack targets
            document.querySelectorAll('#opponent-board .board-slot').forEach(slot => {
                if (slot.querySelector('.card.minion')) {
                    slot.classList.add('valid-target');
                    slot.style.cursor = 'crosshair';
                }
            });
            updateUI();
        }
    }

    // Handle attack target selection
    if (playerType === 'opponent' && selectedCard !== null) {
        const attackerCard = gameEngine.state.players.player.board[selectedCard];
        if (attackerCard && !attackerCard.hasAttackedThisTurn && !attackerCard.isNewlyPlayed) {
            gameEngine.attack(selectedCard, cardIndex);
            selectedCard = null;
            // Clear targeting UI
            document.querySelectorAll('.valid-target').forEach(element => {
                element.classList.remove('valid-target');
                element.style.cursor = '';
            });
            updateUI();
        }
    }
}

function initCardHandlers() {
    // Add click handlers for cards
    document.querySelectorAll('.card').forEach(cardElement => {
        cardElement.addEventListener('click', handleCardClick);
    });

    // Add right-click handler to cancel targeting/selection
    document.addEventListener('contextmenu', (e) => {
        if (gameEngine.state.targetingState?.cancelable || selectedCard !== null) {
            e.preventDefault();
            gameEngine.state.targetingState = null;
            selectedCard = null;
            document.querySelectorAll('.board-slot').forEach(slot => {
                slot.classList.remove('valid-target', 'targeting-freeze');
                slot.style.cursor = '';
            });
            updateUI();
        }
    });

    // Add hover effects for valid targets during targeting state
    if (gameEngine.state.targetingState) {
        const validTargets = gameEngine.state.targetingState.validTargets;
        const sourceCard = gameEngine.state.players[gameEngine.state.targetingState.sourceType]
            .board[gameEngine.state.targetingState.sourceIndex];

        document.querySelectorAll('.board-slot .card.minion').forEach(card => {
            const slot = card.closest('.board-slot');
            if (validTargets === 'ALL_MINIONS') {
                slot.classList.add('valid-target');
                // Add freeze effect if Sub Zero is targeting
                if (sourceCard && sourceCard.id === 'sub-zero') {
                    slot.classList.add('targeting-freeze');
                }
                card.style.cursor = 'crosshair';
            }
        });
    }
}

function initCardInfo() {
    document.querySelectorAll('.card').forEach(cardElement => {
        cardElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const index = parseInt(cardElement.dataset.cardIndex);
            const playerType = cardElement.closest('#opponent-board') ? 'opponent' : 'player';
            const card = gameEngine.state.players[playerType].board[index] || 
                        gameEngine.state.players[playerType].hand[index];
            
            if (card) {
                showCardInfo(card, e);
            }
        });

        cardElement.addEventListener('mouseleave', hideCardInfo);
    });
}

// Add key handler for debug commands
document.addEventListener('keydown', (event) => {
    if (event.code === 'Numpad6' || event.key === '6') {
        if (gameEngine) {
            gameEngine.debugAddCardsAndMana();
            updateUI();
        }
    }
});
  