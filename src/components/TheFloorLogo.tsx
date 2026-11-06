import React from 'react';

interface TheFloorLogoProps {
  size?: 'hero' | 'header' | 'mobile';
  className?: string;
}

interface LetterTile {
  char: string;
  word: 'THE' | 'FLOOR';
  bgHex: string;
  textColor: string;
  tiltDeg: number;
}

const LETTERS: LetterTile[] = [
  // THE
  { char: 'T', word: 'THE', bgHex: '#FFC933', textColor: '#14121F', tiltDeg: -2 },
  { char: 'H', word: 'THE', bgHex: '#2F6BFF', textColor: '#FFFFFF', tiltDeg: 1.5 },
  { char: 'E', word: 'THE', bgHex: '#FF3D6E', textColor: '#FFFFFF', tiltDeg: -1 },

  // FLOOR
  { char: 'F', word: 'FLOOR', bgHex: '#19C37D', textColor: '#14121F', tiltDeg: 2.5 },
  { char: 'L', word: 'FLOOR', bgHex: '#FFFDF5', textColor: '#14121F', tiltDeg: -1.5 },
  { char: 'O', word: 'FLOOR', bgHex: '#FFC933', textColor: '#14121F', tiltDeg: 1 },
  { char: 'O', word: 'FLOOR', bgHex: '#2F6BFF', textColor: '#FFFFFF', tiltDeg: -2.5 },
  { char: 'R', word: 'FLOOR', bgHex: '#FF3D6E', textColor: '#FFFFFF', tiltDeg: 2 },
];

export const TheFloorLogo: React.FC<TheFloorLogoProps> = ({
  size = 'header',
  className = '',
}) => {
  const sizeClasses = {
    hero: 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-[84px] lg:h-[84px] text-2xl sm:text-4xl md:text-5xl lg:text-6xl rounded-2xl border-[3px] border-ink shadow-hard select-none',
    header: 'w-9 h-9 text-lg rounded-xl border-[3px] border-ink shadow-hard-sm select-none',
    mobile: 'w-7 h-7 text-sm rounded-lg border-[2.5px] border-ink shadow-hard-sm select-none',
  }[size];

  const wordGapClass = {
    hero: 'gap-1.5 sm:gap-2 md:gap-3',
    header: 'gap-1',
    mobile: 'gap-0.5',
  }[size];

  const groupGapClass = {
    hero: 'gap-3 sm:gap-4 md:gap-6',
    header: 'gap-2.5',
    mobile: 'gap-1.5',
  }[size];

  const theWord = LETTERS.filter((l) => l.word === 'THE');
  const floorWord = LETTERS.filter((l) => l.word === 'FLOOR');

  return (
    <div
      aria-label="THE FLOOR"
      className={`flex items-center justify-center flex-wrap ${groupGapClass} ${className}`}
    >
      {/* "THE" */}
      <div className={`flex items-center ${wordGapClass}`}>
        {theWord.map((item, idx) => (
          <div
            key={`the-${idx}`}
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

      {/* "FLOOR" */}
      <div className={`flex items-center ${wordGapClass}`}>
        {floorWord.map((item, idx) => (
          <div
            key={`floor-${idx}`}
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
    </div>
  );
};
