
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Movie } from './types.ts';
import { fetchAllMovies } from './services/firebaseService.ts';
import { VideoPlayer } from './components/VideoPlayer.tsx';
import { HeroBanner } from './components/HeroBanner.tsx';
import { MovieRow } from './components/MovieRow.tsx';

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchAllMovies();
      setMovies(data);
      setLoading(false);
    };
    load();
  }, []);

  const enterFullScreen = useCallback(() => {
    if (document.fullscreenElement) return;

    const element = document.documentElement as any;
    const requestMethod = 
      element.requestFullscreen || 
      element.webkitRequestFullscreen || 
      element.mozRequestFullScreen || 
      element.msRequestFullscreen;

    if (requestMethod) {
      requestMethod.call(element).catch((err: any) => {
        console.warn(`Fullscreen request failed: ${err.message}`);
      });
    }
  }, []);

  useEffect(() => {
    const handleInitialInteraction = () => {
      enterFullScreen();
    };

    window.addEventListener('click', handleInitialInteraction);
    window.addEventListener('touchstart', handleInitialInteraction);

    return () => {
      window.removeEventListener('click', handleInitialInteraction);
      window.removeEventListener('touchstart', handleInitialInteraction);
    };
  }, [enterFullScreen]);

  const handleMovieClick = useCallback((movie: Movie) => {
    setSelectedMovieId(movie.movie_id);
    enterFullScreen();
  }, [enterFullScreen]);

  const trending = useMemo(() => movies.slice(0, 8), [movies]);
  const action = useMemo(() => movies.filter(m => m.genre?.toLowerCase().includes('action')).slice(0, 10), [movies]);
  const horror = useMemo(() => movies.filter(m => m.genre?.toLowerCase().includes('horror')).slice(0, 10), [movies]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#030812]">
         <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-[3px] border-blue-600/10 rounded-full"></div>
            <div className="absolute inset-0 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
         </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#030812] text-white overflow-x-hidden pb-24">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[60] px-5 py-4 flex items-center justify-between glass-header pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 group cursor-pointer" onClick={enterFullScreen}>
          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/40 group-active:scale-90 transition-transform">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
            </svg>
          </div>
          <span className="text-xl font-[900] tracking-tighter text-white uppercase italic">MFLIX</span>
        </div>
        
        <div className="pointer-events-auto flex items-center gap-4">
           <button className="text-white/80 p-1 relative active:scale-90 transition-transform">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
             </svg>
             <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border border-black animate-pulse"></span>
           </button>
           
           <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 p-0.5 overflow-hidden active:scale-90 transition-transform">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Professional" className="w-full h-full object-cover" alt="User" />
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="animate-fadeIn">
        <HeroBanner movies={trending} onMovieClick={handleMovieClick} />

        <div className="space-y-6">
          <MovieRow title="Latest Blockbusters" movies={trending} onMovieClick={handleMovieClick} />
          <MovieRow title="High-Octane Action" movies={action.length ? action : movies.slice(10, 20)} onMovieClick={handleMovieClick} />
          <MovieRow title="Thrillers & Horror" movies={horror.length ? horror : movies.slice(5, 15)} onMovieClick={handleMovieClick} />
        </div>
      </main>

      {/* Floating Category Pill - SPORTS REMOVED, SEARCH BOX ADDED */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[85%] max-w-sm">
        <div className="bg-gradient-to-r from-[#161b33] to-[#4a154b] flex items-center h-[60px] rounded-full px-2 shadow-2xl shadow-black/80 border border-white/10 backdrop-blur-xl">
          
          <button className="flex-1 text-center text-white/70 hover:text-white text-[15px] font-bold tracking-tight active:scale-95 transition-all">
            TV
          </button>
          
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          
          <button className="flex-1 text-center text-white text-[15px] font-bold tracking-tight active:scale-95 transition-all">
            Movies
          </button>
          
          <div className="w-[1px] h-6 bg-white/10 mx-1" />

          {/* Search Box (Goal dabba) on the right side */}
          <div className="flex items-center pr-1 gap-2">
            <button className="w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all shadow-inner">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <div className="w-[1px] h-6 bg-white/10" />
            
            <button className="px-3 h-11 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {selectedMovieId && (
        <VideoPlayer 
          movieId={selectedMovieId} 
          onClose={() => setSelectedMovieId(null)} 
        />
      )}
    </div>
  );
}
