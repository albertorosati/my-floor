import React, { useState, useEffect, useRef } from 'react';
import { getPlayerColor } from '../utils/playerColors';

export type FloorStage =
  | 'neutral'
  | 'modal'
  | 'p1'
  | 'p2'
  | 'blue'
  | 'red'
  | 'purple'
  | 'orange'
  | 'teal'
  | 'lime'
  | 'magenta'
  | 'brown'
  | string;

interface TheFloorBackgroundProps {
  stage?: FloorStage;
  activeStage?: FloorStage;
  isHome?: boolean;
}

export const TheFloorBackground: React.FC<TheFloorBackgroundProps> = ({
  stage = 'neutral',
  activeStage,
  isHome = false,
}) => {
  const currentStage = (activeStage || stage).toLowerCase();
  const [colCount, setColCount] = useState<number>(() =>
    typeof window !== 'undefined'
      ? Math.max(10, Math.ceil(window.innerWidth / 96) + 1)
      : 16
  );
  const [waveKey, setWaveKey] = useState(0);
  const prevStageRef = useRef<string>(currentStage);
  const [flippingCol, setFlippingCol] = useState<number | null>(null);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      setColCount(Math.max(10, Math.ceil(window.innerWidth / 96) + 1));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Wave trigger on stage change (250ms max wave)
  useEffect(() => {
    if (prevStageRef.current !== currentStage) {
      prevStageRef.current = currentStage;
      setWaveKey((k) => k + 1);
    }
  }, [currentStage]);

  // Home-only: One random floor tile flips every 2.5s (paused if tab is hidden or reduced motion)
  useEffect(() => {
    if (!isHome) return;

    const interval = setInterval(() => {
      if (document.hidden) return;
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }
      const randomCol = Math.floor(Math.random() * colCount);
      setFlippingCol(randomCol);
      setTimeout(() => setFlippingCol(null), 600);
    }, 2500);

    return () => clearInterval(interval);
  }, [isHome, colCount]);

  // Compute colors
  let base = '#1B1B3A';
  let alt = '#26264F';

  if (currentStage === 'modal') {
    base = '#0F0E1A';
    alt = '#141224'; // ~4% lighter checkerboard
  } else if (currentStage === 'neutral') {
    base = '#1B1B3A';
    alt = '#26264F';
  } else {
    const colorDef = getPlayerColor(currentStage);
    base = colorDef.stageHex;
    alt = colorDef.stageAltHex;
  }

  const isModal = currentStage === 'modal';
  const animDuration = isModal ? '350ms' : '250ms';
  const delayStep = isModal ? 16 : 10;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none bg-[#0F0E1A]"
    >
      <div className="relative w-full h-full flex">
        {Array.from({ length: colCount }).map((_, i) => {
          const isFlipping = flippingCol === i;

          return (
            <div
              key={`${waveKey}-${i}`}
              className="h-full shrink-0"
              style={{
                width: '96px',
                backgroundImage: `conic-gradient(${alt} 90deg, ${base} 90deg 180deg, ${alt} 180deg 270deg, ${base} 270deg)`,
                backgroundSize: '192px 192px',
                backgroundPosition: `${-i * 96}px 0px`,
                animation:
                  waveKey > 0
                    ? `floorWaveFlip ${animDuration} cubic-bezier(0.2, 0, 0, 1) forwards`
                    : isFlipping
                    ? `homeSingleTileFlip 600ms ease-in-out forwards`
                    : undefined,
                animationDelay: waveKey > 0 ? `${i * delayStep}ms` : undefined,
              }}
            />
          );
        })}
      </div>
      <style>{`
        @keyframes floorWaveFlip {
          0% { transform: scaleX(1); opacity: 0.9; }
          45% { transform: scaleX(0); opacity: 0.4; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        @keyframes homeSingleTileFlip {
          0% { transform: perspective(400px) rotateY(0deg); }
          50% { transform: perspective(400px) rotateY(90deg); filter: brightness(1.3); }
          100% { transform: perspective(400px) rotateY(0deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes floorWaveFlip {
            0% { opacity: 0.95; }
            100% { opacity: 1; }
          }
          @keyframes homeSingleTileFlip {
            0% { opacity: 1; }
            100% { opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
};
