import React, { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number | string;
  duration?: number;
  className?: string;
  decimals?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  className = '',
  decimals = 0
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (typeof value === 'string') {
      setDisplayValue(value as any);
      return;
    }

    setIsAnimating(true);
    const startValue = displayValue;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  if (typeof value === 'string') {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={className}>
      {displayValue.toFixed(decimals)}
    </span>
  );
};

export default AnimatedNumber;



