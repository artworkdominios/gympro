import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronDown, Lightbulb, RotateCcw } from 'lucide-react';
import GymCard from './GymCard.jsx';

export default function ExerciseItem({ ejercicio, isDone, isOpen, onToggle, onExpand, showRestTimer }) {
  const { nombre, grupo, s, r, d, p, videoUrl, observaciones } = ejercicio;

  const [timeLeft, setTimeLeft] = useState(parseInt(d) || 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const isYoutube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');

  const getEmbedUrl = (url) => {
    if (!url || !isYoutube) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    // Agregamos playsinline=1 para YouTube
    return (match && match[2].length === 11) 
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1` 
      : url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      setIsFinished(false); 
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setIsFinished(true);
      if (window.navigator.vibrate) window.navigator.vibrate(200);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(parseInt(d) || 60);
      setIsFinished(false);
    }
  }, [d, isOpen]);

  const handleTimerClick = (e) => {
    e.stopPropagation();
    if (!showRestTimer) return;
    if (isFinished || timeLeft === 0) {
      setIsFinished(false);
      setTimeLeft(parseInt(d) || 60);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = (e) => {
    e.stopPropagation();
    setIsRunning(false);
    setIsFinished(false);
    setTimeLeft(parseInt(d) || 60);
  };

  return (
    <GymCard
      isActive={isOpen}
      className={`group transition-all duration-300 cursor-pointer ${isDone ? 'opacity-60' : ''}`}
      onClick={onExpand}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`p-1.5 rounded-full transition-all ${isDone ? 'bg-[#31FF31]' : 'bg-white/5 border border-white/10'}`}
          >
            {isDone ? <CheckCircle2 size={16} className="text-black" /> : <Circle size={16} className="text-gray-800" />}
          </button>
          <div>
            <h3 className={`text-lg font-black italic uppercase leading-tight ${isDone ? 'text-gray-600 line-through' : 'text-white'}`}>
              {nombre}
            </h3>
            <p className="text-[#FF3131] text-[12px] font-black uppercase tracking-widest mt-1">{grupo}</p>
          </div>
        </div>
        <ChevronDown size={18} className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180 text-[#FF3131]' : ''}`} />
      </div>

      {isOpen && (
        <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {videoUrl && (
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black shadow-[0_0_30px_rgba(255,49,49,0.15)]">
              {isYoutube ? (
                <iframe
                  src={embedUrl}
                  title="Técnica"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <video 
                  src={videoUrl} 
                  autoPlay 
                  muted 
                  loop 
                  playsInline           /* EVITA FULLSCREEN EN IOS */
                  webkit-playsinline="true" 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
              )}
            </div>
          )}

          {observaciones && (
            <div className="bg-[#FF3131]/5 border-l-2 border-[#FF3131] p-3 rounded-r-xl flex gap-3 items-start">
              <Lightbulb size={14} className="text-[#FF3131] mt-0.5 shrink-0" />
              <p className="text-gray-300 text-[10px] font-medium leading-relaxed italic">{observaciones}</p>
            </div>
          )}

          <div className={` grid gap-2 ${showRestTimer ? 'grid-cols-3' : 'grid-cols-3'}`}>
            {[
              { label: 'SER', val: s },
              { label: 'REP', val: r },
              /* { label: 'PES', val: p || '-' } */
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 p-2 rounded-2xl text-center border border-white/5 flex flex-col justify-center min-h-[50px]">
                <p className="text-gray-600 text-[16px] font-black mb-0.5 uppercase">{stat.label}</p>
                <p className="text-white font-black text-[20px]">{stat.val}</p>
              </div>
            ))}

            {showRestTimer && (
              <div
                onClick={handleTimerClick}
                className={`p-2 text-xl rounded-2xl text-center border transition-all duration-500 flex flex-col justify-center min-h-[50px] relative group/timer ${
                  isFinished ? 'bg-[#31FF31] border-[#31FF31] shadow-[0_0_20px_rgba(49,255,49,0.4)]' 
                  : isRunning ? 'bg-[#FF3131] border-[#FF3131] shadow-[0_0_15px_rgba(255,49,49,0.4)]' 
                  : 'bg-white/5 border-white/5'
                }`}
              >
                <p className={`${(isRunning || isFinished) ? 'text-black' : 'text-gray-600'} text-[16px] font-black mb-0.5 uppercase`}>
                  {isFinished ? '¡LISTO!' : isRunning ? 'REST' : 'TIMER'}
                </p>
                <p className={`${(isRunning || isFinished) ? 'text-black' : 'text-white'} font-black text-[16px] leading-tight`}>
                  {isFinished ? 'CONTINUÁ' : `${timeLeft}s`}
                </p>
                <button onClick={handleReset} className="absolute -top-1 -right-1 bg-white text-black rounded-full p-1 opacity-0 group-hover/timer:opacity-100 transition-opacity">
                  <RotateCcw size={8} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </GymCard>
  );
}