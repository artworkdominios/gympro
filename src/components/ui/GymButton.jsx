export default function GymButton({
  children,
  className = '',
  variant = 'primary',
  disabled = false,
  ...props
}) {
  const base =
    'w-full inline-flex items-center justify-center gap-2 rounded-[25px] px-4 py-3 font-black uppercase italic tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-brandRed text-white shadow-[0_10px_40px_rgba(255,49,49,0.4)] hover:scale-[1.02]',
    ghost:
      'bg-transparent text-white border border-brandRed/40 hover:bg-brandRed/10',
  };

  const classes = [
    base,
    variants[variant] || variants.primary,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}

