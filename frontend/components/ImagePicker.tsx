'use client'

import { useRef, useState } from 'react'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif']
const MAX_MB = 5

interface ImagePickerProps {
  onUpload: (url: string) => void
  label?: string
}

export function ImagePicker({ onUpload, label = 'Ajouter une image' }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    if (!ACCEPTED.includes(file.type)) {
      setError('Format non supporté — JPEG, PNG ou GIF uniquement.')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Fichier trop lourd — max ${MAX_MB}MB.`)
      return
    }

    // Prévisualisation locale immédiate
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setLoading(true)

    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/uploads', {
        method: 'POST',
        credentials: 'include',
        body: form,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur upload' }))
        throw new Error(err.error)
      }

      const data = await res.json() as { url: string }
      onUpload(data.url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload')
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  function handleRemove() {
    setPreview(null)
    setError('')
    onUpload('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-1">
      {preview ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="max-h-40 rounded-lg object-cover border border-gray-700" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <span className="text-xs text-white">Upload...</span>
            </div>
          )}
          {!loading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full text-xs flex items-center justify-center hover:bg-black transition"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-gray-500 hover:text-gray-300 border border-dashed border-gray-700 hover:border-gray-600 rounded-lg px-3 py-2 transition w-fit"
        >
          {label}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={handleChange}
        className="hidden"
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
