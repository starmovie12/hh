
import React from 'react';
import { Movie } from '../types.ts';

interface HeroBannerProps {
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ movies, onMovieClick }) => {
  const featured = movies.slice(0, 5);

  if (featured.length === 0) return null;

  return (
    <div className="relative w-full pt-16 pb-8">
      <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 gap-4">
        {featured.map((movie) => (
          <div 
            key={movie.movie_id}
            className="relative flex-shrink-0 w-[88%] aspect-hero rounded-[2.5rem] overflow-hidden snap-center group cursor-pointer border border-white/5 shadow-2xl transition-transform duration-500 active:scale-[0.98]"
            onClick={() => onMovieClick(movie)}
          >
            <img 
              src={movie.poster} 
              alt={movie.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            
            <div className="absolute inset-0 hero-gradient" />
            
            <div className="absolute top-5 left-5 flex items-center gap-1.5 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-yellow-400 text-[10px] drop-shadow-lg">★</span>
              <span className="text-white text-[10px] font-black tracking-wide">{movie.rating || '8.4'}</span>
            </div>

            <div className="absolute top-5 right-5 bg-red-600/90 text-white text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest shadow-lg">
              4K Ultra HD
            </div>

            <div className="absolute bottom-0 left-0 w-full p-8 space-y-3">
              <h2 className="text-3xl font-[900] text-white leading-tight tracking-tighter uppercase italic drop-shadow-2xl">
                {movie.title}
              </h2>
              
              <div className="flex items-center gap-2.5 text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">
                <span>{movie.year}</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span>{movie.original_language?.toUpperCase() || 'MULTI'}</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span>{movie.category || 'Special Edition'}</span>
              </div>
              
              <div className="flex items-center gap-3 pt-3">
                <button className="flex-1 bg-white text-black h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest active:scale-95 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  Watch Now
                </button>
                <button className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className="flex-shrink-0 w-4" />
      </div>
    </div>
  );
};
