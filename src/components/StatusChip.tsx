import React from 'react';
import { HallGameStatus } from '../types';

interface StatusChipProps {
  status: HallGameStatus | 'COMPLETED' | 'IN_PROGRESS' | 'WAITING';
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, label, size = 'md' }) => {
  let bgClass = 'bg-surface-container text-on-surface-variant border border-outline';
  let dotClass = 'bg-on-surface-variant';
  let defaultLabel = 'Inactive';

  switch (status) {
    case 'ACTIVE':
      bgClass = 'bg-[#CEEAD6] text-[#073B14] dark:bg-[#14532D] dark:text-[#CEEAD6]';
      dotClass = 'bg-[#188038] dark:bg-[#6DD58C]';
      defaultLabel = 'Active';
      break;
    case 'STOPPED':
      bgClass = 'bg-[#FCE8E6] text-[#601410] dark:bg-[#8C1D18] dark:text-[#FCE8E6]';
      dotClass = 'bg-[#D93025] dark:bg-[#F2B8B5]';
      defaultLabel = 'Stopped';
      break;
    case 'COMPLETED':
      bgClass = 'bg-[#D3E3FD] text-[#0B3B8C] dark:bg-[#0842A0] dark:text-[#D3E3FD]';
      dotClass = 'bg-[#1A73E8] dark:bg-[#A8C7FA]';
      defaultLabel = 'Completed';
      break;
    case 'WAITING':
    case 'INACTIVE':
      bgClass = 'bg-surface-container text-on-surface-variant border border-outline-variant';
      dotClass = 'bg-[#80868B]';
      defaultLabel = status === 'WAITING' ? 'Waiting' : 'Inactive';
      break;
    case 'IN_PROGRESS':
      bgClass = 'bg-[#FFE082] text-[#4D2600] dark:bg-[#5C3800] dark:text-[#FFE082]';
      dotClass = 'bg-[#B06000] dark:bg-[#FDD663]';
      defaultLabel = 'In Progress';
      break;
  }

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors duration-200 ${
        isSmall ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${bgClass}`}
    >
      <span className={`rounded-full animate-pulse ${isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${dotClass}`} />
      <span>{label || defaultLabel}</span>
    </span>
  );
};
