export default function GymCard({ children, className = '', onClick, isActive = false }) {
  const classes = [
    'bg-[#0a0a0a] border rounded-[36px] p-6 transition-all duration-500',
    // Si isActive es true, forzamos el borde rojo neón, si no, el gris de siempre
    isActive ? 'border-[#FF3131] shadow-[0_0_20px_rgba(255,49,49,0.2)]' : 'border-white/5',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}
