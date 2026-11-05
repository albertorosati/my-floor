import { Category, DuelItem } from '../types/game';

/**
 * Converte un'emoji standard nel corrispondente SVG vettoriale ad altissima definizione (Twemoji CDN)
 * garantendo caricamento istantaneo (<15ms), zero problemi di copyright per YouTube e fallback immediato.
 */
export function emojiToVectorUrl(emoji: string): string {
  const codePoints: string[] = [];
  for (const char of emoji) {
    const cp = char.codePointAt(0);
    if (cp !== undefined) {
      codePoints.push(cp.toString(16));
    }
  }
  const hasZwj = codePoints.includes('200d');
  const filtered = hasZwj
    ? codePoints
    : codePoints.filter((cp) => cp !== 'fe0f');
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${filtered.join('-')}.svg`;
}

export function flagUrl(countryCode: string): string {
  return `https://flagcdn.com/w640/${countryCode.toLowerCase()}.png`;
}

function makeItem(
  id: string,
  answer: string,
  emoji: string,
  aliases: string[],
  customImageUrl?: string,
  subLabel?: string
): DuelItem {
  return {
    id,
    answer,
    aliases,
    imageUrl: customImageUrl || emojiToVectorUrl(emoji),
    fallbackEmoji: emoji,
    subLabel,
  };
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'animali',
    name: 'Regno Animale',
    subtitle: 'Mammiferi, rettili, uccelli e creature marine',
    icon: '🦁',
    themeHex: '#f59e0b',
    items: [
      makeItem('ani-1', 'Leone', '🦁', ['leoni', 're della foresta', 'leonessa']),
      makeItem('ani-2', 'Elefante', '🐘', ['elefanti', ' pachiderma', 'mammut']),
      makeItem('ani-3', 'Giraffa', '🦒', ['giraffe', 'girafa']),
      makeItem('ani-4', 'Canguro', '🦘', ['canguri', 'wallaby']),
      makeItem('ani-5', 'Pinguino', '🐧', ['pinguini']),
      makeItem('ani-6', 'Delfino', '🐬', ['delfini', 'orche']),
      makeItem('ani-7', 'Squalo', '🦈', ['squali', 'pescecane']),
      makeItem('ani-8', 'Polpo', '🐙', ['polipo', 'piovra', 'polpi', 'polipi']),
      makeItem('ani-9', 'Coccodrillo', '🐊', ['alligatore', 'caimano', 'coccodrilli']),
      makeItem('ani-10', 'Fenicottero', '🦩', ['fenicotteri', 'flamingo']),
      makeItem('ani-11', 'Gufo', '🦉', ['civetta', 'barbagianni', 'allocco', 'gufi']),
      makeItem('ani-12', 'Camaleonte', '🦎', ['lucertola', 'geco', 'iguana', 'ramarro']),
      makeItem('ani-13', 'Koala', '🐨', ['coala', 'orsetto koala']),
      makeItem('ani-14', 'Panda', '🐼', ['orso panda', 'panda gigante']),
      makeItem('ani-15', 'Zebra', '🦓', ['zebre']),
      makeItem('ani-16', 'Rinoceronte', '🦏', ['rinoceronti']),
      makeItem('ani-17', 'Ippopotamo', '🦛', ['ipopotamo', 'ippopotami']),
      makeItem('ani-18', 'Pipistrello', '🦇', ['pipistrelli', 'vampiro']),
      makeItem('ani-19', 'Scorpione', '🦂', ['scorpioni']),
      makeItem('ani-20', 'Tartaruga', '🐢', ['testuggine', 'tartarughe']),
    ],
  },
  {
    id: 'bandiere',
    name: 'Bandiere del Mondo',
    subtitle: 'Indovina la nazione dalla sua bandiera ufficiale',
    icon: '🌍',
    themeHex: '#3b82f6',
    items: [
      makeItem('flg-1', 'Italia', '🇮🇹', ['italiana', 'repubblica italiana'], flagUrl('it')),
      makeItem('flg-2', 'Francia', '🇫🇷', ['francese'], flagUrl('fr')),
      makeItem('flg-3', 'Germania', '🇩🇪', ['tedesca'], flagUrl('de')),
      makeItem('flg-4', 'Spagna', '🇪🇸', ['spagnola'], flagUrl('es')),
      makeItem('flg-5', 'Regno Unito', '🇬🇧', ['inghilterra', 'gran bretagna', 'uk', 'inglese'], flagUrl('gb')),
      makeItem('flg-6', 'Stati Uniti', '🇺🇸', ['america', 'usa', 'stati uniti d america'], flagUrl('us')),
      makeItem('flg-7', 'Giappone', '🇯🇵', ['giapponese', 'japan'], flagUrl('jp')),
      makeItem('flg-8', 'Brasile', '🇧🇷', ['brasiliana', 'brazil'], flagUrl('br')),
      makeItem('flg-9', 'Argentina', '🇦🇷', ['argentino'], flagUrl('ar')),
      makeItem('flg-10', 'Canada', '🇨🇦', ['canadese'], flagUrl('ca')),
      makeItem('flg-11', 'Svizzera', '🇨🇭', ['svizzero', 'elvezia'], flagUrl('ch')),
      makeItem('flg-12', 'Grecia', '🇬🇷', ['greca', 'ellenica'], flagUrl('gr')),
      makeItem('flg-13', 'Portogallo', '🇵🇹', ['portoghese'], flagUrl('pt')),
      makeItem('flg-14', 'Cina', '🇨🇳', ['cinese', 'repubblica popolare cinese'], flagUrl('cn')),
      makeItem('flg-15', 'Corea del Sud', '🇰🇷', ['corea', 'sud corea', 'coreana'], flagUrl('kr')),
      makeItem('flg-16', 'Australia', '🇦🇺', ['australiana'], flagUrl('au')),
      makeItem('flg-17', 'Messico', '🇲🇽', ['messicana'], flagUrl('mx')),
      makeItem('flg-18', 'Egitto', '🇪🇬', ['egiziana'], flagUrl('eg')),
      makeItem('flg-19', 'Svezia', '🇸🇪', ['svedese'], flagUrl('se')),
      makeItem('flg-20', 'Turchia', '🇹🇷', ['turca'], flagUrl('tr')),
    ],
  },
  {
    id: 'cibo',
    name: 'Piatti & Cibo',
    subtitle: 'Specialità gastronomiche, dolci e street food',
    icon: '🍕',
    themeHex: '#ef4444',
    items: [
      makeItem('fod-1', 'Pizza', '🍕', ['trancio di pizza', 'margherita', 'pizze']),
      makeItem('fod-2', 'Hamburger', '🍔', ['panino', 'cheeseburger', 'burger']),
      makeItem('fod-3', 'Patatine Fritte', '🍟', ['patatine', 'french fries', 'patate fritte']),
      makeItem('fod-4', 'Hot Dog', '🌭', ['wurstel', 'panino con wurstel', 'hotdog']),
      makeItem('fod-5', 'Sushi', '🍣', ['nigiri', 'maki', 'pesce crudo', 'sashimi']),
      makeItem('fod-6', 'Spaghetti', '🍝', ['pasta', 'piatto di pasta', ' pasta al pomodoro']),
      makeItem('fod-7', 'Taco', '🌮', ['tacos', 'piadina', 'burrito']),
      makeItem('fod-8', 'Croissant', '🥐', ['cornetto', 'brioche', 'cruassan']),
      makeItem('fod-9', 'Ciambella', '🍩', ['donut', 'donuts', 'ciambelle', 'krapfen']),
      makeItem('fod-10', 'Gelato', '🍦', ['cono gelato', 'cono', 'gelati']),
      makeItem('fod-11', 'Popcorn', '🍿', ['pop corn', 'mais scoppiato']),
      makeItem('fod-12', 'Pancake', '🥞', ['pancakes', 'frittelle', 'crepes']),
      makeItem('fod-13', 'Uovo al Tegamino', '🍳', ['uovo fritto', 'uovo', 'occhio di bue', 'padella']),
      makeItem('fod-14', 'Formaggio', '🧀', ['emmenthal', 'groviera', 'fetta di formaggio', 'cacio']),
      makeItem('fod-15', 'Cioccolato', '🍫', ['tavoletta di cioccolato', 'cioccolata', 'barretta']),
      makeItem('fod-16', 'Baguette', '🥖', ['filone di pane', 'pane francese', 'pane', 'sfilatino']),
      makeItem('fod-17', 'Ramen', '🍜', ['zuppa', 'noodles', 'spaghetti in brodo']),
      makeItem('fod-18', 'Pretzel', '🥨', ['brezel', 'salatino']),
      makeItem('fod-19', 'Gambero', '🍤', ['gamberetto', 'gambero fritto', 'tempura']),
      makeItem('fod-20', 'Torta', '🎂', ['torta di compleanno', 'dolce', 'compleanno']),
    ],
  },
  {
    id: 'frutta-verdura',
    name: 'Frutta & Verdura',
    subtitle: 'Prodotti dell’orto, frutti esotici e di stagione',
    icon: '🍓',
    themeHex: '#22c55e',
    items: [
      makeItem('frt-1', 'Fragola', '🍓', ['fragole']),
      makeItem('frt-2', 'Banana', '🍌', ['banane', 'casco di banane']),
      makeItem('frt-3', 'Anguria', '🍉', ['cocomero', 'melone d acqua']),
      makeItem('frt-4', 'Ananas', '🍍', ['ananasso']),
      makeItem('frt-5', 'Ciliegie', '🍒', ['ciliegia']),
      makeItem('frt-6', 'Uva', '🍇', ['grappolo d uva', 'acini d uva']),
      makeItem('frt-7', 'Limone', '🍋', ['limoni']),
      makeItem('frt-8', 'Avocado', '🥑', ['avocadi']),
      makeItem('frt-9', 'Melanzana', '🍆', ['melanzane']),
      makeItem('frt-10', 'Carota', '🥕', ['carote']),
      makeItem('frt-11', 'Peperoncino', '🌶️', ['peperoncini', 'jalapeno']),
      makeItem('frt-12', 'Pannocchia', '🌽', ['mais', 'granoturco', 'spiga di mais']),
      makeItem('frt-13', 'Broccoli', '🥦', ['broccolo', 'cima di rapa']),
      makeItem('frt-14', 'Fungo', '🍄', ['funghi', 'porcino', 'amanita']),
      makeItem('frt-15', 'Noce di Cocco', '🥥', ['cocco']),
      makeItem('frt-16', 'Kiwi', '🥝', ['chiwi', 'kivi']),
      makeItem('frt-17', 'Pesca', '🍑', ['pesche', 'albicocca']),
      makeItem('frt-18', 'Pera', '🍐', ['pere']),
      makeItem('frt-19', 'Cipolla', '🧅', ['cipolle', 'scalogno']),
      makeItem('frt-20', 'Aglio', '🧄', ['spicchio d aglio', 'testa d aglio']),
    ],
  },
  {
    id: 'oggetti-casa',
    name: 'Oggetti Quotidiani',
    subtitle: 'Cose che usiamo tutti i giorni in casa o in ufficio',
    icon: '🔑',
    themeHex: '#a855f7',
    items: [
      makeItem('obj-1', 'Forbici', '✂️', ['forbice', 'paio di forbici', 'cesoie']),
      makeItem('obj-2', 'Ombrello', '☂️', ['parapioggia', 'ombrelli']),
      makeItem('obj-3', 'Chiave', '🔑', ['chiavi', 'chiave di casa']),
      makeItem('obj-4', 'Lucchetto', '🔒', ['catenaccio', 'serratura']),
      makeItem('obj-5', 'Lampadina', '💡', ['lampadine', 'luce', 'idea']),
      makeItem('obj-6', 'Candela', '🕯️', ['cero', 'candele']),
      makeItem('obj-7', 'Sveglia', '⏰', ['orologio', 'timer']),
      makeItem('obj-8', 'Clessidra', '⏳', ['orologio a sabbia']),
      makeItem('obj-9', 'Martello', '🔨', ['martelli', 'mazzetta']),
      makeItem('obj-10', 'Cacciavite', '🪛', ['giravite']),
      makeItem('obj-11', 'Chiave Inglese', '🔧', ['chiave meccanica', 'bullone']),
      makeItem('obj-12', 'Calamita', '🧲', ['magnete', 'ferro di cavallo']),
      makeItem('obj-13', 'Scopa', '🧹', ['ramazza', 'spazzola']),
      makeItem('obj-14', 'Spazzolino', '🪥', ['spazzolino da denti']),
      makeItem('obj-15', 'Specchio', '🪞', ['specchietto']),
      makeItem('obj-16', 'Valigia', '🧳', ['trolley', 'bagaglio']),
      makeItem('obj-17', 'Graffetta', '📎', ['clip', 'fermaglio']),
      makeItem('obj-18', 'Lente d’Ingrandimento', '🔍', ['lente', 'lente di ingrandimento']),
      makeItem('obj-19', 'Scala', '🪜', ['pioli', 'scaletta']),
      makeItem('obj-20', 'Secchio', '🪣', ['secchiello', 'mastello']),
    ],
  },
  {
    id: 'musica',
    name: 'Strumenti Musicali',
    subtitle: 'Dal rock sinfonico alle percussioni',
    icon: '🎸',
    themeHex: '#ec4899',
    items: [
      makeItem('mus-1', 'Chitarra', '🎸', ['chitarra elettrica', 'basso', 'chitarre']),
      makeItem('mus-2', 'Pianoforte', '🎹', ['tastiera', 'piano', 'organo']),
      makeItem('mus-3', 'Tromba', '🎺', ['trombe', 'cornetta', 'flicorno']),
      makeItem('mus-4', 'Violino', '🎻', ['viola', 'violoncello', 'contrabbasso']),
      makeItem('mus-5', 'Batteria', '🥁', ['tamburo', 'rullante', 'percussioni', 'tamburi']),
      makeItem('mus-6', 'Sassofono', '🎷', ['sax', 'sassofoni']),
      makeItem('mus-7', 'Fisarmonica', '🪗', ['organetto', 'bandoneon']),
      makeItem('mus-8', 'Banjo', '🪕', ['mandolino', 'ukulele', 'liuto']),
      makeItem('mus-9', 'Maracas', '🪇', ['maraca', 'shaker', 'sonaglio']),
      makeItem('mus-10', 'Flauto', '🪈', ['flauto traverso', 'ottavino', 'piffero']),
      makeItem('mus-11', 'Microfono', '🎤', ['microfoni', 'canto']),
      makeItem('mus-12', 'Cuffie', '🎧', ['auricolari', 'headset', 'cuffia']),
      makeItem('mus-13', 'Campana', '🔔', ['campanella', 'campane']),
      makeItem('mus-14', 'Gong', '🪙', ['piatto', 'tam tam'], undefined, 'Percussione orientale'),
      makeItem('mus-15', 'Radio', '📻', ['stereofonia', 'radiolina', 'stereo']),
      makeItem('mus-16', 'Megafono', '📣', ['altoparlante', 'coni']),
    ],
  },
  {
    id: 'sport',
    name: 'Sport & Olimpiadi',
    subtitle: 'Discipline sportive, palloni e attrezzature',
    icon: '⚽',
    themeHex: '#10b981',
    items: [
      makeItem('spt-1', 'Calcio', '⚽', ['pallone da calcio', 'pallone', 'football']),
      makeItem('spt-2', 'Basket', '🏀', ['pallacanestro', 'palla da basket']),
      makeItem('spt-3', 'Tennis', '🎾', ['pallina da tennis', 'racchetta da tennis']),
      makeItem('spt-4', 'Pallavolo', '🏐', ['volley', 'palla da pallavolo']),
      makeItem('spt-5', 'Rugby', '🏉', ['football americano', 'palla ovale']),
      makeItem('spt-6', 'Baseball', '⚾', ['palla da baseball', 'softball']),
      makeItem('spt-7', 'Biliardo', '🎱', ['palla 8', 'palla otto', 'otto', 'stecca']),
      makeItem('spt-8', 'Bowling', '🎳', ['birilli', 'birillo', 'palla da bowling']),
      makeItem('spt-9', 'Ping Pong', '🏓', ['tennis tavolo', 'racchetta ping pong']),
      makeItem('spt-10', 'Badminton', '🏸', ['volano']),
      makeItem('spt-11', 'Pugilato', '🥊', ['boxe', 'guantone', 'guantoni da boxe']),
      makeItem('spt-12', 'Tiro con l’Arco', '🏹', ['arco', 'arco e freccia', 'freccia']),
      makeItem('spt-13', 'Sci', '🎿', ['sciare', 'scarponi da sci', 'scii']),
      makeItem('spt-14', 'Pattini sul Ghiaccio', '⛸️', ['pattinaggio', 'pattino', 'pattini']),
      makeItem('spt-15', 'Skateboard', '🛹', ['skate', 'tavola da skate']),
      makeItem('spt-16', 'Trofeo', '🏆', ['coppa', 'campione', 'premio']),
      makeItem('spt-17', 'Medaglia d’Oro', '🥇', ['medaglia', 'oro', 'primo posto']),
      makeItem('spt-18', 'Hockey', '🏒', ['hockey su ghiaccio', 'bastone da hockey']),
    ],
  },
  {
    id: 'veicoli',
    name: 'Motori & Trasporti',
    subtitle: 'Mezzi di terra, cielo, mare ed emergenza',
    icon: '🚀',
    themeHex: '#06b6d4',
    items: [
      makeItem('veh-1', 'Automobile', '🚗', ['macchina', 'auto', 'vettura']),
      makeItem('veh-2', 'Auto da Corsa', '🏎️', ['formula 1', 'ferrari', 'monoposto', 'f1']),
      makeItem('veh-3', 'Motocicletta', '🏍️', ['moto', 'scooter']),
      makeItem('veh-4', 'Bicicletta', '🚲', ['bici', 'mountain bike']),
      makeItem('veh-5', 'Autobus', '🚌', ['bus', 'pullman', 'corriera']),
      makeItem('veh-6', 'Ambulanza', '🚑', ['autoambulanza', 'soccorso']),
      makeItem('veh-7', 'Camion dei Pompieri', '🚒', ['autopompa', 'pompieri', 'vigili del fuoco']),
      makeItem('veh-8', 'Volante della Polizia', '🚓', ['polizia', 'auto della polizia', 'pattuglia']),
      makeItem('veh-9', 'Trattore', '🚜', ['trattori', 'mezzo agricolo']),
      makeItem('veh-10', 'Treno', '🚆', ['locomotiva', 'alta velocita', 'frecciarossa']),
      makeItem('veh-11', 'Aeroplano', '✈️', ['aereo', 'jet', 'aeroplani']),
      makeItem('veh-12', 'Elicottero', '🚁', ['elicotteri']),
      makeItem('veh-13', 'Razzo', '🚀', ['astronave', 'navicella spaziale', 'missile']),
      makeItem('veh-14', 'Barca a Vela', '⛵', ['barca', 'veliero', 'vela']),
      makeItem('veh-15', 'Nave da Crociera', '🛳️', ['nave', 'traghetto', 'transatlantico']),
      makeItem('veh-16', 'Ancora', '⚓', ['ancore', 'porto']),
      makeItem('veh-17', 'Mongolfiera', '🎈', ['palloncino', 'aerostato']),
      makeItem('veh-18', 'Monopattino', '🛴', ['monopattino elettrico']),
    ],
  },
  {
    id: 'tech-gaming',
    name: 'Tech & Gaming',
    subtitle: 'Console, computer, elettronica e cultura nerd',
    icon: '🎮',
    themeHex: '#6366f1',
    items: [
      makeItem('tec-1', 'Joystick', '🎮', ['controller', 'gamepad', 'joypad', 'playstation', 'videogioco']),
      makeItem('tec-2', 'Smartphone', '📱', ['telefono', 'cellulare', 'iphone', 'telefonino']),
      makeItem('tec-3', 'Computer Portatile', '💻', ['laptop', 'pc', 'computer', 'notebook']),
      makeItem('tec-4', 'Mouse', '🖱️', ['topo', 'puntatore']),
      makeItem('tec-5', 'Tastiera', '⌨️', ['keyboard']),
      makeItem('tec-6', 'Stampante', '🖨️', ['fotocopiatrice', 'scanner']),
      makeItem('tec-7', 'Fotocamera', '📷', ['macchina fotografica', 'reflex', 'macchina foto']),
      makeItem('tec-8', 'Videocamera', '📹', ['telecamera', 'camcorder']),
      makeItem('tec-9', 'Televisore', '📺', ['tv', 'televisione', 'schermo']),
      makeItem('tec-10', 'Batteria', '🔋', ['pila', 'carica', 'accumulatore']),
      makeItem('tec-11', 'Floppy Disk', '💾', ['floppy', 'dischetto', 'salva']),
      makeItem('tec-12', 'CD', '💿', ['compact disc', 'dvd', 'disco', 'cd rom']),
      makeItem('tec-13', 'Robot', '🤖', ['androide', 'intelligenza artificiale', 'cyborg']),
      makeItem('tec-14', 'Alien', '👾', ['space invaders', 'extraterrestre', 'alieno', 'arcade']),
      makeItem('tec-15', 'Satellite', '🛰️', ['antenna spaziale', 'stazione spaziale']),
      makeItem('tec-16', 'Telescopio', '🔭', ['cannocchiale', 'osservatorio']),
      makeItem('tec-17', 'Microscopio', '🔬', ['laboratorio']),
      makeItem('tec-18', 'Spina Elettrica', '🔌', ['spina', 'cavo', 'corrente', 'presa']),
    ],
  },
  {
    id: 'natura-spazio',
    name: 'Natura & Spazio',
    subtitle: 'Fenomeni atmosferici, pianeti e meraviglie terrestri',
    icon: '🌋',
    themeHex: '#14b8a6',
    items: [
      makeItem('nat-1', 'Vulcano', '🌋', ['eruzione', 'lava', 'cratere', 'vesuvio', 'etna']),
      makeItem('nat-2', 'Arcobaleno', '🌈', ['iride']),
      makeItem('nat-3', 'Fulmine', '⚡', ['lampo', 'saetta', 'tuono', 'elettricita']),
      makeItem('nat-4', 'Tornado', '🌪️', ['uragano', 'tromba d aria', 'ciclone']),
      makeItem('nat-5', 'Fiocco di Neve', '❄️', ['neve', 'ghiaccio', 'inverno']),
      makeItem('nat-6', 'Pupazzo di Neve', '⛄', ['uomo di neve', 'pupazzo']),
      makeItem('nat-7', 'Sole', '☀️', ['stella', 'solare']),
      makeItem('nat-8', 'Luna', '🌙', ['mezzaluna', 'falce di luna', 'satellite']),
      makeItem('nat-9', 'Saturno', '🪐', ['pianeta', 'pianeta con anelli', 'sistema solare']),
      makeItem('nat-10', 'Cometa', '☄️', ['meteora', 'stella cadente', 'asteroide']),
      makeItem('nat-11', 'Fuoco', '🔥', ['fiamma', 'fiamme', 'incendio']),
      makeItem('nat-12', 'Onda', '🌊', ['mare', 'tsunami', 'acqua']),
      makeItem('nat-13', 'Cactus', '🌵', ['pianta grassa', 'deserto']),
      makeItem('nat-14', 'Palma', '🌴', ['albero di palma', 'isola tropicale']),
      makeItem('nat-15', 'Girasole', '🌻', ['fiore', 'girasoli']),
      makeItem('nat-16', 'Rosa', '🌹', ['rose', 'fiore rosso']),
      makeItem('nat-17', 'Quadrifoglio', '🍀', ['trifoglio', 'fortuna']),
      makeItem('nat-18', 'Pianeta Terra', '🌎', ['terra', 'mondo', 'globo', 'mappamondo']),
    ],
  },
  {
    id: 'abbigliamento',
    name: 'Moda & Accessori',
    subtitle: 'Capi di vestiario, scarpe e gioielli',
    icon: '👟',
    themeHex: '#f43f5e',
    items: [
      makeItem('mod-1', 'Corona', '👑', ['re', 'regina', 'diadema']),
      makeItem('mod-2', 'Cappello', '🎩', ['cilindro', 'cappello a cilindro', 'magia']),
      makeItem('mod-3', 'Occhiali da Sole', '🕶️', ['occhiali', 'occhiale', 'lenti']),
      makeItem('mod-4', 'Cravatta', '👔', ['camicia', 'abito']),
      makeItem('mod-5', 'Maglietta', '👕', ['t shirt', 'polo', 'maglia']),
      makeItem('mod-6', 'Pantaloni', '👖', ['jeans', 'pantalone', 'denim']),
      makeItem('mod-7', 'Sciarpa', '🧣', ['foulard', 'sciarpe']),
      makeItem('mod-8', 'Guanti', '🧤', ['guanto', 'manopole']),
      makeItem('mod-9', 'Calzini', '🧦', ['calze', 'calza', 'calzino']),
      makeItem('mod-10', 'Scarpa da Ginnastica', '👟', ['scarpe', 'sneaker', 'sneakers', 'scarpa']),
      makeItem('mod-11', 'Tacco Alto', '👠', ['scarpa col tacco', 'decollete', 'tacchi']),
      makeItem('mod-12', 'Stivale', '👢', ['stivali', 'anfibi']),
      makeItem('mod-13', 'Zaino', '🎒', ['cartella', 'zainetto', 'scuola']),
      makeItem('mod-14', 'Borsa', '👜', ['borsetta', 'shopping bag']),
      makeItem('mod-15', 'Anello', '💍', ['anello con diamante', 'fede', 'fidanzamento']),
      makeItem('mod-16', 'Diamante', '💎', ['gemma', 'gioiello', 'pietra preziosa']),
      makeItem('mod-17', 'Rossetto', '💄', ['trucco', 'make up', 'lip gloss']),
      makeItem('mod-18', 'Casco', '⛑️', ['elmetto', 'casco di sicurezza']),
    ],
  },
  {
    id: 'anatomia-salute',
    name: 'Corpo & Medicina',
    subtitle: 'Organi, sensi e strumenti del medico',
    icon: '🧠',
    themeHex: '#fb7185',
    items: [
      makeItem('med-1', 'Cervello', '🧠', ['mente', 'intelligenza']),
      makeItem('med-2', 'Cuore', '🫀', ['organo cardiaco', 'battito']),
      makeItem('med-3', 'Polmoni', '🫁', ['polmone', 'respiro']),
      makeItem('med-4', 'Dente', '🦷', ['denti', 'molare', 'dentista']),
      makeItem('med-5', 'Osso', '🦴', ['ossa', 'scheletro', 'femore']),
      makeItem('med-6', 'Occhio', '👁️', ['occhi', 'pupilla', 'vista']),
      makeItem('med-7', 'Orecchio', '👂', ['orecchie', 'udito']),
      makeItem('med-8', 'Naso', '👃', ['olfatto', 'narici']),
      makeItem('med-9', 'Lingua', '👅', ['bocca', 'gusto']),
      makeItem('med-10', 'Muscolo', '💪', ['bicipite', 'braccio', 'forza']),
      makeItem('med-11', 'Impronta Digitale', '🫆', ['impronta', 'dito'], emojiToVectorUrl('🖐️')),
      makeItem('med-12', 'Siringa', '💉', ['vaccino', 'iniezione', 'ago']),
      makeItem('med-13', 'Pillola', '💊', ['medicina', 'capsula', 'pastiglia', 'farmaco']),
      makeItem('med-14', 'Cerotto', '🩹', ['benda', 'medicazione']),
      makeItem('med-15', 'Stetoscopio', '🩺', ['medico', 'dottore']),
      makeItem('med-16', 'Termometro', '🌡️', ['febbre', 'temperatura']),
      makeItem('med-17', 'DNA', '🧬', ['genetica', 'elica', 'cromosoma']),
      makeItem('med-18', 'Teschio', '💀', ['cranio', 'scheletro']),
    ],
  },
  {
    id: 'monumenti-viaggi',
    name: 'Monumenti & Mondo',
    subtitle: 'Simboli iconici di città, storia e avventura',
    icon: '🗽',
    themeHex: '#eab308',
    items: [
      makeItem('mon-1', 'Statua della Libertà', '🗽', ['new york', 'liberta', 'statua']),
      makeItem('mon-2', 'Torre Eiffel', '🗼', ['tour eiffel', 'parigi', 'eiffel', 'torre']),
      makeItem('mon-3', 'Moai', '🗿', ['isola di pasqua', 'statua di pietra', 'testa di pietra']),
      makeItem('mon-4', 'Castello', '🏰', ['fortezza', 'reggia', 'rocca']),
      makeItem('mon-5', 'Tenda da Campeggio', '⛺', ['tenda', 'campeggio', 'camping']),
      makeItem('mon-6', 'Bussola', '🧭', ['orientamento', 'nord']),
      makeItem('mon-7', 'Mappa', '🗺️', ['cartina', 'mappa del tesoro']),
      makeItem('mon-8', 'Montagne Russe', '🎢', ['ottovolante', 'luna park', 'giostra']),
      makeItem('mon-9', 'Ruota Panoramica', '🎡', ['ruota', 'luna park']),
      makeItem('mon-10', 'Circo', '🎪', ['tendone', 'tendone da circo']),
      makeItem('mon-11', 'Ponte', '🌉', ['golden gate', 'ponte sospeso']),
      makeItem('mon-12', 'Fontana', '⛲', ['zampillo', 'acqua']),
      makeItem('mon-13', 'Moschea', '🕌', ['tempio', 'cupola']),
      makeItem('mon-14', 'Chiesa', '⛪', ['cattedrale', 'duomo']),
      makeItem('mon-15', 'Monte Fuji', '🗻', ['montagna', 'vetta', 'fuji']),
      makeItem('mon-16', 'Passaporto', '🛂', ['dogana', 'documento', 'visto']),
    ],
  },
  {
    id: 'fantasy-miti',
    name: 'Fantasy & Leggende',
    subtitle: 'Creature magiche, eroi, mostri e mistero',
    icon: '🐉',
    themeHex: '#8b5cf6',
    items: [
      makeItem('fan-1', 'Drago', '🐉', ['dragone', 'draghi', 'serpente alato']),
      makeItem('fan-2', 'Unicorno', '🦄', ['cavallo col corno', 'pegaso']),
      makeItem('fan-3', 'Fantasma', '👻', ['spettro', 'spiritello', 'ectoplasma']),
      makeItem('fan-4', 'Vampiro', '🧛', ['dracula', 'nosferatu']),
      makeItem('fan-5', 'Zombie', '🧟', ['morto vivente', 'zombi']),
      makeItem('fan-6', 'Sirena', '🧜‍♀️', ['tritone', 'sirenetta']),
      makeItem('fan-7', 'Genio della Lampada', '🧞', ['genio', 'aladino']),
      makeItem('fan-8', 'Mago', '🧙', ['stregone', 'merlino', 'gandalf', 'strega']),
      makeItem('fan-9', 'Fata', '🧚', ['fatina', 'trilli', 'folletto']),
      makeItem('fan-10', 'Elfo', '🧝', ['legolas', 'elfi']),
      makeItem('fan-11', 'Supereroe', '🦸', ['eroe', 'superman']),
      makeItem('fan-12', 'Spada', '⚔️', ['spade', 'excalibur', 'lama']),
      makeItem('fan-13', 'Scudo', '🛡️', ['armatura', 'difesa']),
      makeItem('fan-14', 'Sfera di Cristallo', '🔮', ['veggente', 'magia', 'palla di cristallo']),
      makeItem('fan-15', 'Bacchetta Magica', '🪄', ['bacchetta', 'harry potter', 'incantesimo']),
      makeItem('fan-16', 'Tridente', '🔱', ['poseidone', 'nettuno', 'forcone']),
    ],
  },
  {
    id: 'spettacolo-arte',
    name: 'Cinema, Arte & Giochi',
    subtitle: 'Simboli dell’intrattenimento, hobby e spettacolo',
    icon: '🎬',
    themeHex: '#f97316',
    items: [
      makeItem('art-1', 'Ciak', '🎬', ['cinema', 'regista', 'film', 'ciak si gira']),
      makeItem('art-2', 'Tavolozza', '🎨', ['pittura', 'colori', 'pittore', 'arte']),
      makeItem('art-3', 'Maschere Teatrali', '🎭', ['teatro', 'commedia', 'maschera', 'maschere']),
      makeItem('art-4', 'Dado', '🎲', ['dadi', 'gioco da tavolo']),
      makeItem('art-5', 'Scacchi', '♟️', ['pedone', 'scacchiera', 're degli scacchi']),
      makeItem('art-6', 'Puzzle', '🧩', ['tessera del puzzle', 'incastro', 'rompicapo']),
      makeItem('art-7', 'Carta da Gioco', '🃏', ['jolly', 'joker', 'carte']),
      makeItem('art-8', 'Bersaglio', '🎯', ['freccette', 'centro', 'bulls eye']),
      makeItem('art-9', 'Slot Machine', '🎰', ['casino', 'jackpot', '777']),
      makeItem('art-10', 'Aquilone', '🪁', ['vento', 'aquiloni']),
      makeItem('art-11', 'Yo-Yo', '🪀', ['yoyo', 'ioio']),
      makeItem('art-12', 'Orsacchiotto', '🧸', ['peluche', 'teddy bear', 'orsetto']),
      makeItem('art-13', 'Pacco Regalo', '🎁', ['regalo', 'dono', 'fiocco']),
      makeItem('art-14', 'Biglietto', '🎟️', ['ticket', 'ingresso', 'cinema']),
      makeItem('art-15', 'Fuochi d’Artificio', '🎆', ['botti', 'capodanno', 'fuochi']),
      makeItem('art-16', 'Libro', '📖', ['romanzo', 'lettura', 'libri']),
    ],
  },
  {
    id: 'lavoro-scuola',
    name: 'Scuola & Mestieri',
    subtitle: 'Strumenti di studio, ufficio, finanza e cantiere',
    icon: '🎓',
    themeHex: '#0ea5e9',
    items: [
      makeItem('wrk-1', 'Tocco di Laurea', '🎓', ['laurea', 'cappello di laurea', 'universita']),
      makeItem('wrk-2', 'Matita', '✏️', ['lapis', 'matite']),
      makeItem('wrk-3', 'Penna', '🖊️', ['biro', 'penna a sfera']),
      makeItem('wrk-4', 'Righello', '📏', ['metro', 'squadra']),
      makeItem('wrk-5', 'Zaino di Scuola', '🎒', ['cartella', 'zaino']),
      makeItem('wrk-6', 'Bilancia', '⚖️', ['giustizia', 'tribunale', 'legge', 'pesi']),
      makeItem('wrk-7', 'Valigetta', '💼', ['ventiquattrore', 'ufficio', 'lavoro']),
      makeItem('wrk-8', 'Banconote', '💵', ['soldi', 'denaro', 'contanti', 'dollaro', 'euro']),
      makeItem('wrk-9', 'Carta di Credito', '💳', ['bancomat', 'carta', 'pagamento']),
      makeItem('wrk-10', 'Carrello della Spesa', '🛒', ['carrello', 'supermercato', 'spesa']),
      makeItem('wrk-11', 'Estintore', '🧯', ['antincendio', 'pompiere']),
      makeItem('wrk-12', 'Ingranaggio', '⚙️', ['ruota dentata', 'meccanica', 'impostazioni']),
      makeItem('wrk-13', 'Bomba', '💣', ['esplosivo', 'mina', 'dinamite']),
      makeItem('wrk-14', 'Busta da Lettera', '✉️', ['lettera', 'posta', 'busta', 'email']),
      makeItem('wrk-15', 'Pacco Postale', '📦', ['scatola', 'pacco', 'spedizione', 'cartone']),
      makeItem('wrk-16', 'Cestino', '🗑️', ['pattumiera', 'spazzatura', 'bidone']),
    ],
  },
];

const CUSTOM_CATEGORIES_STORAGE_KEY = 'floor_arena_custom_categories_v1';

export function loadAllCategories(): Category[] {
  try {
    const saved = localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
    if (!saved) return DEFAULT_CATEGORIES;
    const parsed: Category[] = JSON.parse(saved);
    if (!Array.isArray(parsed)) return DEFAULT_CATEGORIES;
    return [...parsed, ...DEFAULT_CATEGORIES];
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCustomCategories(customCategories: Category[]): void {
  try {
    localStorage.setItem(
      CUSTOM_CATEGORIES_STORAGE_KEY,
      JSON.stringify(customCategories)
    );
  } catch {
    // Ignora errori di quota
  }
}

export function getCustomCategoriesOnly(): Category[] {
  try {
    const saved = localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
    if (!saved) return [];
    const parsed: Category[] = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Pre-carica nella cache del browser tutte le immagini di una categoria prima dell'inizio del duello */
export function preloadCategoryImages(category: Category): void {
  if (typeof window === 'undefined') return;
  category.items.forEach((item) => {
    if (item.imageUrl) {
      const img = new Image();
      img.src = item.imageUrl;
    }
  });
}
