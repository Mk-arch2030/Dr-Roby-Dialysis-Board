interface IconProps {
  className?: string;
}

const base = 'shrink-0';

export function IconBed({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`}>
      <path d="M3 18V7m0 8h18m0 0v3M21 15v-3a2 2 0 0 0-2-2H9v5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6.5" cy="10.5" r="1.6" />
    </svg>
  );
}

export function IconDroplet({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`}>
      <path d="M12 3s5.5 5.6 5.5 9.6A5.5 5.5 0 0 1 12 18a5.5 5.5 0 0 1-5.5-5.4C6.5 8.6 12 3 12 3Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconHeart({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`}>
      <path
        d="M20.3 6.6a4.6 4.6 0 0 0-6.6-.4L12 7.8l-1.7-1.6a4.6 4.6 0 1 0-6.3 6.7l7.2 7 7.2-7a4.6 4.6 0 0 0 1.9-7.3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconClock({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconActivity({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className}`}>
      <path d="M3 12h4l2.2-6 3.4 12L15.4 12H21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPlus({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${base} ${className}`}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className={`${base} ${className}`}>
      <path d="m4.5 12.5 4.5 4.5L19.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconDownload({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className}`}>
      <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 18.5h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSearch({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className}`}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  );
}

export function IconMoon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSun({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${base} ${className}`}>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

export function IconUser({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`}>
      <circle cx="12" cy="8.5" r="3.7" />
      <path d="M5 20c.9-3.6 3.6-5.4 7-5.4s6.1 1.8 7 5.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconLock({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className}`}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" />
      <path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" strokeLinecap="round" />
      <path d="M12 14.4v2" strokeLinecap="round" />
    </svg>
  );
}

export function IconLogout({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className}`}>
      <path d="M14 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 8.5 20.5 12 17 15.5M10.5 12h10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconRefresh({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className}`}>
      <path d="M20 11a8 8 0 1 0-2.4 5.7M20 5v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
