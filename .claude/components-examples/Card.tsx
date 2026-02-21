/**
 * Card Component - ElevenLabs Design System
 *
 * A versatile card component with hover effects and animations
 */

import React from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  hover?: boolean
  className?: string
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = true,
  className = '',
}) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : {}}
      className={`bg-white rounded-lg border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      {children}
    </motion.div>
  )
}
