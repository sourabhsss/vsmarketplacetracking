'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface CometCardProps {
  children: React.ReactNode;
  className?: string;
  rotateDepth?: number;
  translateDepth?: number;
}

export function CometCard({
  children,
  className,
  rotateDepth = 17.5,
  translateDepth = 20,
}: CometCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * rotateDepth;
    const rotateY = ((centerX - x) / centerX) * rotateDepth;
    const translateX = ((x - centerX) / centerX) * translateDepth;
    const translateY = ((y - centerY) / centerY) * translateDepth;

    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateX(${translateX}px) translateY(${translateY}px)`
    );
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) translateX(0px) translateY(0px)');
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('relative', className)}
      style={{
        perspective: '1000px',
      }}
    >
      <div
        style={{
          transform,
          transition: 'transform 0.1s ease-out',
        }}
        className="w-full h-full"
      >
        {children}
      </div>
    </div>
  );
}