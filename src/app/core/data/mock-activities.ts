import { Activity } from '../models/models';
import { IMG } from './images';

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'tea-kyoto',
    name: 'Kyoto Tea Ceremony',
    category: 'CULTURE',
    durationHours: 2,
    price: 96,
    description: 'A quiet hour with a local host, matcha, sweets, and the unhurried rhythm of a Kyoto teahouse.',
    location: 'Gion, Kyoto',
    image: IMG.tea,
    rating: 4.9
  },
  {
    id: 'fuji-day',
    name: 'Mount Fuji Day Experience',
    category: 'NATURE',
    durationHours: 10,
    price: 180,
    description: 'Lakeside views, a shrine walk, and time to simply watch the mountain change color.',
    location: 'Fuji Five Lakes, Japan',
    image: IMG.fuji,
    rating: 4.8
  },
  {
    id: 'tokyo-food',
    name: 'Tokyo Neighborhood Food Tour',
    category: 'FOOD',
    durationHours: 4,
    price: 128,
    description: 'Six stops, no tourist menus—izakaya bites, street croquettes, and a last dessert.',
    location: 'Yanaka & Tsukiji, Tokyo',
    image: IMG.food,
    rating: 4.9
  },
  {
    id: 'bali-spa',
    name: 'Ubud Jungle Spa Afternoon',
    category: 'RELAXATION',
    durationHours: 3,
    price: 110,
    description: 'Warm oil, a rice-field soundtrack, and a herbal tea that ends the day properly.',
    location: 'Ubud, Bali',
    image: IMG.relaxation,
    rating: 4.8
  },
  {
    id: 'nusa-snorkel',
    name: 'Nusa Dua Snorkel Morning',
    category: 'SPORT',
    durationHours: 3,
    price: 75,
    description: 'Clear water, reef fish, and a beach club lunch waiting when you come back in.',
    location: 'Nusa Dua, Bali',
    image: IMG.sport,
    rating: 4.7
  },
  {
    id: 'capri-boat',
    name: 'Private Boat to Capri',
    category: 'ADVENTURE',
    durationHours: 7,
    price: 260,
    description: 'Swim stops, a cliffside lunch, and the Amalfi coast from the water.',
    location: 'Positano, Italy',
    image: IMG.amalfi,
    rating: 4.9
  },
  {
    id: 'amalfi-hike',
    name: 'Path of the Gods',
    category: 'NATURE',
    durationHours: 5,
    price: 90,
    description: 'A guided clifftop walk with espresso in a village that still feels local.',
    location: 'Amalfi Coast, Italy',
    image: IMG.nature,
    rating: 4.8
  },
  {
    id: 'louvre-hour',
    name: 'Louvre Early Access',
    category: 'CULTURE',
    durationHours: 3,
    price: 140,
    description: 'Walk the galleries before the crowds, with a historian who knows where to pause.',
    location: 'Paris, France',
    image: IMG.culture,
    rating: 4.8
  },
  {
    id: 'desert-safari',
    name: 'Desert Safari Evening',
    category: 'ADVENTURE',
    durationHours: 6,
    price: 155,
    description: 'Dunes at golden hour, a camp dinner, and a sky that actually goes quiet.',
    location: 'Dubai, UAE',
    image: IMG.adventure,
    rating: 4.7
  },
  {
    id: 'bosphorus',
    name: 'Bosphorus Sunset Cruise',
    category: 'RELAXATION',
    durationHours: 2,
    price: 68,
    description: 'Palaces on both shores and tea on deck as the city lights come on.',
    location: 'Istanbul, Türkiye',
    image: IMG.istanbul,
    rating: 4.8
  },
  {
    id: 'nyc-food',
    name: 'Brooklyn Food Walk',
    category: 'FOOD',
    durationHours: 3,
    price: 85,
    description: 'Bagels, natural wine, and a slice that locals still argue about.',
    location: 'Brooklyn, New York',
    image: IMG.food,
    rating: 4.7
  },
  {
    id: 'pasta-class',
    name: 'Trastevere Pasta Workshop',
    category: 'FOOD',
    durationHours: 3,
    price: 92,
    description: 'Flour on the table, a family kitchen, and dinner you actually made.',
    location: 'Rome, Italy',
    image: IMG.food,
    rating: 4.9
  },
  {
    id: 'tapas-night',
    name: 'Gothic Quarter Tapas Night',
    category: 'FOOD',
    durationHours: 3,
    price: 78,
    description: 'Four bars, vermouth, and a last churro if you still have room.',
    location: 'Barcelona, Spain',
    image: IMG.barcelona,
    rating: 4.6
  },
  {
    id: 'glacier-walk',
    name: 'Guided Glacier Walk',
    category: 'ADVENTURE',
    durationHours: 5,
    price: 210,
    description: 'Crampons, blue ice, and a guide who keeps the pace honest.',
    location: 'South Coast, Iceland',
    image: IMG.iceland,
    rating: 4.9
  },
  {
    id: 'caldera-sail',
    name: 'Santorini Caldera Sail',
    category: 'RELAXATION',
    durationHours: 5,
    price: 175,
    description: 'A catamaran, a swim, and sunset from the water instead of the wall.',
    location: 'Santorini, Greece',
    image: IMG.santorini,
    rating: 4.8
  },
  {
    id: 'medina-walk',
    name: 'Medina Morning Walk',
    category: 'CULTURE',
    durationHours: 3,
    price: 55,
    description: 'Souks with a local who knows which door is a riad and which is a shortcut.',
    location: 'Marrakech, Morocco',
    image: IMG.morocco,
    rating: 4.7
  }
];
