
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, RotateCw, X, Lock, Unlock, 
  Cast, SkipForward, Sun, Maximize, 
  Minimize, Volume2, VolumeX, Settings, List, Subtitles
} from 'lucide-react';
import { Movie } from '../types';

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ movie, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [activeToast, setActiveToast] = useState<{ icon: React.ReactNode; text: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hrs > 0 
      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const showToast = useCallback((icon: React.ReactNode, text: string) => {
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    setActiveToast({ icon, text });
    toastTimeoutRef.current = window.setTimeout(() => setActiveToast(null), 1500);
  }, []);

  const resetControlsTimeout = useCallback(() => {
    if (isLocked) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying, isLocked]);

  const togglePlay = useCallback(async () => {
    if (isLocked || !videoRef.current) return;
    try {
      if (videoRef.current.paused) {
        await videoRef.current.play();
        setIsPlaying(true);
        showToast(<Play fill="white" size={24} />, "Play");
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        showToast(<Pause fill="white" size={24} />, "Pause");
      }
    } catch (err) {
      console.error("Playback error:", err);
    }
    resetControlsTimeout();
  }, [isLocked, resetControlsTimeout, showToast]);

  const seek = useCallback((amount: number) => {
    if (isLocked || !videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + amount, duration));
    showToast(amount > 0 ? <RotateCw size={24} /> : <RotateCcw size={24} />, `${Math.abs(amount)}s`);
    resetControlsTimeout();
  }, [isLocked, duration, resetControlsTimeout, showToast]);

  const toggleFullscreen = useCallback(() => {
    if (!playerRef.current) return;
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked && e.key.toLowerCase() !== 'l') return;
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k': e.preventDefault(); togglePlay(); break;
        case 'f': toggleFullscreen(); break;
        case 'l': setIsLocked(!isLocked); break;
        case 'arrowright': seek(10); break;
        case 'arrowleft': seek(-10); break;
        case 'escape': if (!document.fullscreenElement) onClose(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, togglePlay, toggleFullscreen, seek, onClose]);

  return (
    <div 
      ref={playerRef}
      className="fixed inset-0 z-[10000] bg-black flex items-center justify-center overflow-hidden"
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
    >
      <div 
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
        style={{ backgroundColor: 'black', opacity: 1 - brightness }}
      />

      <video
        ref={videoRef}
        src={movie.videoUrl}
        className="w-full h-full object-contain"
        playsInline
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
      />

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-white/20 border-t-[#E50914] rounded-full animate-spin shadow-2xl"></div>
        </div>
      )}

      {/* Toast Feedback */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 z-[60] ${activeToast ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
        <div className="bg-black/80 backdrop-blur-xl px-8 py-6 rounded-full border border-white/10 flex flex-col items-center gap-2 shadow-2xl">
          <div className="text-white">{activeToast?.icon}</div>
          <span className="text-white text-xs font-black uppercase tracking-widest">{activeToast?.text}</span>
        </div>
      </div>

      {/* Controls Layer */}
      <div className={`absolute inset-0 flex flex-col transition-opacity duration-500 z-50 ${showControls || isLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Top Header */}
        {!isLocked && (
          <div className="w-full p-8 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent">
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white transition-all transform hover:scale-110">
              <X size={36} strokeWidth={1.5} />
            </button>
            <div className="flex flex-col items-center">
              <h2 className="text-white text-xl font-bold tracking-tight">{movie.title}</h2>
              <span className="text-[#E50914] text-[10px] font-black uppercase tracking-[0.3em] mt-1">{movie.quality}</span>
            </div>
            <div className="flex items-center gap-6">
              <Cast size={24} className="text-white/70 hover:text-white cursor-pointer" />
              <Settings size={24} className="text-white/70 hover:text-white cursor-pointer" />
            </div>
          </div>
        )}

        {/* Center Section */}
        <div className="flex-1 flex items-center justify-center gap-12 md:gap-32">
          {!isLocked ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); seek(-10); }} className="text-white/60 hover:text-white transition-all transform active:scale-90">
                <RotateCcw size={56} strokeWidth={1} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-28 h-28 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full border border-white/20 transition-all transform hover:scale-110 active:scale-95 shadow-2xl">
                {isPlaying ? <Pause size={48} fill="white" strokeWidth={0} /> : <Play size={48} fill="white" className="ml-2" strokeWidth={0} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); seek(10); }} className="text-white/60 hover:text-white transition-all transform active:scale-90">
                <RotateCw size={56} strokeWidth={1} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 bg-white/5 border-2 border-white/20 rounded-full flex items-center justify-center animate-pulse">
                <Lock size={40} className="text-white/40" />
              </div>
              <p className="text-white/30 text-xs font-black uppercase tracking-[0.4em]">Screen Locked</p>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className={`w-full px-12 pb-12 bg-gradient-to-t from-black/95 via-black/50 to-transparent transition-transform duration-500 ${isLocked ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
          
          <div className="mb-8">
            <div className="flex items-center justify-between text-white/60 text-[10px] font-black uppercase mb-3 tracking-widest">
              <div>{formatTime(currentTime)} / {formatTime(duration)}</div>
              <div className="text-red-600">Premium HD Experience</div>
            </div>
            <div 
              className="relative h-1.5 w-full bg-white/20 rounded-full cursor-pointer group"
              onClick={(e) => {
                if (!duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                if (videoRef.current) videoRef.current.currentTime = pos * duration;
              }}
            >
              <div 
                className="absolute inset-y-0 left-0 bg-[#E50914] rounded-full transition-all duration-75"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-[#E50914] rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button onClick={() => setIsLocked(!isLocked)} className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors">
                {isLocked ? <Lock size={22} className="text-red-600" /> : <Unlock size={22} />}
                <span className="text-[9px] font-black uppercase">Lock</span>
              </button>
              <div className="flex flex-col items-center gap-1 group relative">
                {isMuted ? <VolumeX size={22} className="text-red-600" /> : <Volume2 size={22} className="text-white/50 hover:text-white" />}
                <span className="text-[9px] font-black uppercase">Audio</span>
                <div className="absolute bottom-full mb-6 p-4 bg-neutral-900 border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <input 
                    type="range" min="0" max="1" step="0.01" value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-24 -rotate-90 origin-center bg-white/10"
                  />
                </div>
              </div>
              <button className="flex flex-col items-center gap-1 text-white/50 hover:text-white">
                <List size={22} />
                <span className="text-[9px] font-black uppercase">List</span>
              </button>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                {[1, 1.25, 1.5].map(rate => (
                  <button 
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      if (videoRef.current) videoRef.current.playbackRate = rate;
                    }}
                    className={`text-[10px] font-black px-2 py-1 rounded border transition-all ${playbackRate === rate ? 'bg-white text-black border-white' : 'border-white/20 text-white/40'}`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
              <button onClick={toggleFullscreen} className="text-white/50 hover:text-white">
                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
              <button className="bg-white text-black px-6 py-3 rounded-md font-black uppercase text-xs hover:bg-neutral-200 transition-all active:scale-95 flex items-center gap-2">
                <SkipForward size={18} fill="black" /> Next
              </button>
            </div>
          </div>
        </div>

        {/* Left Side Brightness Control */}
        {!isLocked && (
          <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
            <Sun size={18} className="text-white/30" />
            <div className="h-48 w-1 bg-white/10 rounded-full relative overflow-hidden flex flex-col justify-end">
              <div className="w-full bg-white transition-all" style={{ height: `${brightness * 100}%` }} />
              <input 
                type="range" min="0" max="1" step="0.01" value={brightness}
                onChange={(e) => setBrightness(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ appearance: 'slider-vertical' } as any}
              />
            </div>
          </div>
        )}
      </div>

      {isLocked && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <button 
            onClick={() => setIsLocked(false)}
            className="group relative p-12 bg-white/5 border-2 border-white/20 rounded-full text-white hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
          >
            <Lock size={48} className="group-hover:opacity-0 absolute inset-0 m-auto transition-opacity" />
            <Unlock size={48} className="opacity-0 group-hover:opacity-100 absolute inset-0 m-auto transition-opacity" />
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap text-white text-[10px] font-black uppercase tracking-[0.3em]">Tap to Unlock</div>
          </button>
        </div>
      )}
    </div>
  );
};
