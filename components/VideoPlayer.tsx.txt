
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Lock, Unlock, Volume2, Sun, Play, Pause, RotateCcw, RotateCw, Maximize, Settings, MoreVertical, ChevronLeft } from 'lucide-react';
import { Movie } from '../types.ts';
import { fetchMovieById } from '../services/firebaseService.ts';

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
  const [aspectRatioMode, setAspectRatioMode] = useState<'Fit' | 'Fill' | 'Original' | 'Stretch' | '16:9'>('Fit');
  const [isLocked, setIsLocked] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [gestureInfo, setGestureInfo] = useState<{ type: 'volume' | 'brightness', value: number, visible: boolean }>({ type: 'volume', value: 0, visible: false });
  const [seekGesture, setSeekGesture] = useState<{ side: 'left' | 'right', visible: boolean }>({ side: 'left', visible: false });
  const [accumulatedSeek, setAccumulatedSeek] = useState(0);
  const [isForceLandscape, setIsForceLandscape] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number, y: number, value: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const seekDebounceRef = useRef<number | null>(null);

  const enterFullscreenAndLandscape = useCallback(async () => {
    try {
      if (playerRef.current) {
        const element = playerRef.current;
        const requestMethod = element.requestFullscreen || 
                             (element as any).webkitRequestFullscreen || 
                             (element as any).mozRequestFullScreen || 
                             (element as any).msRequestFullscreen;

        if (requestMethod) {
          await requestMethod.call(element);
        }

        if (window.screen.orientation && (window.screen.orientation as any).lock) {
          try {
            await (window.screen.orientation as any).lock('landscape');
            setIsForceLandscape(false);
          } catch (orientationErr) {
            console.warn("Orientation lock failed, applying CSS fallback:", orientationErr);
            setIsForceLandscape(true);
          }
        } else {
          setIsForceLandscape(true);
        }
      }
    } catch (err) {
      console.error("Fullscreen/Orientation error:", err);
      // Fallback if we are in portrait
      if (window.innerHeight > window.innerWidth) {
        setIsForceLandscape(true);
      }
    }
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

  useEffect(() => {
    const handleOrientationChange = () => {
      // If the screen is naturally in landscape, we don't need the CSS fallback
      if (window.innerWidth > window.innerHeight) {
        setIsForceLandscape(false);
      }
    };
    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  const hideControls = useCallback(() => {
    if (isPlaying) {
      setShowControls(false);
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
    
    if (isLocked) {
      resetControlsTimeout();
      return;
    }

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    const rect = playerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const isRightSide = x > rect.width / 2;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Consecutive tap detected
      const side = isRightSide ? 'right' : 'left';
      
      // Hide controls immediately on double tap
      setShowControls(false);
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
      
      setAccumulatedSeek(prev => prev + (isRightSide ? 10 : -10));
      setSeekGesture({ side, visible: true });

      // Debounce the actual seek to the video
      if (seekDebounceRef.current) window.clearTimeout(seekDebounceRef.current);
      seekDebounceRef.current = window.setTimeout(() => {
        setAccumulatedSeek(total => {
          if (videoRef.current && total !== 0) {
            videoRef.current.currentTime += total;
          }
          return 0;
        });
        setSeekGesture(prev => ({ ...prev, visible: false }));
      }, 800);

      lastTapRef.current = now;
      return;
    }
    lastTapRef.current = now;

    if (showControls) {
      setShowControls(false);
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
      enterFullscreenAndLandscape();
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
    resetControlsTimeout();
  };

  const cyclePlaybackSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) return;
    const speeds = [1, 1.25, 1.5, 2, 0.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    handleSpeedChange(speeds[nextIndex]);
  };

  const cycleAspectRatio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) return;
    const modes: ('Fit' | 'Fill' | 'Original' | 'Stretch' | '16:9')[] = ['Fit', 'Fill', 'Original', 'Stretch', '16:9'];
    const currentIndex = modes.indexOf(aspectRatioMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setAspectRatioMode(modes[nextIndex]);
    resetControlsTimeout();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLocked) return;
    const touch = e.touches[0];
    const { clientX, clientY } = touch;
    const isRightSide = clientX > window.innerWidth / 2;
    
    touchStartRef.current = {
      x: clientX,
      y: clientY,
      value: isRightSide ? volume : brightness
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isLocked || !touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaY = touchStartRef.current.y - touch.clientY;
    const sensitivity = 200; // Pixels for full range
    const change = deltaY / sensitivity;
    
    const isRightSide = touchStartRef.current.x > window.innerWidth / 2;
    const newValue = Math.min(Math.max(touchStartRef.current.value + change, 0), 1);

    if (isRightSide) {
      setVolume(newValue);
      if (videoRef.current) videoRef.current.volume = newValue;
      setGestureInfo({ type: 'volume', value: newValue, visible: true });
    } else {
      setBrightness(newValue);
      setGestureInfo({ type: 'brightness', value: newValue, visible: true });
    }
    resetControlsTimeout();
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    setTimeout(() => setGestureInfo(prev => ({ ...prev, visible: false })), 500);
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

  const getAspectRatioClass = () => {
    switch (aspectRatioMode) {
      case 'Fit': return 'object-contain';
      case 'Fill': return 'object-cover';
      case 'Original': return 'object-none';
      case 'Stretch': return 'object-fill';
      case '16:9': return 'aspect-video object-cover';
      default: return 'object-contain';
    }
  };

  return (
    <div 
      ref={playerRef}
      className={`fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden select-none transition-all duration-500 ${isForceLandscape ? 'rotate-90' : ''}`}
      style={isForceLandscape ? {
        width: '100vh',
        height: '100vw',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%) rotate(90deg)',
      } : {}}
      onMouseMove={resetControlsTimeout}
      onClick={toggleControls}
    >
      <video
        ref={videoRef}
        src={videoSource}
        className={`w-full h-full transition-all duration-300 ${getAspectRatioClass()}`}
        style={{ filter: `brightness(${0.5 + brightness})` }}
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
      <div 
        className={`absolute inset-0 flex flex-col justify-between bg-black/10 transition-opacity ${showControls && !seekGesture.visible ? 'opacity-100 duration-500' : 'opacity-0 duration-0 pointer-events-none'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        
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
              <ChevronLeft size={28} strokeWidth={2.5} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-[15px] font-bold text-white tracking-tight truncate max-w-[60vw] drop-shadow-md uppercase italic">
                {movie.title}
              </h2>
              <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">{movie.quality_name || '1080P FHD'}</span>
            </div>
          </div>
        </div>

        {/* Center Section: Iconic Play/Pause (No background circle) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center justify-center gap-16 pointer-events-auto">
            {!isLocked && (
              <button onClick={(e) => { e.stopPropagation(); seek(-10); }} className="p-4 text-white/60 hover:text-white transition-all transform hover:scale-110 active:scale-90">
                <div className="relative flex flex-col items-center">
                  <RotateCcw size={48} strokeWidth={1.5} />
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
                  {isPlaying ? <Pause size={80} fill="currentColor" /> : <Play size={80} fill="currentColor" className="ml-2" />}
                </button>
              )}
            </div>

            {!isLocked && (
              <button onClick={(e) => { e.stopPropagation(); seek(10); }} className="p-4 text-white/60 hover:text-white transition-all transform hover:scale-110 active:scale-90">
                <div className="relative flex flex-col items-center">
                  <RotateCw size={48} strokeWidth={1.5} />
                  <span className="text-[10px] font-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-0.5">10</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Section - Pushed Lower */}
        <div className={`w-full px-8 pb-4 bg-gradient-to-t from-black via-black/80 to-transparent transition-transform duration-500 ${isLocked ? 'translate-y-full' : 'translate-y-0'}`}>
          
          {/* Progress Bar with Dot Indicator - Moved above row for better alignment */}
          <div className="relative w-full mb-4 group cursor-pointer" onClick={(e) => e.stopPropagation()}>
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

          {/* Time & Icons Row - Combined for tighter layout */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-6">
              <button onClick={togglePlay} className="text-white hover:text-[#e50914] transition-colors p-1">
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
              </button>

              <div className="flex items-center gap-2 tabular-nums text-white/80 text-[11px] font-black tracking-tighter">
                <span className="text-[#e50914]">{formatTime(currentTime)}</span>
                <span className="text-white/20">/</span>
                <span className="opacity-50">{formatTime(duration)}</span>
              </div>

              <div className="flex items-center gap-3 group/volume">
                <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 flex items-center">
                  <input type="range" min="0" max="1" step="0.1" value={volume} onChange={handleVolumeChange} className="w-full accent-[#e50914] h-1 bg-white/10 rounded-full" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative">
                <button 
                  onClick={cyclePlaybackSpeed}
                  className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase transition-all ${playbackSpeed !== 1 ? 'text-[#e50914] bg-white/5' : 'text-white/40 hover:text-white'}`}
                >
                  {playbackSpeed}x
                </button>
              </div>

              <button 
                onClick={cycleAspectRatio}
                className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase transition-all ${aspectRatioMode !== 'Fit' ? 'text-[#e50914] bg-white/5' : 'text-white/40 hover:text-white'}`}
              >
                {aspectRatioMode}
              </button>
              
              <button className="text-white/40 hover:text-white transition-all uppercase text-[10px] font-black tracking-[0.2em]">
                Audio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Lock/Unlock Button - Fixed for accessibility when locked */}
      <div className={`absolute left-8 top-1/2 -translate-y-1/2 transition-opacity ${showControls && !seekGesture.visible ? 'opacity-100 duration-300' : 'opacity-0 duration-0 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsLocked(!isLocked); resetControlsTimeout(); }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isLocked ? 'bg-[#e50914] shadow-2xl text-white scale-110' : 'bg-transparent text-white/60 hover:text-white'}`}
        >
          {isLocked ? <Lock size={24} /> : <Unlock size={24} />}
        </button>
      </div>

      {/* Gesture Indicator (MX Player Style) */}
      <div className={`absolute top-12 left-1/2 -translate-x-1/2 transition-all duration-300 ${gestureInfo.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-black/80 backdrop-blur-2xl px-8 py-4 rounded-3xl border border-white/10 flex items-center gap-5 min-w-[220px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="text-[#e50914] drop-shadow-[0_0_8px_rgba(229,9,20,0.5)]">
            {gestureInfo.type === 'volume' ? <Volume2 size={28} strokeWidth={2.5} /> : <Sun size={28} strokeWidth={2.5} />}
          </div>
          <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-white transition-all duration-100 shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
              style={{ width: `${gestureInfo.value * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Double Tap Seek Animation (YouTube Style) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex">
        <style>{`
          @keyframes seekRipple {
            0% { transform: scale(0.5); opacity: 0; }
            50% { opacity: 0.3; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          .animate-seek-ripple {
            animation: seekRipple 0.8s ease-out forwards;
          }
        `}</style>
        
        {/* Left Side - Shifted to edge */}
        <div className="flex-1 flex items-center justify-start pl-16 sm:pl-24">
          {seekGesture.visible && seekGesture.side === 'left' && (
            <div className="relative flex flex-col items-center">
              <div className="absolute w-40 h-40 bg-white/10 rounded-full animate-seek-ripple" />
              <RotateCcw size={60} className="text-white mb-2 drop-shadow-lg" />
              <span className="text-white font-black text-3xl drop-shadow-lg">{accumulatedSeek}s</span>
            </div>
          )}
        </div>

        {/* Right Side - Shifted to edge */}
        <div className="flex-1 flex items-center justify-end pr-16 sm:pr-24">
          {seekGesture.visible && seekGesture.side === 'right' && (
            <div className="relative flex flex-col items-center">
              <div className="absolute w-40 h-40 bg-white/20 rounded-full animate-seek-ripple" />
              <RotateCw size={60} className="text-white mb-2 drop-shadow-lg" />
              <span className="text-white font-black text-3xl drop-shadow-lg">+{accumulatedSeek}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Unlock Indicator - Pulse effect when locked */}
      {isLocked && showControls && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-6 py-3 bg-black/60 backdrop-blur-md rounded-full border border-[#e50914]/30 flex items-center gap-3 animate-pulse shadow-2xl">
            <Lock size={20} className="text-[#e50914]" />
            <span className="text-white text-[11px] font-black uppercase tracking-[0.25em]">Player Locked</span>
          </div>
        </div>
      )}
    </div>
  );
};
