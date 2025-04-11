import { useState, useRef, useCallback } from "react";

interface ClickAreaProps {
  handleClick: () => void;
  clickValue: number;
}

interface ClickParticle {
  id: number;
  x: number;
  y: number;
  value: number;
}

export default function ClickArea({ handleClick, clickValue }: ClickAreaProps) {
  const [particles, setParticles] = useState<ClickParticle[]>([]);
  const nextParticleId = useRef(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const createParticle = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newParticle: ClickParticle = {
      id: nextParticleId.current++,
      x,
      y,
      value: clickValue
    };
    
    setParticles(prev => [...prev, newParticle]);
    
    // Remove particle after animation completes
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 800);
  }, [clickValue]);
  
  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleClick();
    createParticle(event);
  };
  
  return (
    <div className="relative mb-8">
      <button 
        ref={buttonRef}
        onClick={handleButtonClick}
        className="relative w-40 h-40 md:w-48 md:h-48 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transform transition-transform active:scale-95 focus:outline-none"
      >
        <div className="absolute inset-0 rounded-full bg-indigo-400 opacity-20 animate-pulse"></div>
        <div className="flex flex-col items-center">
          <i className="ri-cursor-fill text-4xl mb-1"></i>
          <span className="font-bold">TAP!</span>
        </div>
      </button>
      
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="click-feedback text-amber-500 font-bold absolute"
            style={{ 
              left: `${particle.x}px`, 
              top: `${particle.y}px` 
            }}
          >
            +{particle.value}
          </div>
        ))}
      </div>
    </div>
  );
}
