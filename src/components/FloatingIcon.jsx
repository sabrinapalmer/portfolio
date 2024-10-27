import React, { useState, useEffect } from "react";

const FloatingIcon = ({
  Icon,
  delay,
  speed,
  initialPosition,
  color = "currentColor",
  size = 24,
  opacity = 0.2,
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

  useEffect(() => {
    const moveIcon = () => {
      const newX = position.x + direction.x * speed;
      const newY = position.y + direction.y * speed;

      if (newX < 0 || newX > window.innerWidth) {
        setDirection((prev) => ({ ...prev, x: -prev.x }));
      }
      if (newY < 0 || newY > window.innerHeight) {
        setDirection((prev) => ({ ...prev, y: -prev.y }));
      }

      setPosition({
        x: Math.max(0, Math.min(window.innerWidth, newX)),
        y: Math.max(0, Math.min(window.innerHeight, newY)),
      });
    };

    const interval = setInterval(moveIcon, 50);
    return () => clearInterval(interval);
  }, [position, direction, speed]);

  return (
    <div
      className="absolute transition-all duration-300"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
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
