import React, { useState, useEffect, useRef, useCallback } from "react";

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
  const [position, setPosition] = useState({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
  });

  const [direction, setDirection] = useState({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
  });

  const rotationRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  const updateAnimation = useCallback(
    (timestamp: number) => {
      if (!lastUpdateRef.current) lastUpdateRef.current = timestamp;

      const deltaTime = timestamp - lastUpdateRef.current;
      const frameSpeed = (speed * deltaTime) / 16; // Normalize speed based on frame time

      setPosition((prevPos) => {
        let newX = prevPos.x + direction.x * frameSpeed;
        let newY = prevPos.y + direction.y * frameSpeed;
        let newDirection = { ...direction };

        // Bounce off edges with some padding
        if (newX < 0 || newX >= window.innerWidth) {
          newDirection.x = -direction.x;
          newX = Math.max(0, Math.min(window.innerWidth, newX));
        }
        if (newY < 0 || newY >= window.innerHeight) {
          newDirection.y = -direction.y;
          newY = Math.max(0, Math.min(window.innerHeight, newY));
        }

        // Update direction if changed
        if (newDirection.x !== direction.x || newDirection.y !== direction.y) {
          setDirection(newDirection);
        }

        return {
          x: newX,
          y: newY,
        };
      });

      // Smooth rotation
      rotationRef.current = (rotationRef.current + (deltaTime / 16) * 1) % 360;
      lastUpdateRef.current = timestamp;

      animationFrameRef.current = requestAnimationFrame(updateAnimation);
    },
    [speed, direction]
  );

  useEffect(() => {
    // Add initial delay
    const timeout = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(updateAnimation);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [delay, updateAnimation]);

  return (
    <div
      className="absolute will-change-transform"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0) rotate(${rotationRef.current}deg)`,
        transition: "transform 0.05s linear",
        opacity,
        zIndex: 0,
      }}
    >
      <Icon size={size} className={color} />
    </div>
  );
};

export default FloatingIcon;
