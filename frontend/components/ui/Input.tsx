import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={`h-11 bg-surface border rounded-md px-3.5 text-sm text-text
            placeholder:text-text-faint font-sans outline-none transition-colors
            focus:border-accent focus:ring-1 focus:ring-accent/30
            ${error ? 'border-danger' : 'border-border'}
            ${className}`}
        />
        {error && <span className="text-xs text-danger">{error}</span>}
        {hint && !error && <span className="text-xs text-text-faint">{hint}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'
