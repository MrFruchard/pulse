import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
  loading?: boolean
}

const variantStyles = {
  primary:   'bg-text text-bg hover:bg-text/90',
  accent:    'bg-accent text-bg hover:bg-accent-strong',
  secondary: 'bg-surface text-text border border-border hover:border-border-strong',
  ghost:     'bg-transparent text-text-muted hover:text-text',
}

const sizeStyles = {
  sm: 'h-8  px-3 text-xs rounded-md',
  md: 'h-10 px-4 text-sm rounded-md',
  lg: 'h-12 px-5 text-[15px] rounded-lg',
}

export function Button({
  variant = 'primary', size = 'md', full, loading, children, disabled, className = '', ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 font-medium transition-colors
        disabled:bg-surface disabled:text-text-disabled disabled:cursor-not-allowed disabled:border-border
        ${variantStyles[variant]} ${sizeStyles[size]} ${full ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </>
      ) : children}
    </button>
  )
}
