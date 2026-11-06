const fs = require('fs');
const path = require('path');

const ITALIAN_EXCLUSIVE_IDS = new Set([
  'musica-italiana',
  'tv-italiana',
  'attori-italiani',
  'cucina-italiana',
  'formaggi-salumi',
]);

const CATEGORY_LOCALIZATIONS = {
  'artisti-pop': {
    nameEn: 'World Pop Artists',
    subtitleEn: 'Global superstars and timeless hitmakers',
  },
  'attori-hollywood': {
    nameEn: 'Hollywood Actors',
    subtitleEn: 'The biggest stars of the silver screen',
  },
  'cinema-cult': {
    nameEn: 'Cult & Classic Movies',
    subtitleEn: 'Unforgettable cinematic masterpieces',
  },
  'serie-tv': {
    nameEn: 'Famous TV Series',
    subtitleEn: 'Binge-worthy shows that made TV history',
  },
  'youtuber-streamer': {
    nameEn: 'YouTubers & Streamers',
    subtitleEn: 'The most popular web creators and gamers',
  },
  'meme-tiktok': {
    nameEn: 'Viral Memes & Trends',
    subtitleEn: 'Internet culture, trends, and iconic memes',
  },
  'gen-z': {
    nameEn: 'Gen Z Starter Pack',
    subtitleEn: 'Aesthetics, trends, and modern culture',
  },
  'videogiochi': {
    nameEn: 'Famous Video Games',
    subtitleEn: 'Legendary games from arcade to modern hits',
  },
  'pokemon': {
    nameEn: 'Pokémon',
    subtitleEn: 'Gotta catch ’em all! Iconic Pokémon species',
  },
  'anime-manga': {
    nameEn: 'Anime & Manga Icons',
    subtitleEn: 'Beloved heroes and villains of Japanese animation',
  },
  'cartoni-animati': {
    nameEn: 'Cartoons & Animation',
    subtitleEn: 'Classic Disney, Pixar, and animation characters',
  },
  'calciatori': {
    nameEn: 'Elite Footballers',
    subtitleEn: 'Soccer legends and current world superstars',
  },
  'leggende-sport': {
    nameEn: 'Sports Legends',
    subtitleEn: 'The greatest athletes in sporting history',
  },
  'supereroi': {
    nameEn: 'Superheroes & Villains',
    subtitleEn: 'Marvel, DC, and comic book legends',
  },
  'nostalgia-90-00': {
    nameEn: '’90s & 2000s Nostalgia',
    subtitleEn: 'Retro gadgets, toys, and childhood memories',
  },
  'cucina-mondo': {
    nameEn: 'World Street Food & Cuisine',
    subtitleEn: 'Iconic dishes and delicacies around the globe',
  },
  'snack-bibite': {
    nameEn: 'Snacks, Treats & Sodas',
    subtitleEn: 'Famous sweet treats, chips, and refreshing drinks',
  },
  'auto-moto': {
    nameEn: 'Supercars, Cars & Bikes',
    subtitleEn: 'Legendary cars, motorcycles, and speed icons',
  },
  'monumenti': {
    nameEn: 'Monuments & World Wonders',
    subtitleEn: 'Architectural wonders and ancient landmarks',
  },
  'citta-mondo': {
    nameEn: 'Major World Cities',
    subtitleEn: 'Skylines, world capitals, and famous metropolises',
  },
  'bandiere': {
    nameEn: 'World Flags',
    subtitleEn: 'National flags from countries across the globe',
  },
  'razze-cani': {
    nameEn: 'Dog Breeds',
    subtitleEn: 'Man’s best friends of every shape and size',
  },
  'animali-selvatici': {
    nameEn: 'Wild & Exotic Animals',
    subtitleEn: 'Incredible wildlife from all seven continents',
  },
  'personaggi-storici': {
    nameEn: 'Historical Figures & Geniuses',
    subtitleEn: 'Visionaries, rulers, and world changers',
  },
  'capolavori-arte': {
    nameEn: 'Masterpieces of Art',
    subtitleEn: 'World-famous paintings, sculptures, and art',
  },
  'strumenti-musicali': {
    nameEn: 'Musical Instruments',
    subtitleEn: 'Acoustic, electric, and traditional instruments',
  },
  'oggetti-casa': {
    nameEn: 'Household Objects & Tools',
    subtitleEn: 'Everyday household items and DIY gear',
  },
  'mestieri': {
    nameEn: 'Jobs & Professions',
    subtitleEn: 'Everyday careers and essential trades',
  },
  'frutta-verdura': {
    nameEn: 'Fruit, Veggies & Spices',
    subtitleEn: 'Fresh garden produce, herbs, and exotic fruit',
  },
  'discipline-sportive': {
    nameEn: 'Sports & Disciplines',
    subtitleEn: 'Olympic sports, team games, and athletics',
  },
  'spazio-natura': {
    nameEn: 'Space, Science & Nature',
    subtitleEn: 'Planets, galaxies, and celestial phenomena',
  },
  'moda-accessori': {
    nameEn: 'Fashion & Luxury Brands',
    subtitleEn: 'Iconic designers, sneakers, and accessories',
  },
  'fiori-piante': {
    nameEn: 'Flowers, Plants & Trees',
    subtitleEn: 'Botanical beauties and nature’s flora',
  },
  'razze-gatti': {
    nameEn: 'Cat Breeds',
    subtitleEn: 'Feline pedigree breeds and domestic companions',
  },
  'icone-musica-70-80-90': {
    nameEn: '’70s, ’80s & ’90s Music Icons',
    subtitleEn: 'Rock, pop, and disco legends of past decades',
  },
  'registi-cinema': {
    nameEn: 'Legendary Film Directors',
    subtitleEn: 'The visionary creators behind cinema history',
  },
  'giochi-tavolo': {
    nameEn: 'Board Games & Tabletop',
    subtitleEn: 'Classic parlor games and modern tabletop hits',
  },
  'cocktail-bevande': {
    nameEn: 'Cocktails, Drinks & Spirits',
    subtitleEn: 'Classic mixed drinks, spirits, and aperitifs',
  },
  'dolci-pasticceria': {
    nameEn: 'Cakes, Pastries & Desserts',
    subtitleEn: 'Sweet baked goods and international desserts',
  },
  'insetti-artropodi': {
    nameEn: 'Insects & Arthropods',
    subtitleEn: 'Butterflies, beetles, spiders, and bugs',
  },
  'uccelli-mondo': {
    nameEn: 'Spectacular Birds',
    subtitleEn: 'Feathered species from tropical forests to skies',
  },
  'rettili-abissi': {
    nameEn: 'Reptiles & Deep Sea Creatures',
    subtitleEn: 'Lizards, snakes, turtles, and deep-sea life',
  },
  'minerali-gemme': {
    nameEn: 'Minerals, Gems & Crystals',
    subtitleEn: 'Precious jewels, stones, and sparkling minerals',
  },
  'mezzi-lavoro-soccorso': {
    nameEn: 'Work & Rescue Vehicles',
    subtitleEn: 'Heavy machinery, trucks, and emergency vehicles',
  },
  'ponti-architetture': {
    nameEn: 'Bridges & Modern Wonders',
    subtitleEn: 'Iconic bridges, towering skyscrapers, and arches',
  },
  'meraviglie-natura': {
    nameEn: 'Natural Wonders',
    subtitleEn: 'Breathtaking canyons, waterfalls, and landscapes',
  },
  'strumenti-scientifici': {
    nameEn: 'Science & Medical Tools',
    subtitleEn: 'Laboratory instruments and medical devices',
  },
  'maschere-costumi': {
    nameEn: 'Masks, Helmets & Armor',
    subtitleEn: 'Historical disguises, helmets, and iconic suits',
  },
  'sport-invernali-estremi': {
    nameEn: 'Winter & Action Sports',
    subtitleEn: 'Adrenaline sports on snow, waves, and sky',
  },
  'personaggi-disney': {
    nameEn: 'Disney & Pixar Characters',
    subtitleEn: 'Magical heroes and villains of Disney lore',
  },
  'creature-mitologiche': {
    nameEn: 'Mythical Beasts & Gods',
    subtitleEn: 'Legendary deities, monsters, and mythical lore',
  },
};

