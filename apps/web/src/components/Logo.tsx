type Props = { className?: string; withWordmark?: boolean; size?: number };

export function Logo({ className, withWordmark = true, size = 34 }: Props) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <img
        src="/logo.png"
        alt="Anact Ortho"
        width={size}
        height={size}
        className="shrink-0 rounded-xl shadow-glow ring-1 ring-white/10"
        style={{ width: size, height: size }}
      />
      {withWordmark ? (
        <div className="leading-none">
          <div className="font-display text-[15px] font-semibold tracking-tight">
            Anact <span className="text-court-accent">Ortho</span>
          </div>
          <div className="text-[9.5px] uppercase tracking-[0.22em] text-white/40">
            Bright premium · first place
          </div>
        </div>
      ) : null}
    </div>
  );
}
