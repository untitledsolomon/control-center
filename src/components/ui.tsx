'use client'
import { Bot, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export function Badge({ children, variant = 'default', className = '' }: {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent' | 'purple' | 'pink'
  className?: string
}) {
  const variants: Record<string, string> = {
    default: 'bg-surface-raised text-muted',
    success: 'bg-success-light text-success',
    warning: 'bg-warning-light text-warning',
    error: 'bg-error-light text-error',
    accent: 'bg-accent-light text-accent',
    purple: 'bg-purple/10 text-purple',
    pink: 'bg-pink/10 text-pink',
  }
  return (
    <span className={'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium tracking-wide ' + (variants[variant] || variants.default) + ' ' + className}>
      {children}
    </span>
  )
}

export function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  const variants: Record<string, string> = {
    primary: 'bg-accent text-white hover:bg-accent/90 shadow-sm',
    secondary: 'bg-surface text-foreground border border-border hover:bg-surface-raised',
    ghost: 'text-muted hover:text-foreground hover:bg-surface-raised',
    danger: 'bg-error text-white hover:bg-error/90 shadow-sm',
  }
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-[12px]',
    md: 'px-4 py-2 text-[13px]',
    lg: 'px-6 py-2.5 text-[14px]',
  }
  return (
    <button
      className={'inline-flex items-center justify-center gap-2 font-medium rounded transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ' + variants[variant] + ' ' + sizes[size] + ' ' + className}
      {...props}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '', ...props }: {
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  return (
    <div className={'bg-base border border-border rounded-[8px] p-5 ' + className} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={'flex items-center justify-between mb-4 ' + className}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h3 className={'text-[16px] font-semibold text-foreground ' + className}>
      {children}
    </h3>
  )
}

export function Logo({ size = 18 }: { size?: number }) {
  return (
    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
      <Bot size={size} className="text-white" />
    </div>
  )
}
