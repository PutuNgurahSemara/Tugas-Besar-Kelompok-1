"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowingEffectProps {
  glow?: boolean;
  disabled?: boolean;
  proximity?: number;
  spread?: number;
  inactiveZone?: number;
  glowColor?: string; // e.g., "hsl(var(--primary))" or a specific color like "#10B981"
  className?: string;
}

export const GlowingEffect = ({
  glow = true,
  disabled = false,
  proximity = 64,
  spread = 60, // Increased default spread
  inactiveZone = 0.005, // Smaller inactive zone for more color
  glowColor = "rgba(0, 255, 0, 0.5)", 
  className,
  borderRadiusClassName = "rounded-2xl md:rounded-3xl", // New prop for border radius class
}: GlowingEffectProps & { borderRadiusClassName?: string }) => { // Added borderRadiusClassName to props
  const ref = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const opacity = useMotionValue(0);

  const springConfig = { damping: 100, stiffness: 500, mass: 1 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);
  const smoothOpacity = useSpring(opacity, springConfig); // opacity is a motion value

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current || disabled) return;
      const rect = ref.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    };
    
    // Get the parent of the ref to attach mouse enter/leave
    // The effect div itself has pointer-events-none
    const parentElement = ref.current?.parentElement;

    const handleMouseEnter = () => {
      if (!disabled && glow) {
        setIsHovering(true);
        opacity.set(1); // Directly set opacity to 1 on hover
      }
    };
    const handleMouseLeave = () => {
      setIsHovering(false);
      opacity.set(0); // Directly set opacity to 0 on leave
    };

    // Attach listeners to the parent element
    parentElement?.addEventListener("mousemove", handleMouseMove);
    parentElement?.addEventListener("mouseenter", handleMouseEnter);
    parentElement?.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      parentElement?.removeEventListener("mousemove", handleMouseMove);
      parentElement?.removeEventListener("mouseenter", handleMouseEnter);
      parentElement?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [ref, disabled, glow, mouseX, mouseY, opacity]); // Added glow to dependency array

  const gradientStyle = useTransform(
    [smoothMouseX, smoothMouseY], // Removed smoothOpacity from here as it's handled directly
    ([x, y]) => {
      const zone = inactiveZone * 100;
      return `radial-gradient(${spread}px circle at ${x}px ${y}px, ${glowColor} ${zone}%, transparent ${proximity}%)`;
    }
  );

  if (disabled || !glow) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        "pointer-events-none absolute -inset-px", // Removed rounded-inherit
        borderRadiusClassName, // Apply border radius class directly
        className
      )}
      style={{
        background: gradientStyle,
        opacity: smoothOpacity, // Use the smoothed opacity
      }}
      ref={ref} // The ref is on the effect div itself, but listeners are on parent
    />
  );
};
