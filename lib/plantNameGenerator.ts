// Random Plant Nickname Generator for Teman Tanam
// Generates fun, species-aware nicknames in mixed Indonesian/English styles

type NamePool = {
  nicknames: string[];
  fullNames: string[];
  traits: string[];
};

const speciesNames: Record<string, NamePool> = {
  // Vegetables
  'bawang merah': {
    nicknames: ['Merah', 'Bawangku', 'Si Merah', 'Merahku'],
    fullNames: ['Bawang Cantik', 'Si Merah Pedas', 'Bawang Kesayangan'],
    traits: ['Si Pedas', 'The Red One', 'Spicy Baby', 'Red Hot']
  },
  'bawang putih': {
    nicknames: ['Putih', 'Si Putih', 'Garlic', 'Putihku'],
    fullNames: ['Bawang Putih Manis', 'Si Putih Harum', 'Garlic Baby'],
    traits: ['Si Harum', 'Vampire Slayer', 'White Wonder']
  },
  'cabai': {
    nicknames: ['Cabe', 'Si Pedas', 'Chili', 'Cabeiku'],
    fullNames: ['Cabai Ganteng', 'Si Merah Menyala', 'Chili Pepper'],
    traits: ['Hot Stuff', 'Si Pedes', 'Fire Baby', 'Spicy One']
  },
  'cabai rawit': {
    nicknames: ['Rawit', 'Si Kecil Pedas', 'Mini Chili'],
    fullNames: ['Rawit Super', 'Si Kecil Menyala', 'Tiny But Mighty'],
    traits: ['Little Fire', 'Pedes Banget', 'Small But Deadly']
  },
  'tomat': {
    nicknames: ['Tom', 'Tomi', 'Si Bulat', 'Tomato'],
    fullNames: ['Tomat Cantik', 'Si Merah Segar', 'Tomato Baby'],
    traits: ['Si Segar', 'Red Ball', 'Juicy One', 'Fresh Boy']
  },
  'kangkung': {
    nicknames: ['Kung', 'Kangku', 'Si Hijau'],
    fullNames: ['Kangkung Segar', 'Si Hijau Renyah', 'Water Spinach'],
    traits: ['Si Renyah', 'Green Queen', 'Swamp Baby']
  },
  'bayam': {
    nicknames: ['Popeye', 'Si Kuat', 'Bayamku'],
    fullNames: ['Bayam Segar', 'Si Hijau Sehat', 'Spinach Baby'],
    traits: ['Strong One', 'Iron Baby', 'Green Power']
  },
  'sawi': {
    nicknames: ['Sawi', 'Si Sawi', 'Greeny'],
    fullNames: ['Sawi Hijau', 'Si Daun Lebar', 'Mustard Green'],
    traits: ['Leafy One', 'Green Giant', 'Big Leaf']
  },
  'terong': {
    nicknames: ['Terong', 'Ungu', 'Si Ungu'],
    fullNames: ['Terong Cantik', 'Si Ungu Mulus', 'Eggplant Baby'],
    traits: ['Purple Beauty', 'Smooth One', 'Ungu Kece']
  },
  'mentimun': {
    nicknames: ['Timun', 'Cuki', 'Si Segar'],
    fullNames: ['Mentimun Segar', 'Si Hijau Renyah', 'Cool Cucumber'],
    traits: ['Cool One', 'Fresh Baby', 'Crunchy']
  },
  'selada': {
    nicknames: ['Lettuce', 'Salad', 'Si Daun'],
    fullNames: ['Selada Segar', 'Lettuce Baby', 'Salad Queen'],
    traits: ['Crunchy One', 'Fresh Leaf', 'Green Crisp']
  },
  'pakcoy': {
    nicknames: ['Pakcoy', 'Choy', 'Si Gemuk'],
    fullNames: ['Pakcoy Segar', 'Baby Bok Choy', 'Choy Baby'],
    traits: ['Chubby One', 'Asian Green', 'Bok Baby']
  },

  // Herbs
  'kemangi': {
    nicknames: ['Basil', 'Mangi', 'Si Wangi'],
    fullNames: ['Kemangi Harum', 'Si Daun Wangi', 'Basil Baby'],
    traits: ['Fragrant One', 'Aromatic', 'Sweet Smell']
  },
  'serai': {
    nicknames: ['Serai', 'Lemongrass', 'Si Harum'],
    fullNames: ['Serai Wangi', 'Lemongrass Baby', 'Citrus Grass'],
    traits: ['Lemony', 'Tall One', 'Citrus Baby']
  },
  'jahe': {
    nicknames: ['Jahe', 'Ginger', 'Si Hangat'],
    fullNames: ['Jahe Merah', 'Ginger Baby', 'Si Pedas Hangat'],
    traits: ['Warm One', 'Spicy Root', 'Hot Ginger']
  },
  'kunyit': {
    nicknames: ['Kunyit', 'Turmeric', 'Si Kuning'],
    fullNames: ['Kunyit Cantik', 'Golden One', 'Yellow Baby'],
    traits: ['Golden', 'Yellow Power', 'Si Sehat']
  },
  'lengkuas': {
    nicknames: ['Laos', 'Galangal', 'Si Keras'],
    fullNames: ['Lengkuas Wangi', 'Galangal Baby', 'Aromatic Root'],
    traits: ['Strong Root', 'Tough One', 'Spice King']
  },
  'mint': {
    nicknames: ['Mint', 'Minty', 'Si Segar'],
    fullNames: ['Mint Segar', 'Fresh Mint', 'Cool Mint'],
    traits: ['Cool One', 'Fresh Breath', 'Minty Fresh']
  },
  'daun bawang': {
    nicknames: ['Bawang', 'Scallion', 'Si Panjang'],
    fullNames: ['Daun Bawang Segar', 'Green Onion', 'Scallion Baby'],
    traits: ['Long One', 'Green Stick', 'Onion Top']
  },
  'daun jeruk': {
    nicknames: ['Jeruk', 'Lime Leaf', 'Si Harum'],
    fullNames: ['Daun Jeruk Wangi', 'Kaffir Lime', 'Citrus Leaf'],
    traits: ['Fragrant Leaf', 'Citrus One', 'Aromatic']
  },
  'daun salam': {
    nicknames: ['Salam', 'Bay Leaf', 'Si Daun'],
    fullNames: ['Daun Salam Wangi', 'Indonesian Bay', 'Salam Baby'],
    traits: ['Aromatic Leaf', 'Flavor King', 'Spice Leaf']
  },
  'daun pandan': {
    nicknames: ['Pandan', 'Si Wangi', 'Greeny'],
    fullNames: ['Pandan Wangi', 'Fragrant Pandan', 'Sweet Leaf'],
    traits: ['Sweet Smell', 'Aromatic One', 'Vanilla Leaf']
  },

  // Ornamental Plants
  'monstera': {
    nicknames: ['Mon', 'Monmon', 'Si Bolong'],
    fullNames: ['Monstera Cantik', 'Swiss Cheese', 'Hole Baby'],
    traits: ['Holey One', 'Big Leaf', 'Jungle Queen']
  },
  'sirih gading': {
    nicknames: ['Pothos', 'Gading', 'Si Rambat'],
    fullNames: ['Sirih Gading Cantik', 'Golden Pothos', 'Climbing Baby'],
    traits: ['Climber', 'Golden One', 'Easy Going']
  },
  'lidah mertua': {
    nicknames: ['Snake', 'Snakey', 'Si Tegak'],
    fullNames: ['Snake Plant', 'Mother Tongue', 'Tough One'],
    traits: ['Tall One', 'Air Cleaner', 'Low Maintenance']
  },
  'peace lily': {
    nicknames: ['Lily', 'Peace', 'Si Damai'],
    fullNames: ['Peace Lily Cantik', 'White Flower', 'Peaceful One'],
    traits: ['Peaceful', 'White Beauty', 'Air Purifier']
  },
  'philodendron': {
    nicknames: ['Philo', 'Phil', 'Si Hati'],
    fullNames: ['Philodendron Cantik', 'Heart Leaf', 'Love Plant'],
    traits: ['Heart Shaped', 'Jungle Baby', 'Easy One']
  },
  'aglonema': {
    nicknames: ['Aglo', 'Sri Rejeki', 'Si Cantik'],
    fullNames: ['Aglonema Merah', 'Chinese Evergreen', 'Lucky Plant'],
    traits: ['Colorful One', 'Lucky Charm', 'Pretty Baby']
  },
  'calathea': {
    nicknames: ['Cala', 'Prayer', 'Si Doa'],
    fullNames: ['Calathea Cantik', 'Prayer Plant', 'Moving Leaf'],
    traits: ['Dancing Leaf', 'Night Prayer', 'Dramatic One']
  },
  'sukulen': {
    nicknames: ['Suki', 'Chubby', 'Si Gemuk'],
    fullNames: ['Sukulen Imut', 'Chubby Baby', 'Water Saver'],
    traits: ['Plump One', 'Desert Baby', 'Low Water']
  },
  'kaktus': {
    nicknames: ['Kaktus', 'Spiky', 'Si Duri'],
    fullNames: ['Kaktus Imut', 'Spiky Baby', 'Desert Warrior'],
    traits: ['Tough One', 'Spiky Friend', 'No Water Needed']
  },
  'anthurium': {
    nicknames: ['Anthu', 'Heart', 'Si Hati'],
    fullNames: ['Anthurium Merah', 'Flamingo Flower', 'Heart Plant'],
    traits: ['Heart Shaped', 'Red Beauty', 'Elegant One']
  },
  'keladi': {
    nicknames: ['Keladi', 'Caladium', 'Si Warna'],
    fullNames: ['Keladi Cantik', 'Colorful Leaf', 'Rainbow Baby'],
    traits: ['Colorful One', 'Fancy Leaf', 'Show Off']
  },

  // Fruits
  'kopi': {
    nicknames: ['Kopi', 'Coffee', 'Si Pahit'],
    fullNames: ['Kopi Arabika', 'Coffee Baby', 'Java Bean'],
    traits: ['Caffeine King', 'Morning Glory', 'Bean Baby']
  },
  'mangga': {
    nicknames: ['Mangga', 'Mango', 'Si Manis'],
    fullNames: ['Mangga Harum', 'Mango Baby', 'Sweet One'],
    traits: ['Sweet King', 'Tropical', 'Juicy One']
  },
  'jeruk': {
    nicknames: ['Jeruk', 'Orange', 'Si Asem'],
    fullNames: ['Jeruk Manis', 'Citrus Baby', 'Orange One'],
    traits: ['Sour One', 'Vitamin C', 'Citrus King']
  },
  'pepaya': {
    nicknames: ['Pepaya', 'Papaya', 'Si Manis'],
    fullNames: ['Pepaya Manis', 'Papaya Baby', 'Tropical Fruit'],
    traits: ['Sweet One', 'Digestive', 'Orange Inside']
  },
  'pisang': {
    nicknames: ['Pisang', 'Banana', 'Si Kuning'],
    fullNames: ['Pisang Manis', 'Banana Baby', 'Yellow One'],
    traits: ['Potassium King', 'Energy Fruit', 'Monkey Food']
  },
  'jambu': {
    nicknames: ['Jambu', 'Guava', 'Si Renyah'],
    fullNames: ['Jambu Merah', 'Guava Baby', 'Crunchy One'],
    traits: ['Crunchy', 'Pink Inside', 'Vitamin Bomb']
  },
  'alpukat': {
    nicknames: ['Alpukat', 'Avocado', 'Si Creamy'],
    fullNames: ['Alpukat Mentega', 'Avo Baby', 'Creamy One'],
    traits: ['Healthy Fat', 'Creamy King', 'Green Gold']
  },
  'durian': {
    nicknames: ['Duren', 'Durian', 'Si Bau'],
    fullNames: ['Durian Montong', 'King of Fruits', 'Smelly Baby'],
    traits: ['Stinky King', 'Love or Hate', 'Thorny One']
  },
  'rambutan': {
    nicknames: ['Rambutan', 'Hairy', 'Si Rambut'],
    fullNames: ['Rambutan Manis', 'Hairy Fruit', 'Red Ball'],
    traits: ['Hairy One', 'Sweet Inside', 'Spiky Red']
  },
  'kelapa': {
    nicknames: ['Kelapa', 'Coconut', 'Si Bulat'],
    fullNames: ['Kelapa Muda', 'Coco Baby', 'Tropical Nut'],
    traits: ['Hard Shell', 'Water Inside', 'Beach Vibes']
  },

  // Flowers
  'mawar': {
    nicknames: ['Rose', 'Mawar', 'Si Cantik'],
    fullNames: ['Mawar Merah', 'Rose Baby', 'Beautiful One'],
    traits: ['Romantic', 'Thorny Beauty', 'Classic Queen']
  },
  'melati': {
    nicknames: ['Melati', 'Jasmine', 'Si Wangi'],
    fullNames: ['Melati Putih', 'Jasmine Baby', 'Fragrant One'],
    traits: ['Sweet Smell', 'White Beauty', 'Wedding Flower']
  },
  'anggrek': {
    nicknames: ['Orchid', 'Anggrek', 'Si Elegan'],
    fullNames: ['Anggrek Bulan', 'Orchid Baby', 'Elegant One'],
    traits: ['Elegant', 'Exotic Beauty', 'Fancy Flower']
  },
  'matahari': {
    nicknames: ['Sunflower', 'Sunny', 'Si Ceria'],
    fullNames: ['Bunga Matahari', 'Sunshine Baby', 'Happy Flower'],
    traits: ['Sun Follower', 'Happy One', 'Bright Yellow']
  },
  'krisan': {
    nicknames: ['Krisan', 'Mum', 'Si Bundar'],
    fullNames: ['Krisan Cantik', 'Chrysanthemum', 'Round Beauty'],
    traits: ['Fall Flower', 'Round One', 'Many Petals']
  },
  'lavender': {
    nicknames: ['Lavender', 'Lav', 'Si Ungu'],
    fullNames: ['Lavender Wangi', 'Purple Dream', 'Calming One'],
    traits: ['Relaxing', 'Purple Beauty', 'Sleep Helper']
  },
  'kamboja': {
    nicknames: ['Kamboja', 'Plumeria', 'Si Harum'],
    fullNames: ['Kamboja Putih', 'Frangipani', 'Temple Flower'],
    traits: ['Tropical Smell', 'Island Vibes', 'Sweet Fragrance']
  }
};

