
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Movie } from '../types.ts';
import { fetchMovieById } from '../services/firebaseService.ts';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  X, 
  Lock, 
  Unlock, 
  Cast, 
  Gauge, 
  Layers, 
  MessageSquare, 
  SkipForward,
  Sun
} from 'lucide-react';

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
  const [volume, setVolume] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [isLocked, setIsLocked] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchMovieById(movieId);
      setMovie(data);
      setLoading(false);
    };
    loadData();
  }, [movieId]);

  const hideControls = useCallback(() => {
    if (isPlaying && !isLocked) {
      setShowControls(false);
    }
  }, [isPlaying, isLocked]);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    if (!isLocked) {
      controlsTimeoutRef.current = window.setTimeout(hideControls, 3000);
    }
  }, [hideControls, isLocked]);

  const togglePlay = useCallback(() => {
    if (isLocked || !videoRef.current) return;
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

  const formatTime = (time: number) => {
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    return h > 0 
      ? `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
      : `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked || !videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
    resetControlsTimeout();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!movie) return null;

  const videoSource = movie.video_url || "https://pub-34413a7eec4f40c883aa01fe9d524f5c.r2.dev/9c5758d1afb2d25ed91d694de729ecb6?token=1771449291";

  return (
    <div 
      ref={playerRef}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden select-none"
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
    >
      {/* Brightness Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-[5] transition-opacity duration-300"
        style={{ backgroundColor: 'black', opacity: 1 - brightness }}
      />

      <video
        ref={videoRef}
        src={videoSource}
        className="w-full h-full object-contain"
        playsInline
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onClick={(e) => { e.stopPropagation(); if (!isLocked) togglePlay(); }}
      />

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none z-10">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* UI Overlay */}
      <div className={`absolute inset-0 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Top Bar */}
        {!isLocked && (
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <button className="text-white hover:scale-110 transition-transform">
              <Cast size={28} strokeWidth={1.5} />
            </button>
            
            <div className="text-center">
              <h2 className="text-white text-lg font-medium tracking-wide drop-shadow-lg">
                {movie.title}
              </h2>
              <p className="text-white/60 text-xs uppercase tracking-[0.2em] mt-1">
                {movie.year} • {movie.quality_name}
              </p>
            </div>

            <button onClick={onClose} className="text-white hover:scale-110 transition-transform p-1">
              <X size={32} strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* Center Controls */}
        {!isLocked && (
          <div className="absolute inset-0 flex items-center justify-center gap-12 md:gap-24">
            <button onClick={() => seek(-10)} className="text-white hover:scale-110 transition-transform relative">
              <RotateCcw size={52} strokeWidth={1.2} />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold mt-1">10</span>
            </button>

            <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform bg-white/5 rounded-full p-6 backdrop-blur-md border border-white/10">
              {isPlaying ? <Pause size={64} fill="white" strokeWidth={0} /> : <Play size={64} fill="white" strokeWidth={0} className="ml-1" />}
            </button>

            <button onClick={() => seek(10)} className="text-white hover:scale-110 transition-transform relative">
              <RotateCw size={52} strokeWidth={1.2} />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold mt-1">10</span>
            </button>
          </div>
        )}

        {/* Brightness Slider (Left Side) */}
        {!isLocked && (
          <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 group">
            <Sun size={20} className="text-white/80" />
            <div className="relative h-48 w-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="absolute bottom-0 left-0 right-0 bg-white transition-all duration-100"
                style={{ height: `${brightness * 100}%` }}
              />
              <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={brightness}
                onChange={(e) => setBrightness(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer -rotate-180 [writing-mode:vertical-lr]"
                style={{ direction: 'rtl' }}
              />
            </div>
          </div>
        )}

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
          
          {/* Progress Bar */}
          {!isLocked && (
            <div className="flex flex-col gap-2 mb-6">
              <div className="flex items-center gap-4">
                <div 
                  className="relative flex-1 h-1 bg-white/20 rounded-full cursor-pointer group/progress"
                  onClick={handleProgressClick}
                >
                  <div 
                    className="absolute inset-y-0 left-0 bg-red-600 rounded-full"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  {/* Scrubber Dot */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-red-600 rounded-full shadow-lg transition-transform group-hover/progress:scale-125"
                    style={{ left: `calc(${(currentTime / duration) * 100}% - 10px)` }}
                  />
                </div>
                <span className="text-white text-sm font-medium tabular-nums">
                  {formatTime(duration - currentTime)}
                </span>
              </div>
            </div>
          )}

          {/* Bottom Icons Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8 md:gap-12">
              {!isLocked && (
                <button 
                  onClick={() => {
                    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
                    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
                    setPlaybackSpeed(nextSpeed);
                    if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
                  }}
                  className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
                >
                  <Gauge size={24} strokeWidth={1.5} />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Geschwindigkeit ({playbackSpeed}x)</span>
                </button>
              )}

              <button 
                onClick={() => {
                  setIsLocked(!isLocked);
                  if (!isLocked) setShowControls(true);
                }}
                className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
              >
                {isLocked ? <Lock size={24} strokeWidth={1.5} /> : <Unlock size={24} strokeWidth={1.5} />}
                <span className="text-[10px] font-medium uppercase tracking-wider">
                  {isLocked ? 'Entsperren' : 'Sperre'}
                </span>
              </button>

              {!isLocked && (
                <>
                  <button className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors">
                    <Layers size={24} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium uppercase tracking-wider">Folgen</span>
                  </button>

                  <button className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors">
                    <MessageSquare size={24} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium uppercase tracking-wider">Audio und Untertitel</span>
                  </button>
                </>
              )}
            </div>

            {!isLocked && (
              <button className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors">
                <SkipForward size={24} strokeWidth={1.5} />
                <span className="text-[10px] font-medium uppercase tracking-wider">Nächste Folge</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Locked State Minimal UI */}
      {isLocked && !showControls && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md p-4 rounded-full animate-pulse">
            <Lock size={32} className="text-white/40" />
          </div>
        </div>
      )}
    </div>
  );
};
