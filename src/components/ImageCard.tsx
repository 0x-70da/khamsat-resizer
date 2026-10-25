import { useEffect, useState } from 'react'
import { PRESET_LIST, resolvePreset, type CustomSize, type PresetKey } from '../lib/presets'
import { EXTENSIONS, loadBitmap, resizeImage, type ResizeOptions } from '../lib/resize'
import { formatBytes, saveBlob } from '../lib/download'

export interface Item {
  id: string
  file: File
  preset: PresetKey
}

export interface Processed {
  blob: Blob
  filename: string
}

interface Props {
  item: Item
  options: ResizeOptions
  customSize: CustomSize
  onPreset: (id: string, preset: PresetKey) => void
  onRemove: (id: string) => void
  onResult: (id: string, result: Processed | null) => void
}

export default function ImageCard({ item, options, customSize, onPreset, onRemove, onResult }: Props) {
  const preset = resolvePreset(item.preset, customSize)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [size, setSize] = useState(0)
  const [upscaled, setUpscaled] = useState(false)
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [filename, setFilename] = useState('')
  const [blob, setBlob] = useState<Blob | null>(null)

  // الرابط بيتعمل جوه الـ effect (مش useMemo) عشان StrictMode بيعمل cleanup وإعادة تشغيل،
  // ولو الرابط اتلغى في الـ cleanup وفضل في الـ state الصورة بتبوظ.
  useEffect(() => {
    const url = URL.createObjectURL(item.file)
    setOriginalUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [item.file])

  useEffect(() => {
    let cancelled = false
    let url: string | null = null
    setStatus('loading')

    const timer = setTimeout(async () => {
      try {
        const bitmap = await loadBitmap(item.file)
        const res = await resizeImage(bitmap, preset, options)
        bitmap.close()
        if (cancelled) return
        const base = item.file.name.replace(/\.[^.]+$/, '')
        const name = `${base}-${preset.key}-${preset.width}x${preset.height}.${EXTENSIONS[options.format]}`
        url = URL.createObjectURL(res.blob)
        setResultUrl(url)
        setBlob(res.blob)
        setSize(res.blob.size)
        setUpscaled(res.upscaled)
        setUsedFallback(res.usedFallback)
        setFilename(name)
        setStatus('done')
        onResult(item.id, { blob: res.blob, filename: name })
      } catch (err) {
        console.error(err)
        if (cancelled) return
        setStatus('error')
        onResult(item.id, null)
      }
    }, 150) // debounce لما المستخدم يحرك الـ sliders

    return () => {
      cancelled = true
      clearTimeout(timer)
      if (url) URL.revokeObjectURL(url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.file, item.id, item.preset, preset.width, preset.height, options])

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-px bg-slate-200 sm:grid-cols-2 dark:bg-slate-800">
        <figure className="bg-white p-3 dark:bg-slate-900">
          <figcaption className="mb-2 text-xs text-slate-500">قبل</figcaption>
          {originalUrl && (
            <img src={originalUrl} alt="الأصلية" className="aspect-video w-full rounded-lg bg-slate-100 object-contain dark:bg-slate-800" />
          )}
        </figure>
        <figure className="bg-white p-3 dark:bg-slate-900">
          <figcaption className="mb-2 text-xs text-slate-500">
            بعد — {preset.width}×{preset.height}
          </figcaption>
          <div className="relative">
            {resultUrl ? (
              <img
                src={resultUrl}
                alt="الناتج"
                className={`w-full rounded-lg ${status === 'loading' ? 'opacity-50' : ''}`}
                style={{ aspectRatio: `${preset.width} / ${preset.height}` }}
              />
            ) : (
              <div
                className="w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
                style={{ aspectRatio: `${preset.width} / ${preset.height}` }}
              />
            )}
          </div>
        </figure>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800" role="group" aria-label="نوع الصورة">
          {PRESET_LIST.map((p) => (
            <button
              key={p.key}
              onClick={() => onPreset(item.id, p.key)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                item.preset === p.key
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="min-w-0 flex-1 text-xs text-slate-500 dark:text-slate-400">
          <p className="truncate" dir="ltr">{item.file.name}</p>
          {status === 'done' && <p>الحجم: {formatBytes(item.file.size)} ← {formatBytes(size)}</p>}
          {status === 'error' && <p className="text-red-500">حصلت مشكلة في معالجة الصورة</p>}
          {usedFallback && status === 'done' && (
            <p className="text-amber-600 dark:text-amber-400">
              ℹ️ اتعالجت بطريقة المتصفح العادية لأن حماية الـ fingerprinting شغالة. لو الصورة طالعة مشوشة أو فاضية، عطّلها للموقع ده.
            </p>
          )}
          {upscaled && status === 'done' && (
            <p className="text-amber-600 dark:text-amber-400">
              ⚠️ الصورة الأصلية أصغر من المطلوب، فهتتكبر وجودتها هتقل
            </p>
          )}
        </div>

        <button
          disabled={!blob || status !== 'done'}
          onClick={() => blob && saveBlob(blob, filename)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
        >
          تحميل
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="حذف"
        >
          ✕
        </button>
      </div>
    </article>
  )
}
