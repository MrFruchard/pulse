import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm text-gray-400">{label}</label>
      )}
      <input
        {...props}
        className={`bg-gray-900 border rounded-lg px-3 py-2.5 text-sm text-gray-100
          placeholder-gray-600 outline-none transition
          ${error ? 'border-red-500 focus:border-red-400' : 'border-gray-700 focus:border-gray-500'}
          ${className}`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
