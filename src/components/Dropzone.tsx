import { useEffect, useRef, useState } from 'react'

interface Props {
  onFiles: (files: File[]) => void
}

const isImage = (f: File) => f.type.startsWith('image/')

export default function Dropzone({ onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  // لصق بـ Ctrl+V
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter(isImage)
      if (files.length) onFiles(files)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [onFiles])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const files = Array.from(e.dataTransfer.files).filter(isImage)
        if (files.length) onFiles(files)
      }}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
        dragging
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-slate-300 hover:border-emerald-500 dark:border-slate-700'
      }`}
    >
      <p className="text-lg font-semibold">اسحب الصور هنا، أو اضغط للاختيار</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        تقدر كمان تلصق صورة بـ Ctrl+V — JPG / PNG / WebP
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []).filter(isImage)
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
