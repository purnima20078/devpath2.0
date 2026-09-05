import React from 'react';

export const LogoVector: React.FC<{ name: string; className?: string }> = ({ name, className = 'w-24 h-24' }) => {
  switch (name) {
    case 'github':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      );
    case 'spotify':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle cx="12" cy="12" r="11" fill="#1DB954" />
          <path d="M17.5 16.2c-.2.3-.6.4-.9.2-2.5-1.5-5.6-1.9-9.3-1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4-.9 7.5-.5 10.4 1.2.3.2.3.6.2.8zm1.2-2.8c-.3.4-.8.5-1.2.3-2.9-1.8-7.3-2.3-10.7-1.2-.4.1-.9-.1-1-.6-.1-.4.1-.9.6-1 3.9-1.2 8.7-.6 12 1.4.4.1.5.7.3 1.1zm.1-2.9C15.2 8.3 9.4 8.1 6.1 9.1c-.5.2-1.1-.1-1.2-.6-.2-.5.1-1.1.6-1.2 3.9-1.2 10.3-.9 14.3 1.4.5.3.6.9.3 1.4-.2.4-.8.6-1.3.4z" fill="#FFFFFF" />
        </svg>
      );
    case 'linux':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path d="M32 4c-8 0-14 7-14 16 0 4 1 7 3 10-4 3-8 9-8 16 0 7 6 12 14 12h10c8 0 14-5 14-12 0-7-4-13-8-16 2-3 3-6 3-10 0-9-6-16-14-16z" fill="#2D3748" />
          <ellipse cx="32" cy="38" rx="10" ry="14" fill="#FFFFFF" />
          <circle cx="28" cy="16" r="3" fill="#FFFFFF" />
          <circle cx="28" cy="16" r="1.5" fill="#000000" />
          <circle cx="36" cy="16" r="3" fill="#FFFFFF" />
          <circle cx="36" cy="16" r="1.5" fill="#000000" />
          <path d="M26 22c2-2 10-2 12 0-1 3-5 5-6 5s-5-2-6-5z" fill="#FFA000" />
          <ellipse cx="20" cy="56" rx="8" ry="4" fill="#FFA000" />
          <ellipse cx="44" cy="56" rx="8" ry="4" fill="#FFA000" />
        </svg>
      );
    case 'python':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path d="M31.8 4C19.7 4 20.4 9.2 20.4 9.2l.01 5.4h11.7v1.7H15.9S6 15.2 6 27.5c0 12.3 8.7 11.9 8.7 11.9h5.2v-7.3c0-8.3 7.2-7.8 7.2-7.8h11.6s6.9.1 6.9-6.7c0-6.8-6.1-6.8-6.1-6.8H34.4s.2-6.8-2.6-6.8zm-6.1 4.2c1.2 0 2.2 1 2.2 2.2s-1 2.2-2.2 2.2-2.2-1-2.2-2.2 1-2.2 2.2-2.2z" fill="#3776AB" />
          <path d="M32.2 60c12.1 0 11.4-5.2 11.4-5.2l-.01-5.4H31.9v-1.7h16.2s9.9 1.1 9.9-11.2c0-12.3-8.7-11.9-8.7-11.9h-5.2v7.3c0 8.3-7.2 7.8-7.2 7.8H25.3s-6.9-.1-6.9 6.7c0 6.8 6.1 6.8 6.1 6.8h5.1s-.2 6.8 2.6 6.8zm6.1-4.2c-1.2 0-2.2-1-2.2-2.2s1-2.2 2.2-2.2 2.2 1 2.2 2.2-1 2.2-2.2 2.2z" fill="#FFD43B" />
        </svg>
      );
    case 'chrome':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <circle cx="32" cy="32" r="28" fill="#ECEFF1" />
          <path d="M32 18h25.8C52.6 9.8 43 4 32 4c-9.2 0-17.4 4.1-23 10.6l12.9 22.3L32 18z" fill="#EA4335" />
          <path d="M60 32c0 9.8-5 18.5-12.6 23.6L34.5 33.3 21.9 36.9 9 14.6C15.2 8.1 23.2 4 32 4c15.5 0 28 12.5 28 28z" fill="#FBBC04" opacity="0" />
          <path d="M32 46l12.9-22.3H19.1L6.2 46.6C12.4 54.7 21.6 60 32 60c7.8 0 15-3 20.4-8L32 46z" fill="#34A853" />
          <path d="M60 32c0 14-10.2 25.6-23.7 27.7l-13.4-23 9.1-15.7h25.8C59.2 24.3 60 28.1 60 32z" fill="#FBBC04" />
          <circle cx="32" cy="32" r="14" fill="#FFFFFF" />
          <circle cx="32" cy="32" r="11" fill="#4285F4" />
        </svg>
      );
    case 'discord':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#5865F2" />
          <path d="M44.5 19.5c-3-1.4-6.2-2.4-9.6-2.9-.4.7-.9 1.8-1.2 2.6-3.6-.5-7.2-.5-10.7 0-.3-.8-.8-1.9-1.2-2.6-3.4.5-6.6 1.5-9.6 2.9-6.1 9.1-7.8 17.9-7 26.6 4 3 8 4.8 11.8 6 .9-1.3 1.8-2.6 2.5-4.1-1.4-.5-2.7-1.2-4-2 .3-.2.7-.5 1-.7 7.7 3.5 16.1 3.5 23.7 0 .3.2.7.5 1 .7-1.2.8-2.6 1.5-4 2 .7 1.4 1.6 2.8 2.5 4.1 3.9-1.2 7.8-3 11.9-6 .9-9.9-1.5-18.6-7.1-26.6zM24 38c-2.2 0-4-2-4-4.5s1.8-4.5 4-4.5 4 2 4 4.5-1.8 4.5-4 4.5zm16 0c-2.2 0-4-2-4-4.5s1.8-4.5 4-4.5 4 2 4 4.5-1.8 4.5-4 4.5z" fill="#FFFFFF" />
        </svg>
      );
    case 'android':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path d="M20 22l-4-7a1 1 0 011.7-1l4 7c3-1.3 6.4-2 10.3-2s7.3.7 10.3 2l4-7a1 1 0 011.7 1l-4 7c4.6 2.7 7.8 7.3 8.5 12.8H11.5c.7-5.5 3.9-10.1 8.5-12.8z" fill="#3DDC84" />
          <circle cx="23" cy="27" r="2" fill="#FFFFFF" />
          <circle cx="41" cy="27" r="2" fill="#FFFFFF" />
          <path d="M11.5 38h41v18a6 6 0 01-6 6h-29a6 6 0 01-6-6V38z" fill="#3DDC84" />
          <rect x="5" y="38" width="4.5" height="16" rx="2.2" fill="#3DDC84" />
          <rect x="54.5" y="38" width="4.5" height="16" rx="2.2" fill="#3DDC84" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#F8F9FA" />
          <path d="M52 23.5c-.5-2-2.1-3.6-4.1-4.1C44.3 18 32 18 32 18s-12.3 0-15.9 1.4c-2 .5-3.6 2.1-4.1 4.1C10.6 27.1 10.6 32 10.6 32s0 4.9 1.4 8.5c.5 2 2.1 3.6 4.1 4.1C19.7 46 32 46 32 46s12.3 0 15.9-1.4c2-.5 3.6-2.1 4.1-4.1 1.4-3.6 1.4-8.5 1.4-8.5s0-4.9-1.4-8.5z" fill="#FF0000" />
          <polygon points="27,26 27,38 39,32" fill="#FFFFFF" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="12" fill="#0A66C2" />
          <circle cx="20" cy="21" r="4.5" fill="#FFFFFF" />
          <rect x="16" y="28" width="8" height="22" fill="#FFFFFF" rx="2" />
          <path d="M30 28h7.5v3.2c1.2-2 3.8-3.7 7.5-3.7 7.5 0 9 4.8 9 11.2V50h-8V39.5c0-2.8-.5-5.5-3.8-5.5s-4.2 2.5-4.2 5.5V50h-8V28z" fill="#FFFFFF" />
        </svg>
      );
    case 'dropbox':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path d="M19 14l13 8-13 8-13-8 13-8zm26 0l13 8-13 8-13-8 13-8zM6 30l13 8-13 8-6-8 6-8zm52 0l6 8-6 8-13-8 13-8zm-26 8l13 8-13 8-13-8 13-8zm0 18l-13-8.5-4.5 3L32 58l17.5-7.5-4.5-3L32 56z" fill="#0061FF" />
        </svg>
      );
    case 'figma':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path d="M22 6h10v13H22a6.5 6.5 0 110-13z" fill="#F24E1E" />
          <path d="M32 6h10a6.5 6.5 0 110 13H32V6z" fill="#FF7262" />
          <path d="M32 19h10a6.5 6.5 0 110 13H32V19z" fill="#1ABCFE" />
          <path d="M22 19h10v13H22a6.5 6.5 0 110-13z" fill="#A259FF" />
          <path d="M22 32h10v6.5a6.5 6.5 0 11-10-6.5z" fill="#0ACF83" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <defs>
            <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FD5949" />
              <stop offset="25%" stopColor="#D6249F" />
              <stop offset="100%" stopColor="#285AEB" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="16" fill="url(#ig)" />
          <rect x="14" y="14" width="36" height="36" rx="10" fill="none" stroke="#FFFFFF" strokeWidth="4.5" />
          <circle cx="32" cy="32" r="8" fill="none" stroke="#FFFFFF" strokeWidth="4.5" />
          <circle cx="43" cy="21" r="2.5" fill="#FFFFFF" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <circle cx="32" cy="32" r="28" fill="#25D366" />
          <path d="M46.5 17.5c-3.8-3.8-9-6-14.5-6-11.3 0-20.5 9.2-20.5 20.5 0 3.6 1 7.1 2.8 10.2L11 53l11.1-3.2c3 1.7 6.4 2.6 9.9 2.6h.01c11.3 0 20.5-9.2 20.5-20.5 0-5.5-2.2-10.7-6-14.4zm-14.5 31.4h-.01c-3.1 0-6.1-.8-8.7-2.4l-.6-.4-6.4 1.8 1.8-6.3-.4-.7c-1.7-2.8-2.6-5.9-2.6-9.1 0-9.4 7.6-17 17-17 4.5 0 8.8 1.8 12 5 3.2 3.2 5 7.5 5 12 0 9.5-7.6 17.1-17.1 17.1zm9.3-12.8c-.5-.3-3-1.5-3.5-1.7-.5-.2-.8-.3-1.2.3-.3.5-1.3 1.7-1.6 2-.3.4-.6.4-1.1.2-.5-.3-2.2-.8-4.2-2.6-1.5-1.4-2.6-3.1-2.9-3.6-.3-.5 0-.8.2-1 .2-.2.5-.6.7-.8.2-.3.3-.5.5-.8.1-.3.1-.6 0-.8-.1-.3-.9-2.3-1.3-3.1-.4-.8-.7-.7-1-.7h-.8c-.3 0-.8.1-1.2.6-.4.4-1.6 1.6-1.6 3.9s1.6 4.5 1.9 4.8c.2.3 3.2 5 7.8 7 1.1.5 2 .8 2.6 1 .9.3 1.9.3 2.6.2.8-.1 2.5-1 2.8-2 .4-1 .4-1.9.3-2.1-.2-.2-.5-.3-1-.5z" fill="#FFFFFF" />
        </svg>
      );
    case 'intel':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="14" fill="#0068B5" />
          <text x="32" y="38" fill="#FFFFFF" fontSize="18" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">intel</text>
          <circle cx="21.5" cy="24" r="2" fill="#FFFFFF" />
        </svg>
      );
    case 'canva':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <circle cx="32" cy="32" r="28" fill="#00C4CC" />
          <text x="32" y="42" fill="#FFFFFF" fontSize="24" fontStyle="italic" fontWeight="bold" fontFamily="serif" textAnchor="middle">C</text>
        </svg>
      );
    case 'reddit':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <circle cx="32" cy="32" r="28" fill="#FF4500" />
          <circle cx="25" cy="34" r="3.5" fill="#FFFFFF" />
          <circle cx="39" cy="34" r="3.5" fill="#FFFFFF" />
          <ellipse cx="32" cy="36" rx="16" ry="11" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M26 41c2 2 10 2 12 0" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="43" cy="20" r="3" fill="#FFFFFF" />
          <path d="M33 25l3-6 7 1" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'netflix':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="14" fill="#141414" />
          <path d="M21 15h6v34h-6z" fill="#E50914" />
          <path d="M37 15h6v34h-6z" fill="#E50914" />
          <path d="M21 15l22 34h-6L21 21z" fill="#B81D24" />
        </svg>
      );
    case 'docker':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="14" fill="#0DB7ED" />
          <g fill="#FFFFFF">
            <rect x="18" y="24" width="4" height="4" rx="0.5" />
            <rect x="24" y="24" width="4" height="4" rx="0.5" />
            <rect x="30" y="24" width="4" height="4" rx="0.5" />
            <rect x="24" y="18" width="4" height="4" rx="0.5" />
            <rect x="30" y="18" width="4" height="4" rx="0.5" />
            <rect x="36" y="24" width="4" height="4" rx="0.5" />
            <path d="M52 32c-1.5-1-4-1-6 0-1-5-6-7-10-7-1 0-2 .1-3 .4v3.6h-23c-1 0-2 .5-2.5 1.5-1 2-1 4.5 0 6.5 2 4.5 7 8 13 8 9 0 17-4 21-10 3 0 6-1 7.5-3z" />
          </g>
        </svg>
      );
    case 'uber':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="14" fill="#000000" />
          <text x="32" y="38" fill="#FFFFFF" fontSize="14" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" letterSpacing="2">UBER</text>
        </svg>
      );
    case 'microsoft':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="14" fill="#F8F9FA" />
          <rect x="16" y="16" width="14" height="14" fill="#F25022" />
          <rect x="34" y="16" width="14" height="14" fill="#7FBA00" />
          <rect x="16" y="34" width="14" height="14" fill="#00A4EF" />
          <rect x="34" y="34" width="14" height="14" fill="#FFB900" />
        </svg>
      );
    default:
      return (
        <div className={`${className} bg-primary-container text-on-primary-container flex items-center justify-center rounded-2xl font-bold text-xl`}>
          {name.slice(0, 2).toUpperCase()}
        </div>
      );
  }
};
