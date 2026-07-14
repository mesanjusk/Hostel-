export interface SuggestedItemDTO {
  key: string;
  name: string;
  category: string;
  usersUsing: number;
  completionPercent: number;
  mostPopularCollegeCategory: string | null;
  mostPopularCourse: string | null;
  firstAdded: string;
  lastUsed: string;
}
