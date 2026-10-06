import { Destination } from '../models/models';
import { IMG } from './images';

export const MOCK_DESTINATIONS: Destination[] = [
  { id: 'paris', name: 'Paris', country: 'France', image: IMG.paris, tripsCount: 6 },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', image: IMG.tokyo, tripsCount: 8 },
  { id: 'bali', name: 'Bali', country: 'Indonesia', image: IMG.baliBeach, tripsCount: 7 },
  { id: 'dubai', name: 'Dubai', country: 'UAE', image: IMG.dubai, tripsCount: 5 },
  { id: 'istanbul', name: 'Istanbul', country: 'Türkiye', image: IMG.istanbul, tripsCount: 4 },
  { id: 'new-york', name: 'New York', country: 'USA', image: IMG.nyc, tripsCount: 5 },
  { id: 'rome', name: 'Rome', country: 'Italy', image: IMG.rome, tripsCount: 6 },
  { id: 'barcelona', name: 'Barcelona', country: 'Spain', image: IMG.barcelona, tripsCount: 4 }
];
