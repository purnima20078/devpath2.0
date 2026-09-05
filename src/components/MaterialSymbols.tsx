import React from 'react';

interface MaterialSymbolsProps {
  icon: string;
  className?: string;
  fill?: boolean;
  size?: number;
  ariaLabel?: string;
}

export const MaterialSymbols: React.FC<MaterialSymbolsProps> = ({
  icon,
  className = '',
  fill = false,
  size = 24,
  ariaLabel,
}) => {
  return (
    <span
      className={`material-symbols-outlined select-none ${fill ? 'fill' : ''} ${className}`}
      style={{ fontSize: `${size}px`, width: `${size}px`, height: `${size}px` }}
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      {icon}
    </span>
  );
};
