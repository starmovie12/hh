
export interface Movie {
  movie_id: string;
  title: string;
  poster: string;
  rating: string | number;
  quality_name: string;
  year: string | number;
  original_language?: string;
  category?: string;
  adult_content?: string | boolean;
  cast?: string;
  director?: string;
  genre?: string;
  industry?: string;
  keywords?: string;
  platform?: string;
  spoken_languages?: string;
  writer?: string;
  description?: string;
  video_url?: string; // Optional custom URL
}

export enum TabCategory {
  HOME = 'home',
  MOVIES = 'movies',
  SERIES = 'tvshow',
  ANIME = 'anime',
  ADULT = 'adult'
}

export interface TabInfo {
  id: TabCategory;
  label: string;
}
