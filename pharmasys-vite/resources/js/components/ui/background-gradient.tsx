"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
  gradientColors = ["#10B981", "#34D399", "#6EE7B7"], 
  roundedClassName = "rounded-[22px]", // New prop for border radius
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
  gradientColors?: string[];
  roundedClassName?: string; // Added to type
}) => {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
      opacity: 0, // Start with lines transparent
    },
    hover: { // New state for hover
      backgroundPosition: ["0 50%", "100% 50%", "0 50%"],
      opacity: 1, // Lines become visible on hover
    },
    idle: { // State when not hovered
        backgroundPosition: "0 50%", // Or some static position
        opacity: 0, // Lines are transparent
    }
  };

  // Ensure gradientColors has at least 3 colors for a smooth loop, or adjust logic
  const colorString = gradientColors.join(", ");

  return (
    // The PARENT of this component should have the 'group' class.
    <div className={cn("relative p-[1px]", containerClassName)}> {/* Reduced padding for tighter fit */}
      {/* This is the blur/glow effect, make it appear on parent hover */}
      <motion.div
        className={cn(
          "absolute inset-0 z-[1] opacity-0 group-hover:opacity-60 blur-xl transition-opacity duration-300",
          roundedClassName
        )}
        style={{
          backgroundImage: `radial-gradient(circle farthest-side at 100% 0, ${gradientColors[0]}, transparent),
                            radial-gradient(circle farthest-side at 0 100%, ${gradientColors[1]}, transparent),
                            radial-gradient(circle farthest-side at 100% 100%, ${gradientColors[2]}, transparent),
                            radial-gradient(circle farthest-side at 0 0, ${gradientColors[0]}, transparent)`,
          backgroundSize: "400% 400%", // Keep size for blur effect
        }}
        // Animate background position for blur effect if desired, or keep static
        variants={animate ? { initial: { backgroundPosition: "0 50%" }, hover: { backgroundPosition: ["0 50%", "100% 50%", "0 50%"] } } : undefined}
        initial="initial"
        whileHover="hover" // Trigger 'hover' variant on parent hover
        transition={animate ? { duration: 5, repeat: Infinity, repeatType: "loop" } : undefined}
      />
      {/* This is for the sharp gradient lines */}
      <motion.div
        variants={animate ? variants : undefined} // Use initial, hover, idle variants
        initial="idle"
        whileHover="hover" // Trigger 'hover' variant on parent hover
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                repeatType: "loop",
              }
            : undefined
        }
        style={{
          backgroundSize: animate ? "400% 400%" : undefined,
          backgroundImage: animate
            ? `radial-gradient(circle farthest-side at 100% 0, ${gradientColors[0]}, transparent),
               radial-gradient(circle farthest-side at 0 100%, ${gradientColors[1]}, transparent),
               radial-gradient(circle farthest-side at 100% 100%, ${gradientColors[2]}, transparent),
               radial-gradient(circle farthest-side at 0 0, ${gradientColors[0]}, transparent)`
            : undefined,
        }}
        className={cn(
          "absolute inset-0 z-[2]", // Ensure lines are above blur
          roundedClassName 
        )}
      />
      {/* Content sits above the gradient lines and blur */}
      <div className={cn("relative z-[3] h-full w-full", className)}> 
        {children}
      </div>
    </div>
  );
};
