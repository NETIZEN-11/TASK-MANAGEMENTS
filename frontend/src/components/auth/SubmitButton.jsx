export default function SubmitButton({
  submitting,
  loadingText,
  idleText,
  gradient = 'from-amber-300 via-pink-400 to-fuchsia-500',
  textColor = 'text-fuchsia-950',
  shadow = 'shadow-fuchsia-500/30',
  hoverShadow = 'hover:shadow-[0_10px_30px_rgba(217,70,239,0.45)]',
  icon,
}) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className={`group relative w-full overflow-hidden rounded-xl bg-gradient-to-r ${gradient} py-3.5 text-base font-extrabold tracking-wide ${textColor} shadow-lg ${shadow} ${hoverShadow} transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none`}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/40 to-white/0 transition-transform duration-700 group-hover:translate-x-full" />
      {submitting ? (
        <span className="relative flex items-center justify-center gap-2.5">
          <svg
            className="h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12z" />
          </svg>
          {loadingText}
        </span>
      ) : (
        <span className="relative flex items-center justify-center gap-2">
          {icon && <span className="transition-transform group-hover:scale-110">{icon}</span>}
          <span>{idleText}</span>
          <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
        </span>
      )}
    </button>
  );
}