import type { PostIntention } from '@/types'

type PillVariant = 'default' | 'accent' | 'danger' | 'muted' | 'violet'

interface PillProps {
  children: React.ReactNode
  variant?: PillVariant
  size?: 'sm' | 'md'
  className?: string
}

const variantStyles: Record<PillVariant, string> = {
  default: 'bg-transparent text-text-muted border border-border',
  accent:  'bg-accent-soft text-accent-strong border border-transparent',
  danger:  'bg-danger-soft text-danger border border-transparent',
  muted:   'bg-surface-2 text-text-muted border border-transparent',
  violet:  'bg-violet-500/10 text-violet-400 border border-transparent',
}

const sizeStyles = {
  sm: 'text-[10px] py-0.5 px-1.5',
  md: 'text-[11px] py-1 px-2',
}

export function Pill({ children, variant = 'default', size = 'md', className = '' }: PillProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium whitespace-nowrap
      ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  )
}

export const INTENTION_PILL: Record<PostIntention, PillVariant> = {
  QUESTION:  'accent',
  SHARE:     'muted',
  PROJECT:   'violet',
  CHALLENGE: 'danger',
}

export const INTENTION_LABEL: Record<PostIntention, string> = {
  QUESTION:  'Question',
  SHARE:     'Partage',
  PROJECT:   'Projet',
  CHALLENGE: 'Challenge',
}
