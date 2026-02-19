
import React from 'react';
import { Movie } from '../types.ts';
import { MovieCard } from './MovieCard.tsx';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
}

export const MovieRow: React.FC<MovieRowProps> = ({ title, movies, onMovieClick }) => {
  if (movies.length === 0) return null;

  return (
    <section className="space-y-3 mb-6 overflow-hidden">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-[15px] font-[800] tracking-tight text-white/95 uppercase border-l-[3px] border-red-600 pl-3 leading-none">
          {title}
        </h2>
        <div className="flex items-center gap-1 group cursor-pointer">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">More</span>
          <svg className="w-3 h-3 text-gray-500 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
        </div>
      </div>
      
      <div className="flex overflow-x-auto no-scrollbar gap-[5px] pb-4 pl-4">
        {movies.map((movie) => (
          <div key={movie.movie_id} className="w-[104px] flex-shrink-0">
            <MovieCard movie={movie} variant="portrait" onClick={onMovieClick} />
          </div>
        ))}
      </div>
    </section>
  );
};
