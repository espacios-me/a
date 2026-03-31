import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'flat'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'rounded-2xl border border-zinc-900 bg-zinc-950 p-4 sm:p-5',
      elevated: 'rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-2xl shadow-black/40',
      flat: 'rounded-2xl bg-zinc-950/70 p-4 sm:p-5',
    }

    return <div ref={ref} className={`${variants[variant]} ${className || ''}`} {...props} />
  }
)

Card.displayName = 'Card'
