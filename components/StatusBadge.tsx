import React from 'react';
import { PropertyStatus } from '../types';

interface StatusBadgeProps {
  status: PropertyStatus;
}

const statusStyles: Record<PropertyStatus, string> = {
  'Disponível': 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
  'Em processo de locação': 'bg-amber-100 text-amber-800 ring-amber-600/20',
  'Desocupando': 'bg-purple-100 text-purple-800 ring-purple-600/20',
  'Suspenso': 'bg-slate-100 text-slate-600 ring-slate-500/10',
  'Locado': 'bg-red-50 text-red-700 ring-red-600/10',
};

const dotColors: Record<PropertyStatus, string> = {
  'Disponível': 'bg-emerald-500',
  'Em processo de locação': 'bg-amber-500',
  'Desocupando': 'bg-purple-500',
  'Suspenso': 'bg-slate-500',
  'Locado': 'bg-red-500',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${statusStyles[status]} transition-all shadow-sm`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
      {status}
    </span>
  );
};