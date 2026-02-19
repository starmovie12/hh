
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Movie } from '../types.ts';
import { fetchMovieById } from '../firebaseService.ts';

interface VideoPlayerProps {
  movieId: string;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ movieId, onClose }) => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  const enterFullscreenAndLandscape = useCallback(async () => {
    try {
      if (playerRef.current) {
        if (playerRef.current.requestFullscreen) {
          await playerRef.current.requestFullscreen();
        } else if ((playerRef.current as any).webkitRequestFullscreen) {
          await (playerRef.current as any).webkitRequestFullscreen();
        }
        if (window.screen.orientation && (window.screen.orientation as any).lock) {
          await (window.screen.orientation as any).lock('landscape').catch(() => {});
        }
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchMovieById(movieId);
      setMovie(data);
      setLoading(false);
      setTimeout(enterFullscreenAndLandscape, 600);
    };
    loadData();
  }, [movieId, enterFullscreenAndLandscape]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) onClose();
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [onClose]);

  const hideControls = useCallback(() => {
    if (isPlaying) {
      setShowControls(false);
      setShowSpeedMenu(false);
    }
  }, [isPlaying]);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    if (!isLocked) {
      controlsTimeoutRef.current = window.setTimeout(hideControls, 4000);
    }
  }, [hideControls, isLocked]);

  const toggleControls = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showControls) {
      setShowControls(false);
      setShowSpeedMenu(false);
    } else {
      resetControlsTimeout();
    }
  };

  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isLocked) {
      resetControlsTimeout();
      return;
    }
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    resetControlsTimeout();
  }, [resetControlsTimeout, isLocked]);

  const seek = useCallback((amount: number) => {
    if (isLocked || !videoRef.current) return;
    videoRef.current.currentTime += amount;
    resetControlsTimeout();
  }, [resetControlsTimeout, isLocked]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) videoRef.current.volume = val;
    resetControlsTimeout();
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setShowSpeedMenu(false);
    resetControlsTimeout();
  };

  const formatTime = (time: number) => {
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    return h > 0 
      ? `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}` 
      : `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#030812] flex items-center justify-center">
        <div className="w-12 h-12 border-[3px] border-[#e50914] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(229,9,20,0.3)]"></div>
      </div>
    );
  }

  if (!movie) return null;
  const videoSource = movie.video_url || "https://pub-34413a7eec4f40c883aa01fe9d524f5c.r2.dev/9c5758d1afb2d25ed91d694de729ecb6?token=1771449291";

  const progressPercent = (currentTime / duration) * 100 || 0;

  return (
    <div 
      ref={playerRef}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden select-none"
      onMouseMove={resetControlsTimeout}
      onClick={toggleControls}
    >
      <video
        ref={videoRef}
        src={videoSource}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Main Controls Overlay */}
      <div className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-500 bg-black/10 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Header - Simple and Clean */}
        <div className={`w-full px-8 pt-6 flex items-center justify-between bg-gradient-to-b from-black/95 via-black/30 to-transparent transition-transform duration-500 ${isLocked ? '-translate-y-full' : 'translate-y-0'}`}>
          <div className="flex items-center">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (document.exitFullscreen) document.exitFullscreen();
                onClose();
              }} 
              className="text-white hover:scale-110 active:scale-95 transition-all mr-6 p-2"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex flex-col">
              <h2 className="text-[15px] font-bold text-white tracking-tight truncate max-w-[60vw] drop-shadow-md uppercase italic">
                {movie.title}
              </h2>
              <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">{movie.quality_name || '1080P FHD'}</span>
            </div>
          </div>
          
          {/* Replaced menu with Lock Icon as requested */}
          <button 
            onClick={(e) => { e.stopPropagation(); setIsLocked(!isLocked); resetControlsTimeout(); }}
            className="text-white/80 p-2 hover:text-[#e50914] transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
            </svg>
          </button>
        </div>

        {/* Center Section: Iconic Play/Pause (No background circle) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center justify-center gap-16 pointer-events-auto">
            {!isLocked && (
              <button onClick={(e) => { e.stopPropagation(); seek(-10); }} className="p-4 text-white/60 hover:text-white transition-all transform hover:scale-110 active:scale-90">
                <div className="relative flex flex-col items-center">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>
                  <span className="text-[10px] font-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-0.5">10</span>
                </div>
              </button>
            )}

            <div className="relative">
              {isBuffering ? (
                <div className="w-16 h-16 border-[4px] border-[#e50914] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(229,9,20,0.6)]"></div>
              ) : !isLocked && (
                <button 
                  onClick={togglePlay}
                  className="w-24 h-24 flex items-center justify-center text-white transition-all transform hover:scale-125 active:scale-90"
                >
                  {isPlaying ? (
                    <svg className="w-20 h-20 drop-shadow-2xl" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="w-20 h-20 drop-shadow-2xl ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
              )}
            </div>

            {!isLocked && (
              <button onClick={(e) => { e.stopPropagation(); seek(10); }} className="p-4 text-white/60 hover:text-white transition-all transform hover:scale-110 active:scale-90">
                <div className="relative flex flex-col items-center">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.933 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4zM19.933 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" /></svg>
                  <span className="text-[10px] font-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-0.5">10</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Section - Pushed Lower */}
        <div className={`w-full px-8 pb-4 bg-gradient-to-t from-black via-black/80 to-transparent transition-transform duration-500 ${isLocked ? 'translate-y-full' : 'translate-y-0'}`}>
          
          {/* Time & Lock Info Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsLocked(!isLocked); resetControlsTimeout(); }}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${isLocked ? 'bg-[#e50914] border-[#e50914] text-white' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
                </svg>
                <span className="text-[9px] font-black uppercase tracking-widest">{isLocked ? 'Locked' : 'Lock'}</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2 tabular-nums text-white/80 text-[11px] font-black tracking-tighter">
              <span className="text-[#e50914]">{formatTime(currentTime)}</span>
              <span className="text-white/20">/</span>
              <span className="opacity-50">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Progress Bar with Dot Indicator */}
          <div className="relative w-full mb-6 group cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-[4px] w-full bg-white/10 rounded-full">
              {/* Active Progress */}
              <div 
                className="absolute top-0 left-0 h-full bg-[#e50914] rounded-full shadow-[0_0_12px_rgba(229,9,20,0.6)] transition-all duration-100" 
                style={{ width: `${progressPercent}%` }}
              />
              {/* The "Bindu" / Indicator Dot as requested */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-[12px] h-[12px] bg-[#e50914] rounded-full border-[2.5px] border-white shadow-xl transform -translate-x-1/2 transition-all duration-100"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
            <input 
              type="range" min="0" max={duration || 100} value={currentTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCurrentTime(val);
                if (videoRef.current) videoRef.current.currentTime = val;
              }}
              className="absolute inset-x-0 -top-4 w-full h-10 opacity-0 cursor-pointer z-30"
            />
          </div>

          {/* Icons Row - More Compact */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-8">
              <button onClick={togglePlay} className="text-white hover:text-[#e50914] transition-colors p-1">
                {isPlaying ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>

              <div className="flex items-center gap-3 group/volume">
                <button className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072M19.071 4.929a10 10 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                </button>
                <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 flex items-center">
                  <input type="range" min="0" max="1" step="0.1" value={volume} onChange={handleVolumeChange} className="w-full accent-[#e50914] h-1 bg-white/10 rounded-full" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }}
                  className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase transition-all ${playbackSpeed !== 1 ? 'text-[#e50914] bg-white/5' : 'text-white/40 hover:text-white'}`}
                >
                  {playbackSpeed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-black/95 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[80px]">
                    {[0.5, 1, 1.5, 2].map((speed) => (
                      <button key={speed} onClick={(e) => { e.stopPropagation(); handleSpeedChange(speed); }} className={`w-full px-4 py-2.5 text-center text-[11px] font-bold transition-all hover:bg-white/10 ${playbackSpeed === speed ? 'text-[#e50914]' : 'text-white/50'}`}>
                        {speed}X
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="text-white/40 hover:text-white transition-all uppercase text-[10px] font-black tracking-[0.2em]">
                Fit
              </button>
              
              <button className="text-white/40 hover:text-white transition-all uppercase text-[10px] font-black tracking-[0.2em]">
                Audio
              </button>

              <button className="text-white/40 hover:text-white transition-all p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Unlock Indicator */}
      {isLocked && showControls && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-6 py-3 bg-black/60 backdrop-blur-md rounded-full border border-[#e50914]/30 flex items-center gap-3 animate-pulse shadow-2xl">
            <svg className="w-5 h-5 text-[#e50914]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/></svg>
            <span className="text-white text-[11px] font-black uppercase tracking-[0.25em]">Player Locked</span>
          </div>
        </div>
      )}
    </div>
  );
};
