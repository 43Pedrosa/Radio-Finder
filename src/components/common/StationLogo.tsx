import React, { useState } from 'react';
import { Radio } from 'lucide-react';

interface StationLogoProps {
  url?: string;
  name: string;
  frequency: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StationLogo: React.FC<StationLogoProps> = ({
  url,
  name,
  frequency,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-20 h-20 text-base',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  // If a valid URL is provided and has not errored
  if (url && !imageError) {
    return (
      <div className={`relative ${sizeClasses} rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 ${className}`}>
        <img
          src={url}
          alt={`Logo ${name}`}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Neutral professional fallback visual identity
  return (
    <div
      className={`relative ${sizeClasses} rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex flex-col items-center justify-center text-slate-300 shrink-0 select-none ${className}`}
      title={name}
    >
      <Radio className={`${iconSizes} text-cyan-400/80 mb-0.5`} />
      <span className="font-mono text-[10px] tracking-tight font-medium text-slate-300">
        {frequency}
      </span>
    </div>
  );
};
