interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

const sizes = {
  sm: { icon: 20, text: "text-lg" },
  md: { icon: 24, text: "text-xl" },
  lg: { icon: 32, text: "text-2xl" },
  xl: { icon: 48, text: "text-5xl sm:text-6xl" },
} as const;

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const { icon, text } = sizes[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="riff-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="50%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#fdba74" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="22" stroke="url(#riff-grad)" strokeWidth="3" fill="none" />
        <path
          d="M18 34V16l14-2v14"
          stroke="url(#riff-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="15" cy="34" r="3.5" fill="url(#riff-grad)" />
        <circle cx="29" cy="28" r="3.5" fill="url(#riff-grad)" />
        <path
          d="M32 12c2.5 0 4.5 1 5.5 3"
          stroke="url(#riff-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M32 8c4 0 7 1.8 8.5 4.5"
          stroke="url(#riff-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>
      {showText && (
        <span
          className={`bg-gradient-to-r from-red-400 via-rose-400 to-orange-300 bg-clip-text font-bold text-transparent ${text}`}
        >
          RiffSync
        </span>
      )}
    </span>
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="riff-ico-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="50%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#fdba74" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" stroke="url(#riff-ico-grad)" strokeWidth="3" fill="none" />
      <path
        d="M18 34V16l14-2v14"
        stroke="url(#riff-ico-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="15" cy="34" r="3.5" fill="url(#riff-ico-grad)" />
      <circle cx="29" cy="28" r="3.5" fill="url(#riff-ico-grad)" />
      <path
        d="M32 12c2.5 0 4.5 1 5.5 3"
        stroke="url(#riff-ico-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M32 8c4 0 7 1.8 8.5 4.5"
        stroke="url(#riff-ico-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}
