import { Julia } from '../cards/minions/Julia.js';
import { HealthPotion } from '../cards/spells/HealthPotion.js';
import { PrimalShoma } from '../cards/minions/PrimalShoma.js';
import { Ayane } from '../cards/minions/Ayane.js';
import { Akuma } from '../cards/minions/Akuma.js';
import { Noel } from '../cards/minions/Noel.js';
import { Morrigan } from '../cards/minions/Morrigan.js';
import { Ibuki } from '../cards/minions/Ibuki.js';
import { PrimalKagome } from '../cards/minions/PrimalKagome.js';
import { Yugo } from '../cards/minions/Yugo.js';
import { SubZero } from '../cards/minions/SubZero.js';
import { Purify } from '../cards/spells/Purify.js';
import { ChamCham } from '../cards/minions/ChamCham.js';
import { Scorpion } from '../cards/minions/Scorpion.js';
import { Alice } from '../cards/minions/Alice.js';
import { Weaken } from '../cards/spells/Weaken.js';
import { Berserk } from '../cards/spells/Berserk.js';
import { ErronBlack } from '../cards/minions/ErronBlack.js';
import { Coin } from '../cards/spells/Coin.js';
import { Panda } from '../cards/minions/Panda.js';
import { Elphelt } from '../cards/minions/Elphelt.js';
import { Spellbook } from '../cards/spells/Spellbook.js';
import { DeathNecklace } from '../cards/spells/DeathNecklace.js';
import { Fang } from '../cards/minions/Fang.js';
import { Shinnok } from '../cards/minions/Shinnok.js';
import { KotalKahn } from '../cards/minions/KotalKahn.js';
import { Angel } from '../cards/minions/Angel.js';
import { AncientStoneClub } from '../cards/spells/AncientStoneClub.js';
import { Shizumaru } from '../cards/minions/Shizumaru.js';
import { Raiden } from '../cards/minions/Raiden.js';
import { Birdie } from '../cards/minions/Birdie.js';
import { RMika } from '../cards/minions/RMika.js';
import { Sophitia } from '../cards/minions/Sophitia.js';
import { SophitiaSword } from '../cards/spells/SophitiaSword.js';
import { SophitiaShield } from '../cards/spells/SophitiaShield.js';

// Card registry with our available cards
const CARD_REGISTRY = {
    'julia': Julia,
    'health-potion': HealthPotion,
    'primal-shoma': PrimalShoma,
    'ayane': Ayane,
    'akuma': Akuma,
    'noel': Noel,
    'morrigan': Morrigan,
    'ibuki': Ibuki,
    'primal-kagome': PrimalKagome,
    'yugo-human': Yugo,
    'sub-zero': SubZero,
    'purify': Purify,
    'cham-cham': ChamCham,
    'scorpion': Scorpion,
    'alice': Alice,
    'weaken': Weaken,
    'berserk': Berserk,
    'erron-black': ErronBlack,
    'coin': Coin,
    'panda': Panda,
    'elphelt': Elphelt,
    'spellbook': Spellbook,
    'death-necklace': DeathNecklace,
    'fang': Fang,
    'shinnok': Shinnok,
    'kotal-kahn': KotalKahn,
    'angel': Angel,
    'ancient-stone-club': AncientStoneClub,
    'shizumaru': Shizumaru,
    'raiden': Raiden,
    'birdie': Birdie,
    'r-mika': RMika,
    'sophitia': Sophitia,
    'sophitia-sword': SophitiaSword,
    'sophitia-shield': SophitiaShield,
};

export class CardLoader {
    static getCardById(id) {
        return CARD_REGISTRY[id];
    }

    static getAllCards() {
        return Object.values(CARD_REGISTRY).filter(card => 
            card !== Coin && 
            card.id !== 'sophitia-sword' && 
            card.id !== 'sophitia-shield'
        );
    }

    static getRandomDeck(size = 40) {
        const allCards = this.getAllCards();
        const deck = [];

        // Add 3 copies of each card
        for (const card of allCards) {
            for (let i = 0; i < 3; i++) {
                deck.push({ ...card });
            }
        }

        // Fill the rest with random cards
        while (deck.length < size) {
            const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
            deck.push({ ...randomCard });
        }

        // Shuffle the deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        return deck;
    }
} 