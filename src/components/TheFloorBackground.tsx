import React, { useState, useEffect, useRef } from 'react';

export type FloorStage = 'neutral' | 'p1' | 'p2';

interface TheFloorBackgroundProps {
  stage?: FloorStage;
  activeStage?: FloorStage;
}

const STAGE_COLORS: Record<FloorStage, { base: string; alt: string }> = {
  neutral: {
    base: '#1B1B3A',
    alt: '#26264F',
  },
  p1: {
    base: '#1B2A6B',
    alt: '#253B91',
  },
  p2: {
    base: '#5A1632',
    alt: '#741D42',
  },
};

export const TheFloorBackground: React.FC<TheFloorBackgroundProps> = ({
  stage = 'neutral',
  activeStage,
}) => {
  const currentStage = activeStage || stage;
  const [colCount, setColCount] = useState<number>(() =>
    typeof window !== 'undefined'
      ? Math.max(10, Math.ceil(window.innerWidth / 96) + 1)
      : 16
  );
  const [waveKey, setWaveKey] = useState(0);
  const prevStageRef = useRef<FloorStage>(currentStage);

  useEffect(() => {
    const handleResize = () => {
      setColCount(Math.max(10, Math.ceil(window.innerWidth / 96) + 1));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (prevStageRef.current !== currentStage) {
      prevStageRef.current = currentStage;
      setWaveKey((k) => k + 1);
    }
  }, [currentStage]);

  const { base, alt } = STAGE_COLORS[currentStage] || STAGE_COLORS.neutral;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none bg-[#1B1B3A]"
    >
      <div className="relative w-full h-full flex">
        {Array.from({ length: colCount }).map((_, i) => (
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
                  ? `floorWaveFlip 400ms cubic-bezier(0.2, 0, 0, 1) forwards`
                  : undefined,
              animationDelay: `${i * 22}ms`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes floorWaveFlip {
          0% { transform: scaleX(1); opacity: 0.85; }
          45% { transform: scaleX(0); opacity: 0.4; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes floorWaveFlip {
            0% { opacity: 0.9; }
            100% { opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
};
