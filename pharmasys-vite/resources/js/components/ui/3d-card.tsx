"use client";
import { cn } from "@/lib/utils";
import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
} from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface MouseEnterContextType {
  isMouseEntered: boolean;
  setIsMouseEntered: React.Dispatch<React.SetStateAction<boolean>>;
}

const MouseEnterContext = createContext<MouseEnterContextType | undefined>(
  undefined
);

export const CardContainer = ({
  children,
  className,
  containerClassName,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } =
      containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsMouseEntered(true);
    if (!containerRef.current) return;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    setIsMouseEntered(false);
    mouseX.set(width / 2);
    mouseY.set(height / 2);
  };

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Dimensions needed for centering on mouse leave
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.offsetWidth);
      setHeight(containerRef.current.offsetHeight);
      mouseX.set(containerRef.current.offsetWidth / 2); // Initialize to center
      mouseY.set(containerRef.current.offsetHeight / 2); // Initialize to center
    }
  }, []);


  const rotateX = useSpring(
    useTransform(mouseY, [0, height], [10, -10]), // Adjust rotation range as needed
    { stiffness: 200, damping: 20, mass: 0.5 }
  );
  const rotateY = useSpring(
    useTransform(mouseX, [0, width], [-10, 10]), // Adjust rotation range
    { stiffness: 200, damping: 20, mass: 0.5 }
  );

  return (
    <MouseEnterContext.Provider value={{ isMouseEntered, setIsMouseEntered }}>
      <motion.div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: "1000px",
          rotateX: isMouseEntered ? rotateX : 0,
          rotateY: isMouseEntered ? rotateY : 0,
        }}
        className={cn(
          "flex items-center justify-center",
          containerClassName
        )}
      >
        <div
          style={{
             transformStyle: "preserve-3d",
          }}
          className={cn("relative", className)}
        >
          {children}
        </div>
      </motion.div>
    </MouseEnterContext.Provider>
  );
};

export const CardBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      style={{
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "h-96 w-96 [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]",
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardItem = ({
  as: Tag = "div",
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}: {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  translateX?: number; // Changed to number
  translateY?: number; // Changed to number
  translateZ?: number; // Changed to number
  rotateX?: number;    // Changed to number
  rotateY?: number;    // Changed to number
  rotateZ?: number;    // Changed to number
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { isMouseEntered } = useMouseEnter();

  const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };

  const finalTranslateX = useSpring(isMouseEntered ? translateX : 0, springConfig);
  const finalTranslateY = useSpring(isMouseEntered ? translateY : 0, springConfig);
  const finalTranslateZ = useSpring(isMouseEntered ? translateZ : 0, springConfig);
  const finalRotateX = useSpring(isMouseEntered ? rotateX : 0, springConfig);
  const finalRotateY = useSpring(isMouseEntered ? rotateY : 0, springConfig);
  const finalRotateZ = useSpring(isMouseEntered ? rotateZ : 0, springConfig);


  return (
    <motion.div
      ref={ref}
      style={{
        translateX: finalTranslateX,
        translateY: finalTranslateY,
        translateZ: finalTranslateZ,
        rotateX: finalRotateX,
        rotateY: finalRotateY,
        rotateZ: finalRotateZ,
      }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

// Hook to use the context
export const useMouseEnter = () => {
  const context = useContext(MouseEnterContext);
  if (context === undefined) {
    throw new Error("useMouseEnter must be used within a MouseEnterProvider");
  }
  return context;
};
