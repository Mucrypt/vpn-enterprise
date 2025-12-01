"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function MagneticCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cursor = cursorRef.current;
    const cursorDot = cursorDotRef.current;
    
    if (!cursor || !cursorDot) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    // Smooth cursor following
    const animateCursor = () => {
      const speed = 0.15;
      
      cursorX += (mouseX - cursorX) * speed;
      cursorY += (mouseY - cursorY) * speed;

      gsap.set(cursor, {
        x: cursorX - 16,
        y: cursorY - 16,
      });

      gsap.set(cursorDot, {
        x: mouseX - 2,
        y: mouseY - 2,
      });

      requestAnimationFrame(animateCursor);
    };

    // Magnetic effect on interactive elements
    const handleElementHover = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
      );
      
      const maxDistance = 100;
      
      if (distance < maxDistance) {
        const strength = (maxDistance - distance) / maxDistance;
        const pullX = (centerX - mouseX) * strength * 0.3;
        const pullY = (centerY - mouseY) * strength * 0.3;
        
        gsap.to(element, {
          x: pullX,
          y: pullY,
          duration: 0.3,
          ease: "power2.out"
        });

        // Scale cursor on hover
        gsap.to(cursor, {
          scale: 1.5,
          duration: 0.3,
          ease: "power2.out"
        });
      } else {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: "power2.out"
        });

        gsap.to(cursor, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    };

    // Initialize
    document.addEventListener('mousemove', handleMouseMove);
    animateCursor();

    // Add magnetic effect to interactive elements
    const magneticElements = document.querySelectorAll('[data-magnetic]');
    
    const handleMagneticMove = (e: MouseEvent) => {
      magneticElements.forEach(element => {
        handleElementHover(element);
      });
    };

    document.addEventListener('mousemove', handleMagneticMove);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousemove', handleMagneticMove);
    };
  }, []);

  return (
    <>
      {/* Main cursor */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-50 hidden lg:block"
        style={{ willChange: 'transform' }}
      >
        <div className="w-full h-full bg-white/20 border border-white/40 rounded-full backdrop-blur-sm"></div>
      </div>

      {/* Cursor dot */}
      <div
        ref={cursorDotRef}
        className="fixed top-0 left-0 w-1 h-1 pointer-events-none z-50 hidden lg:block"
        style={{ willChange: 'transform' }}
      >
        <div className="w-full h-full bg-emerald-500 rounded-full shadow-sm"></div>
      </div>

      <style>{`
        * {
          cursor: none !important;
        }
        
        @media (max-width: 1024px) {
          * {
            cursor: auto !important;
          }
        }
      `}</style>
    </>
  );
}