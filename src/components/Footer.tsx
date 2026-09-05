import React from 'react';
import { MaterialSymbols } from './MaterialSymbols';
import { Globe } from 'lucide-react';
import { LogoVector } from '../data/logoVectors';

interface FooterProps {
  currentHallName?: string;
}

export const Footer: React.FC<FooterProps> = ({ currentHallName }) => {
  return (
    <footer className="mt-auto border-t border-outline-variant bg-surface-container-low/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Logos & Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-outline-variant/80 flex items-center justify-center p-1.5 shadow-xs shrink-0">
                <img
                  src="/logo.png"
                  alt="GDG on Campus SVEC"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-on-surface-variant/50 font-light text-xl select-none">×</span>
              <div className="w-12 h-12 rounded-xl bg-white border border-outline-variant/80 flex items-center justify-center p-1.5 shadow-xs shrink-0">
                <img
                  src="/aikyam.png"
                  alt="AIKYAM"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div>
              <h2 className="font-display font-bold text-xl text-on-surface tracking-tight">
                DevPath 2.O
              </h2>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Orientation Program 2026 {currentHallName ? `• ${currentHallName}` : ''}
              </p>
            </div>
            
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Empowering students through experiential learning, interactive quizzes, and technological awareness.
            </p>
          </div>

          {/* About Us Matter Column */}
          <div className="lg:col-span-8 bg-surface rounded-2xl p-5 sm:p-6 border border-outline-variant/80 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-on-surface">
                About Us
              </h3>
            </div>

            <p className="text-sm text-on-surface leading-relaxed mb-4">
              🚀 <span className="font-semibold text-primary">Google Developer Groups on Campus – Sri Vasavi Engineering College</span> is conducting an exciting <span className="font-semibold">Orientation Program in collaboration with AIKYAM</span>! Join us to connect, learn, collaborate, and explore the developer community at SVEC.
            </p>

            <div className="pt-3 border-t border-outline-variant/60 flex flex-wrap items-center gap-y-2.5 gap-x-4 text-xs sm:text-sm text-on-surface-variant">
              {/* Website */}
              <a
                href="https://gdg.community.dev/gdg-on-campus-sri-vasavi-engineering-college-tadepalligudem-india/?utm_source=chatgpt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
              >
                <Globe className="w-4 h-4 text-primary shrink-0" />
                <span>GDG on Campus SVEC Website</span>
              </a>

              <span className="text-outline-variant hidden sm:inline">•</span>

              {/* Instagram */}
              <a
                href="https://instagram.com/gdgoc.svec"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium text-on-surface hover:text-[#E4405F] transition-colors group"
              >
                <div className="w-4 h-4 shrink-0 rounded-xs overflow-hidden shadow-2xs group-hover:scale-110 transition-transform">
                  <LogoVector name="instagram" className="w-full h-full" />
                </div>
                <span>Instagram: <strong className="font-semibold">@gdgoc.svec</strong></span>
              </a>

              <span className="text-outline-variant hidden sm:inline">•</span>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/company/gdgoc-svec/?utm_source=chatgpt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium text-primary hover:underline hover:text-primary/80 transition-colors group"
              >
                <div className="w-4 h-4 shrink-0 rounded-xs overflow-hidden shadow-2xs group-hover:scale-110 transition-transform">
                  <LogoVector name="linkedin" className="w-full h-full" />
                </div>
                <span>LinkedIn – GDG on Campus SVEC</span>
              </a>
            </div>
          </div>

        </div>

        {/* Developed by Purnima Karri - Center of Footer Session */}
        <div className="mt-8 pt-6 border-t border-outline-variant/60 flex flex-col items-center justify-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-outline-variant/80 shadow-xs hover:border-primary/40 transition-all">
            <span className="text-xs text-on-surface-variant font-medium">Developed by</span>
            <a
              href="https://www.linkedin.com/in/karripurnima"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline hover:text-primary/80 transition-colors group"
            >
              <div className="w-4 h-4 shrink-0 rounded-xs overflow-hidden shadow-2xs group-hover:scale-110 transition-transform">
                <LogoVector name="linkedin" className="w-full h-full" />
              </div>
              <span>Purnima Karri</span>
            </a>
          </div>
        </div>

        {/* Copyright strip */}
        <div className="mt-4 pt-4 border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between text-xs text-on-surface-variant gap-2 text-center sm:text-left">
          <div>
            DevPath 2.O  •  Sri Vasavi Engineering College  •  Tadepalligudem
          </div>
          <div>
            Powered by GDG on Campus SVEC & AIKYAM
          </div>
        </div>
      </div>
    </footer>
  );
};
