import { AttributeBonus } from '../game/utils/AttributeBonus.js';

export class AttributeBonusDisplay {
    static lastBonusState = '';

    static render(bonuses) {
        const container = document.createElement('div');
        container.id = 'attribute-bonus-display';

        if (bonuses.length > 0) {
            const synContainer = document.createElement('div');
            synContainer.className = 'synergy-container';

            // Header
            const header = document.createElement('div');
            header.className = 'synergy-header';
            const title = document.createElement('div');
            title.className = 'synergy-title';
            title.textContent = 'Active Synergies';
            header.appendChild(title);
            synContainer.appendChild(header);

            // Synergy List
            const list = document.createElement('div');
            list.className = 'synergy-list';

            bonuses.forEach(bonus => {
                const item = document.createElement('div');
                item.className = 'synergy-item';

                // Icon section
                const icon = document.createElement('div');
                icon.className = 'synergy-icon active';
                
                // Get count from description
                const countMatch = bonus.description.match(/\[(\d+)[^\]]*\]/);
                const count = countMatch ? countMatch[1] : '';
                
                // Add count badge if exists
                if (count) {
                    const countBadge = document.createElement('div');
                    countBadge.className = 'synergy-count';
                    countBadge.textContent = count;
                    icon.appendChild(countBadge);
                }

                // Add icon text (first letter of attribute)
                const iconText = document.createElement('div');
                iconText.textContent = bonus.attribute[0];
                iconText.style.color = '#fff';
                iconText.style.fontSize = '1.25rem';
                iconText.style.fontWeight = '700';
                icon.appendChild(iconText);

                // Info section
                const info = document.createElement('div');
                info.className = 'synergy-info';

                const name = document.createElement('div');
                name.className = 'synergy-name';
                name.textContent = bonus.attribute;

                const description = document.createElement('div');
                description.className = 'synergy-description';
                // Remove the count brackets from description
                description.textContent = bonus.description.replace(/\s*\[\d+[^\]]*\]/, '');

                info.appendChild(name);
                info.appendChild(description);

                // Add progress bar for applicable bonuses
                if (count) {
                    const progress = document.createElement('div');
                    progress.className = 'synergy-progress';
                    
                    const progressBar = document.createElement('div');
                    progressBar.className = 'synergy-progress-bar';
                    
                    // Calculate progress based on bonus thresholds
                    let width = 0;
                    switch (bonus.attribute) {
                        case 'Caster':
                            width = count >= 4 ? 100 : (count >= 2 ? 50 : (count / 2) * 50);
                            break;
                        case 'Demon':
                            width = count >= 3 ? 100 : (count / 3) * 100;
                            break;
                        case 'Ninja':
                            width = count === 6 ? 100 : (count === 1 ? 50 : (count / 6) * 100);
                            break;
                        default:
                            width = 100;
                    }
                    progressBar.style.width = `${width}%`;
                    
                    progress.appendChild(progressBar);
                    info.appendChild(progress);
                }

                item.appendChild(icon);
                item.appendChild(info);
                list.appendChild(item);
            });

            synContainer.appendChild(list);
            container.appendChild(synContainer);
        }

        return container;
    }

    static update(gameState, playerType) {
        const bonuses = AttributeBonus.getActiveAttributeBonuses(gameState, playerType);
        
        // Create a string representation of current bonus state
        const currentBonusState = JSON.stringify(bonuses);
        
        // Only update if bonus state has changed
        if (currentBonusState === this.lastBonusState) {
            return;
        }
        
        const existingDisplay = document.getElementById('attribute-bonus-display');
        if (existingDisplay) {
            if (bonuses.length === 0) {
                existingDisplay.remove();
            } else {
                const newDisplay = this.render(bonuses);
                existingDisplay.replaceWith(newDisplay);
            }
        } else if (bonuses.length > 0) {
            const newDisplay = this.render(bonuses);
            document.body.appendChild(newDisplay);
        }
        
        this.lastBonusState = currentBonusState;
    }
} 