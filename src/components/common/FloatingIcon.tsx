import React, { useState, useEffect, useRef } from "react";

interface FloatingIconProps {
  Icon: React.ElementType;
  delay: number;
  speed: number;
  color?: string;
  size?: number;
  opacity?: number;
}

const FloatingIcon: React.FC<FloatingIconProps> = ({
  Icon,
  delay,
  speed,
  color = "currentColor",
  size = 24,
  opacity = 0.6,
}) => {
  const positionRef = useRef({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
  });

  const directionRef = useRef({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
  });

  const elementRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  const updateAnimation = (timestamp: number) => {
    if (!lastUpdateRef.current) lastUpdateRef.current = timestamp;

    const deltaTime = timestamp - lastUpdateRef.current;
    const frameSpeed = (speed * deltaTime) / 16;

    // Update position using refs instead of state
    let newX = positionRef.current.x + directionRef.current.x * frameSpeed;
    let newY = positionRef.current.y + directionRef.current.y * frameSpeed;

    // Bounce off edges with some padding
    if (newX < 0 || newX >= window.innerWidth) {
      directionRef.current.x = -directionRef.current.x;
      newX = Math.max(0, Math.min(window.innerWidth, newX));
    }
    if (newY < 0 || newY >= window.innerHeight) {
      directionRef.current.y = -directionRef.current.y;
      newY = Math.max(0, Math.min(window.innerHeight, newY));
    }

    positionRef.current = { x: newX, y: newY };

    // Smooth rotation
    rotationRef.current = (rotationRef.current + (deltaTime / 16) * 1) % 360;

    // Apply transforms directly to the DOM element
    if (elementRef.current) {
      elementRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0) rotate(${rotationRef.current}deg)`;
    }

    lastUpdateRef.current = timestamp;
    animationFrameRef.current = requestAnimationFrame(updateAnimation);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(updateAnimation);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [delay]);

  return (
    <div
      ref={elementRef}
      className="absolute will-change-transform"
      style={{
        transform: `translate3d(${positionRef.current.x}px, ${positionRef.current.y}px, 0) rotate(${rotationRef.current}deg)`,
        opacity,
        zIndex: 0,
      }}
    >
      <Icon size={size} className={color} />
    </div>
  );
};

export default FloatingIcon;
