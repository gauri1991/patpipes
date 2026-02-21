/**
 * Button Component - ElevenLabs Design System
 *
 * This is an example component that demonstrates the ui-builder agent's output.
 * Features: Multiple variants, sizes, animations, and full accessibility
 */

import React from 'react'
import { motion } from 'framer-motion'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
  className?: string
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2'

  const variants = {
    primary: 'bg-el-black text-white hover:bg-neutral-900 disabled:bg-neutral-400',
    secondary: 'bg-cyan-500 text-white hover:bg-cyan-600 disabled:bg-neutral-400',
    outline: 'border-2 border-el-black text-el-black hover:bg-neutral-50 disabled:border-neutral-400 disabled:text-neutral-400',
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </motion.button>
  )
}
