import React from 'react';
import { TargetWinsOption } from '../types/game';

interface ScorePipsProps {
  score: number;
  targetWins: TargetWinsOption | number;
  playerColor?: 'blue' | 'red' | 'yellow' | 'green';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ScorePips: React.FC<ScorePipsProps> = ({
  score,
  targetWins,
  playerColor = 'blue',
  size = 'md',
  className = '',
}) => {
  const isFree = targetWins === 0;

  if (isFree) {
    return (
      <span className={`font-display font-black text-sm tracking-wide ${className}`}>
        {score} pts
      </span>
    );
  }

  const total = Number(targetWins) || 3;
  const pips = Array.from({ length: total });

  const colorClasses = {
    blue: 'bg-blue text-white',
    red: 'bg-red text-white',
    yellow: 'bg-yellow text-ink',
    green: 'bg-green text-ink',
  }[playerColor];

  const sizeClasses = {
    sm: 'w-3.5 h-3.5 border-2',
    md: 'w-5 h-5 border-[2.5px]',
    lg: 'w-6 h-6 border-[3px]',
  }[size];

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {pips.map((_, idx) => {
        const isFilled = idx < score;
        const isLatest = idx === score - 1;
        return (
          <div
            key={idx}
            className={`rounded-full border-ink shadow-hard-sm transition-all duration-200 ${sizeClasses} ${
              isFilled ? colorClasses : 'bg-paper/90'
            } ${isFilled && isLatest ? 'animate-pip-bounce' : ''}`}
            title={`Point ${idx + 1}/${total}`}
          />
        );
      })}
    </div>
  );
};
