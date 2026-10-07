import { ActivityCategory } from './enums/activity-category.enum';

export interface Activity {
  id: number;
  name: string;
  description: string;
  activityDate: string;
  location: string;
  estimatedCost: number;
  completed: boolean;
  category: ActivityCategory;
}
