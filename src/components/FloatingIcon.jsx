import React, { useState, useEffect, useCallback } from "react";

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const FloatingIcon = ({
  Icon,
  delay,
  speed,
  initialPosition,
  color = "currentColor",
  size = 200,
  opacity = 0.6,
}) => {
  const [position, setPosition] = useState(
    initialPosition || {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
    }
  );
  const [direction, setDirection] = useState({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
  });

  const updatePosition = useCallback(
    debounce((pos, dir) => {
      const newX = pos.x + dir.x * speed;
      const newY = pos.y + dir.y * speed;

      if (newX < 0 || newX >= window.innerWidth) {
        setDirection((prev) => ({ ...prev, x: -prev.x }));
      }
      if (newY < 0 || newY >= window.innerHeight) {
        setDirection((prev) => ({ ...prev, y: -prev.y }));
      }

      setPosition({
        x: Math.max(0, Math.min(window.innerWidth, newX)),
        y: Math.max(0, Math.min(window.innerHeight, newY)),
      });
    }, 16),
    [speed]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      updatePosition(position, direction);
    }, 50);
    return () => {
      clearInterval(interval);
    };
  }, [position, direction, updatePosition]);

  return (
    <div
      className="absolute will-change-transform"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        animation: `float ${speed}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        opacity: opacity,
        zIndex: 0,
      }}
    >
      <Icon size={size} className={color} />
    </div>
  );
};

export default FloatingIcon;