// Mappature comuni di traduzione per elementi con vocaboli in italiano
const ITEM_TRANSLATIONS = {
  // Bandiere
  'Italia': { answerEn: 'Italy', aliasesEn: ['italian republic'] },
  'Francia': { answerEn: 'France', aliasesEn: ['french republic'] },
  'Spagna': { answerEn: 'Spain', aliasesEn: ['kingdom of spain'] },
  'Germania': { answerEn: 'Germany', aliasesEn: ['deutschland'] },
  'Regno Unito': { answerEn: 'United Kingdom', aliasesEn: ['uk', 'britain', 'great britain'] },
  'Stati Uniti': { answerEn: 'United States', aliasesEn: ['usa', 'us', 'america'] },
  'Giappone': { answerEn: 'Japan', aliasesEn: ['nippon'] },
  'Brasile': { answerEn: 'Brazil', aliasesEn: ['brasil'] },
  'Canada': { answerEn: 'Canada', aliasesEn: [] },
  'Argentina': { answerEn: 'Argentina', aliasesEn: [] },
  'Australia': { answerEn: 'Australia', aliasesEn: ['aussie'] },
  'Messico': { answerEn: 'Mexico', aliasesEn: ['mejico'] },
  'Cina': { answerEn: 'China', aliasesEn: ['prc'] },
  'India': { answerEn: 'India', aliasesEn: ['bharat'] },
  'Russia': { answerEn: 'Russia', aliasesEn: ['russian federation'] },
  'Portogallo': { answerEn: 'Portugal', aliasesEn: [] },
  'Grecia': { answerEn: 'Greece', aliasesEn: ['hellas'] },
  'Olanda': { answerEn: 'Netherlands', aliasesEn: ['holland'] },
  'Paesi Bassi': { answerEn: 'Netherlands', aliasesEn: ['holland'] },
  'Belgio': { answerEn: 'Belgium', aliasesEn: [] },
  'Svizzera': { answerEn: 'Switzerland', aliasesEn: ['swiss'] },
  'Svezia': { answerEn: 'Sweden', aliasesEn: [] },
  'Norvegia': { answerEn: 'Norway', aliasesEn: [] },
  'Danimarca': { answerEn: 'Denmark', aliasesEn: [] },
  'Finlandia': { answerEn: 'Finland', aliasesEn: [] },
  'Irlanda': { answerEn: 'Ireland', aliasesEn: ['eire'] },
  'Turchia': { answerEn: 'Turkey', aliasesEn: ['turkiye'] },
  'Egitto': { answerEn: 'Egypt', aliasesEn: [] },
  'Sudafrica': { answerEn: 'South Africa', aliasesEn: [] },
  'Corea del Sud': { answerEn: 'South Korea', aliasesEn: ['korea'] },

  // Animali
  'Leone': { answerEn: 'Lion', aliasesEn: ['lions'] },
  'Tigre': { answerEn: 'Tiger', aliasesEn: ['tigers'] },
  'Elefante': { answerEn: 'Elephant', aliasesEn: ['elephants'] },
  'Giraffa': { answerEn: 'Giraffe', aliasesEn: ['giraffes'] },
  'Zebra': { answerEn: 'Zebra', aliasesEn: ['zebras'] },
  'Lupo': { answerEn: 'Wolf', aliasesEn: ['wolves'] },
  'Orso': { answerEn: 'Bear', aliasesEn: ['bears'] },
  'Orso Polare': { answerEn: 'Polar Bear', aliasesEn: ['polar bears'] },
  'Gorilla': { answerEn: 'Gorilla', aliasesEn: ['gorillas'] },
  'Scimmia': { answerEn: 'Monkey', aliasesEn: ['monkeys', 'ape'] },
  'Ippopotamo': { answerEn: 'Hippopotamus', aliasesEn: ['hippo', 'hippos'] },
  'Rinoceronte': { answerEn: 'Rhinoceros', aliasesEn: ['rhino', 'rhinos'] },
  'Coccodrillo': { answerEn: 'Crocodile', aliasesEn: ['croc', 'alligator'] },
  'Canguro': { answerEn: 'Kangaroo', aliasesEn: ['roos'] },
  'Koala': { answerEn: 'Koala', aliasesEn: ['koala bear'] },
  'Panda': { answerEn: 'Panda', aliasesEn: ['giant panda'] },
  'Ghepardo': { answerEn: 'Cheetah', aliasesEn: ['cheetahs'] },
  'Leopardo': { answerEn: 'Leopard', aliasesEn: ['leopards'] },
  'Volpe': { answerEn: 'Fox', aliasesEn: ['foxes'] },
  'Pipistrello': { answerEn: 'Bat', aliasesEn: ['bats'] },
  'Squalo': { answerEn: 'Shark', aliasesEn: ['sharks'] },
  'Balena': { answerEn: 'Whale', aliasesEn: ['whales'] },
  'Delfino': { answerEn: 'Dolphin', aliasesEn: ['dolphins'] },
  'Aquila': { answerEn: 'Eagle', aliasesEn: ['eagles'] },
  'Gufo': { answerEn: 'Owl', aliasesEn: ['owls'] },
  'Pinguino': { answerEn: 'Penguin', aliasesEn: ['penguins'] },
  'Fenicottero': { answerEn: 'Flamingo', aliasesEn: ['flamingos'] },

  // Frutta e Verdura
  'Mela': { answerEn: 'Apple', aliasesEn: ['apples'] },
  'Banana': { answerEn: 'Banana', aliasesEn: ['bananas'] },
  'Arancia': { answerEn: 'Orange', aliasesEn: ['oranges'] },
  'Limone': { answerEn: 'Lemon', aliasesEn: ['lemons'] },
  'Fragola': { answerEn: 'Strawberry', aliasesEn: ['strawberries'] },
  'Uva': { answerEn: 'Grapes', aliasesEn: ['grape'] },
  'Anguria': { answerEn: 'Watermelon', aliasesEn: ['melons'] },
  'Melone': { answerEn: 'Melon', aliasesEn: ['cantaloupe'] },
  'Pesca': { answerEn: 'Peach', aliasesEn: ['peaches'] },
  'Pera': { answerEn: 'Pear', aliasesEn: ['pears'] },
  'Ciliegia': { answerEn: 'Cherry', aliasesEn: ['cherries'] },
  'Ananas': { answerEn: 'Pineapple', aliasesEn: ['pineapples'] },
  'Kiwi': { answerEn: 'Kiwi', aliasesEn: ['kiwifruit'] },
  'Pomodoro': { answerEn: 'Tomato', aliasesEn: ['tomatoes'] },
  'Patata': { answerEn: 'Potato', aliasesEn: ['potatoes'] },
  'Carota': { answerEn: 'Carrot', aliasesEn: ['carrots'] },
  'Cipolla': { answerEn: 'Onion', aliasesEn: ['onions'] },
  'Aglio': { answerEn: 'Garlic', aliasesEn: [] },
  'Insalata': { answerEn: 'Lettuce', aliasesEn: ['salad'] },
  'Broccolo': { answerEn: 'Broccoli', aliasesEn: [] },
  'Zucca': { answerEn: 'Pumpkin', aliasesEn: ['squash'] },
  'Fungo': { answerEn: 'Mushroom', aliasesEn: ['mushrooms'] },

  // Strumenti Musicali
  'Chitarra': { answerEn: 'Guitar', aliasesEn: ['acoustic guitar', 'electric guitar'] },
  'Pianoforte': { answerEn: 'Piano', aliasesEn: ['grand piano'] },
  'Batteria': { answerEn: 'Drums', aliasesEn: ['drum kit', 'drum set'] },
  'Basso': { answerEn: 'Bass Guitar', aliasesEn: ['bass'] },
  'Violino': { answerEn: 'Violin', aliasesEn: ['fiddle'] },
  'Sassofono': { answerEn: 'Saxophone', aliasesEn: ['sax'] },
  'Tromba': { answerEn: 'Trumpet', aliasesEn: [] },
  'Flauto': { answerEn: 'Flute', aliasesEn: [] },
  'Arpa': { answerEn: 'Harp', aliasesEn: [] },
  'Violoncello': { answerEn: 'Cello', aliasesEn: ['violoncello'] },
  'Fisarmonica': { answerEn: 'Accordion', aliasesEn: [] },

  // Mestieri
  'Medico': { answerEn: 'Doctor', aliasesEn: ['physician', 'doc'] },
  'Vigile del Fuoco': { answerEn: 'Firefighter', aliasesEn: ['fireman'] },
  'Poliziotto': { answerEn: 'Police Officer', aliasesEn: ['policeman', 'cop'] },
  'Insegnante': { answerEn: 'Teacher', aliasesEn: ['professor'] },
  'Cuoco': { answerEn: 'Chef', aliasesEn: ['cook'] },
  'Pilota': { answerEn: 'Pilot', aliasesEn: ['airplane pilot'] },
  'Astronauta': { answerEn: 'Astronaut', aliasesEn: ['cosmonaut', 'spaceman'] },
  'Avvocato': { answerEn: 'Lawyer', aliasesEn: ['attorney'] },
  'Dentista': { answerEn: 'Dentist', aliasesEn: [] },
  'Veterinario': { answerEn: 'Veterinarian', aliasesEn: ['vet'] },
  'Meccanico': { answerEn: 'Mechanic', aliasesEn: [] },
  'Elettricista': { answerEn: 'Electrician', aliasesEn: [] },
  'Idraulico': { answerEn: 'Plumber', aliasesEn: [] },
  'Falegname': { answerEn: 'Carpenter', aliasesEn: ['woodworker'] },
  'Pittore': { answerEn: 'Painter', aliasesEn: ['artist'] },
  'Scrittore': { answerEn: 'Writer', aliasesEn: ['author'] },
};

