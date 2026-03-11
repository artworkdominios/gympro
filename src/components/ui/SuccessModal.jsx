import { PartyPopper, X } from 'lucide-react';
import GymButton from './GymButton.jsx';
import GymCard from './GymCard.jsx';

export default function SuccessModal({
  open,
  onClose,
  title = 'Entrenamiento finalizado',
  subtitle = '¡Gran trabajo! Continua mañana.',
  confirmLabel = 'Entendido',
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      <GymCard className="relative border-2 border-brandRed/40 rounded-[40px] p-10 w-full max-w-sm text-center shadow-[0_0_60px_rgba(255,49,49,0.2)]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-700 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex justify-center mb-6">
          <div className="bg-brandRed/10 p-4 rounded-full border border-brandRed/30">
            <PartyPopper className="text-brandRed drop-shadow-[0_0_8px_rgba(255,49,49,0.5)]" size={32} />
          </div>
        </div>

        <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-tight mb-2">
          {title}
        </h2>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">
          {subtitle}
        </p>

        <div className="mt-10">
          <GymButton variant="ghost" onClick={onClose}>
            {confirmLabel}
          </GymButton>
        </div>
      </GymCard>
    </div>
  );
}

