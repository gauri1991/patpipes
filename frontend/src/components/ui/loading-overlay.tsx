'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  showProgress?: boolean;
  duration?: number;
  minDisplayTime?: number;
}

export function LoadingOverlay({ 
  isVisible, 
  message = 'Loading your dashboard...', 
  showProgress = true,
  duration = 3000,
  minDisplayTime = 800
}: LoadingOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [shouldShow, setShouldShow] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  // Handle showing the overlay
  useEffect(() => {
    if (isVisible && !shouldShow) {
      startTimeRef.current = Date.now();
      setShouldShow(true);
      setProgress(0);
    }
  }, [isVisible, shouldShow]);

  // Handle progress animation
  useEffect(() => {
    if (shouldShow && showProgress) {
      const startTime = startTimeRef.current || Date.now();
      const progressTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 90);
        setProgress(newProgress);

        if (elapsed >= duration) {
          clearInterval(progressTimer);
        }
      }, 50);

      return () => clearInterval(progressTimer);
    }
  }, [shouldShow, showProgress, duration]);

  // Handle hiding the overlay
  useEffect(() => {
    if (!isVisible && shouldShow && startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);
      
      const hideTimer = setTimeout(() => {
        setShouldShow(false);
        setProgress(0);
        startTimeRef.current = null;
      }, remainingTime);

      return () => clearTimeout(hideTimer);
    } else if (!isVisible && shouldShow && !startTimeRef.current) {
      // If no start time, hide immediately
      setShouldShow(false);
      setProgress(0);
    }
  }, [isVisible, shouldShow, minDisplayTime]);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.4,
            ease: "easeInOut"
          }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.75)', // More translucent
            backdropFilter: 'blur(4px)', // Lighter blur for performance
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: 0.1,
              ease: [0.68, -0.55, 0.265, 1.55] // Custom easeOutBack cubic-bezier
            }}
            className="flex flex-col items-center space-y-6 bg-white/80 backdrop-blur-sm rounded-3xl px-8 py-6 shadow-xl border border-white/50"
          >
            {/* Animated Logo */}
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/30 to-purple-400/30 blur-xl"
              />
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [-3, 3, -3] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative h-20 w-20 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/40 flex items-center justify-center"
              >
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600/90 to-purple-600/90 bg-clip-text text-transparent">
                  PA
                </span>
              </motion.div>
            </div>

            {/* Loading Dots Animation */}
            <div className="flex space-x-2">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.6, 1, 0.6],
                    backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(139, 92, 246, 0.9)', 'rgba(59, 130, 246, 0.7)'],
                  }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: "easeInOut"
                  }}
                  className="h-3 w-3 rounded-full backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(59, 130, 246, 0.7)' }}
                />
              ))}
            </div>

            {/* Loading Message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-700/90 font-medium text-lg backdrop-blur-sm"
            >
              {message}
            </motion.p>

            {/* Progress Bar */}
            {showProgress && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="relative w-72 h-2 bg-gray-200/60 backdrop-blur-sm rounded-full overflow-hidden border border-white/30"
              >
                <motion.div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500/80 to-purple-500/80 rounded-full backdrop-blur-sm"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400/40 to-purple-400/40 rounded-full"
                  animate={{ x: ['0%', '100%', '0%'] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ width: '25%' }}
                />
              </motion.div>
            )}

            {/* Subtle Status Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-gray-500/80 backdrop-blur-sm"
            >
              Preparing your workspace...
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}