function processCategories() {
  const categoriesDir = './public/categories';
  const files = fs.readdirSync(categoriesDir).filter((f) => f.endsWith('.json') && f !== 'index.json');

  console.log(`Aggiornamento categorie con localizzazione inglese e scope...`);

  let intlCount = 0;
  let itOnlyCount = 0;

  for (const file of files) {
    const fullPath = path.join(categoriesDir, file);
    const cat = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

    const isItOnly = ITALIAN_EXCLUSIVE_IDS.has(cat.id);
    cat.scope = isItOnly ? 'it-only' : 'intl';

    if (isItOnly) {
      itOnlyCount++;
    } else {
      intlCount++;
      const loc = CATEGORY_LOCALIZATIONS[cat.id];
      if (loc) {
        cat.nameEn = loc.nameEn;
        cat.subtitleEn = loc.subtitleEn;
      }

      // Traduci elementi se presente mapping
      if (Array.isArray(cat.items)) {
        for (const item of cat.items) {
          const trans = ITEM_TRANSLATIONS[item.answer];
          if (trans) {
            item.answerEn = trans.answerEn;
            item.aliasesEn = trans.aliasesEn;
          }
        }
      }
    }

    fs.writeFileSync(fullPath, JSON.stringify(cat, null, 2), 'utf8');
  }

  console.log(`Completato: ${intlCount} categorie internazionali e ${itOnlyCount} categorie esclusive italiane!`);

  // Aggiorna anche src/data/generatedCatalog.json
  const catalogPath = './src/data/generatedCatalog.json';
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  for (let i = 0; i < catalog.length; i++) {
    const c = catalog[i];
    const modularPath = path.join(categoriesDir, `${c.id}.json`);
    if (fs.existsSync(modularPath)) {
      catalog[i] = JSON.parse(fs.readFileSync(modularPath, 'utf8'));
    }
  }

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`src/data/generatedCatalog.json sincronizzato.`);
}

processCategories();
