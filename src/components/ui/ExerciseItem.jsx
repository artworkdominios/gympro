import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Timer, Weight, ChevronDown, Lightbulb } from 'lucide-react';
import GymCard from './GymCard.jsx';

export default function ExerciseItem({ ejercicio, isDone, isOpen, onToggle, onExpand }) {
  const { nombre, grupo, s, r, d, p, videoUrl, observaciones } = ejercicio;

  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Detección y formateo de URL para YouTube
  const isYoutube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');

  const getEmbedUrl = (url) => {
    if (!url || !isYoutube) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) 
      ? `https://www.youtube.com/embed/${match[2]}?modestbranding=1&rel=0&iv_load_policy=3` 
      : url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const startTimer = (e) => {
    e.stopPropagation();
    const segundos = parseInt(d) || 60;
    setTimeLeft(segundos);
    setIsRunning(true);
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
            <h3 className={`text-lg font-black italic uppercase ${isDone ? 'text-gray-600 line-through' : 'text-white'}`}>
              {nombre}
            </h3>
            <p className="text-brandRed text-[8px] font-black uppercase tracking-widest">{grupo}</p>
          </div>
        </div>
        <ChevronDown size={18} className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180 text-brandRed' : ''}`} />
      </div>

      {isOpen && (
        <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">

          {/* SECCIÓN MULTIMEDIA (SOLO INTERNA) */}
          {videoUrl && (
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black shadow-[0_0_30px_rgba(255,49,49,0.15)]">
              {isYoutube ? (
                <iframe
                  src={embedUrl}
                  title="Técnica de ejercicio"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <img 
                  src={videoUrl} 
                  className="absolute inset-0 w-full h-full object-cover" 
                  alt="Técnica" 
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
            </div>
          )}

          {/* TIPS / OBSERVACIONES */}
          {observaciones && (
            <div className="bg-brandRed/5 border-l-2 border-brandRed p-3 rounded-r-xl flex gap-3 items-start">
              <Lightbulb size={14} className="text-brandRed mt-0.5 shrink-0" />
              <p className="text-gray-300 text-[10px] font-medium leading-relaxed italic">
                {observaciones}
              </p>
            </div>
          )}

          {/* PANEL DE CONTROL: SERIES, REPS, PESO Y TIMER */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'SER', val: s },
              { label: 'REP', val: r },
              { label: 'PES', val: p || '-' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 p-2 rounded-2xl text-center border border-white/5 flex flex-col justify-center min-h-[50px]">
                <p className="text-gray-600 text-[7px] font-black mb-0.5">{stat.label}</p>
                <p className="text-white font-black text-[10px]">{stat.val}</p>
              </div>
            ))}

            <div
              onClick={startTimer}
              className={`p-2 rounded-2xl text-center border transition-all flex flex-col justify-center min-h-[50px] ${
                isRunning ? 'bg-brandRed border-brandRed shadow-[0_0_15px_rgba(255,49,49,0.4)]' : 'bg-white/5 border-white/5'
              }`}
            >
              <p className={`${isRunning ? 'text-black' : 'text-gray-600'} text-[7px] font-black mb-0.5 uppercase`}>
                {isRunning ? 'Rest' : 'Timer'}
              </p>
              <p className={`${isRunning ? 'text-black' : 'text-white'} font-black text-[10px]`}>
                {isRunning ? `${timeLeft}s` : `${d || '60"'}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </GymCard>
  );
}