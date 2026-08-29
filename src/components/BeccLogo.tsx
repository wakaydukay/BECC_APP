import React from 'react';

interface BeccLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export function BeccLogo({ className = 'w-10 h-10', size, showText = false }: BeccLogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/becc-logo.svg"
        alt="Batanes Educators Credit Cooperative (BECC) Emblem"
        className="w-full h-full object-contain rounded-full shadow-sm"
        style={style}
        referrerPolicy="no-referrer"
      />
      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight leading-tight">
            BECC Cooperative
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Basco, Batanes • Since 1982
          </span>
        </div>
      )}
    </div>
  );
}
