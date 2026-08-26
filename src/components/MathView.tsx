import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathViewProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
  id?: string;
}

export const MathView: React.FC<MathViewProps> = ({
  latex,
  displayMode = false,
  className = '',
  id,
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(latex || '0', containerRef.current, {
          displayMode,
          throwOnError: false,
          output: 'htmlAndMathml',
        });
      } catch (err) {
        if (containerRef.current) {
          containerRef.current.textContent = latex;
        }
      }
    }
  }, [latex, displayMode]);

  return (
    <span
      ref={containerRef}
      id={id}
      className={`inline-block select-none math-font ${className}`}
    />
  );
};
