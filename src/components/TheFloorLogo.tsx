import React from 'react';

export interface TheFloorLogoProps {
  size?: 'hero' | 'header' | 'mobile';
  className?: string;
}

export interface LetterTile {
  char: string;
  bgHex: string;
  textColor: string;
  tiltDeg: number;
}

const LETTERS: LetterTile[] = [
  { char: 'Y', bgHex: '#FFC933', textColor: '#14121F', tiltDeg: -2 },
  { char: 'A', bgHex: '#2F6BFF', textColor: '#FFFFFF', tiltDeg: 1.5 },
  { char: 'P', bgHex: '#FF3D6E', textColor: '#FFFFFF', tiltDeg: -1 },
  { char: 'P', bgHex: '#19C37D', textColor: '#14121F', tiltDeg: 2 },
  { char: 'I', bgHex: '#FFFDF5', textColor: '#14121F', tiltDeg: -1.5 },
  { char: 'K', bgHex: '#FFC933', textColor: '#14121F', tiltDeg: 1.5 },
];

export const YappikLogo: React.FC<TheFloorLogoProps> = ({
  size = 'hero',
  className = '',
}) => {
  const sizeClasses = {
    hero: 'w-11 h-11 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-[84px] lg:h-[84px] text-xl sm:text-4xl md:text-5xl lg:text-6xl rounded-2xl border-[3px] border-ink shadow-hard select-none',
    header: 'w-8 h-8 sm:w-9 sm:h-9 text-base sm:text-lg rounded-xl border-[2.5px] border-ink shadow-hard-sm select-none',
    mobile: 'w-7 h-7 text-sm rounded-lg border-[2px] border-ink shadow-hard-sm select-none',
  }[size];

  const gapClass = {
    hero: 'gap-1.5 sm:gap-2.5 md:gap-3 lg:gap-3.5',
    header: 'gap-1 sm:gap-1.5',
    mobile: 'gap-1',
  }[size];

  return (
    <div
      aria-label="YAPPIK"
      className={`flex items-center justify-center ${gapClass} ${className}`}
    >
      {LETTERS.map((item, idx) => (
        <div
          key={`yappik-${idx}-${item.char}`}
          style={{
            backgroundColor: item.bgHex,
            color: item.textColor,
            transform: `rotate(${item.tiltDeg}deg)`,
          }}
          className={`flex items-center justify-center font-display font-black leading-none ${sizeClasses}`}
        >
          {item.char}
        </div>
      ))}
    </div>
  );
};

export const TheFloorLogo = YappikLogo;