const genericPrefixes = ['Si', 'Mas', 'Mbak', 'Dek', 'Kak', 'Bang', 'Neng', 'Cik'];
const genericSuffixes = ['Sayang', 'Kesayangan', 'Cantik', 'Ganteng', 'Imut', 'Lucu', 'Manis', 'Kece', 'Jagoan'];
const funAdjectives = ['Super', 'Mini', 'Mungil', 'Jumbo', 'Baby', 'Little', 'Big', 'Mighty'];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateGenericName(speciesName: string): string {
  const patterns = [
    () => `${getRandomItem(genericPrefixes)} ${speciesName.split(' ')[0]}`,
    () => `${speciesName.split(' ')[0]} ${getRandomItem(genericSuffixes)}`,
    () => `${getRandomItem(funAdjectives)} ${speciesName.split(' ')[0]}`,
    () => `${getRandomItem(genericPrefixes)} ${getRandomItem(genericSuffixes)}`,
  ];
  return getRandomItem(patterns)();
}

function generateNumberedName(speciesName: string, count: number): string {
  const baseName = speciesName.split(' ')[0];
  const capitalizedBase = baseName.charAt(0).toUpperCase() + baseName.slice(1);
  return `${capitalizedBase} ${count + 1}`;
}

export function generatePlantName(speciesCommonName: string, existingPlantsCount: number = 0): string {
  const normalizedName = speciesCommonName.toLowerCase().trim();
  const speciesPool = speciesNames[normalizedName];

  if (speciesPool) {
    const allOptions = [
      ...speciesPool.nicknames,
      ...speciesPool.fullNames,
      ...speciesPool.traits,
      generateGenericName(speciesCommonName),
      generateNumberedName(speciesCommonName, existingPlantsCount),
    ];
    return getRandomItem(allOptions);
  }

  // Fallback for unmapped species
  const fallbackOptions = [
    generateGenericName(speciesCommonName),
    generateNumberedName(speciesCommonName, existingPlantsCount),
    `${getRandomItem(genericPrefixes)} ${speciesCommonName.split(' ')[0]}`,
    `${speciesCommonName.split(' ')[0]} ${getRandomItem(genericSuffixes)}`,
  ];
  return getRandomItem(fallbackOptions);
}

export function generateMultipleNames(speciesCommonName: string, count: number = 5): string[] {
  const names = new Set<string>();
  let attempts = 0;
  const maxAttempts = count * 3;

  while (names.size < count && attempts < maxAttempts) {
    names.add(generatePlantName(speciesCommonName, names.size));
    attempts++;
  }

  return Array.from(names);
}
