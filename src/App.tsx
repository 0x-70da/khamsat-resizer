import { useCallback, useRef, useState } from 'react'
import Dropzone from './components/Dropzone'
import ImageCard, { type Item, type Processed } from './components/ImageCard'
import Settings from './components/Settings'
import { DEFAULT_CUSTOM_SIZE, PRESET_LIST, type CustomSize, type PresetKey } from './lib/presets'
import CustomSizePanel from './components/CustomSizePanel'
import type { ResizeOptions } from './lib/resize'
import { saveBlob, zipBlobs } from './lib/download'

const DEFAULT_OPTIONS: ResizeOptions = {
  fit: 'cover',
  focalX: 0.5,
  focalY: 0.5,
  format: 'image/jpeg',
  quality: 0.9,
  background: 'white',
}

export default function App() {
  const [items, setItems] = useState<Item[]>([])
  const [defaultPreset, setDefaultPreset] = useState<PresetKey>('main')
  const [options, setOptions] = useState<ResizeOptions>(DEFAULT_OPTIONS)
  const [customSize, setCustomSize] = useState<CustomSize>(DEFAULT_CUSTOM_SIZE)
  const [zipping, setZipping] = useState(false)
  const results = useRef(new Map<string, Processed>())

  const addFiles = useCallback(
    (files: File[]) => {
      setItems((prev) => [
        ...prev,
        ...files.map((file) => ({ id: crypto.randomUUID(), file, preset: defaultPreset })),
      ])
    },
    [defaultPreset],
  )

  const onResult = useCallback((id: string, r: Processed | null) => {
    if (r) results.current.set(id, r)
    else results.current.delete(id)
  }, [])

  const remove = (id: string) => {
    results.current.delete(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const setPreset = (id: string, preset: PresetKey) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, preset } : i)))

  const downloadAll = async () => {
    const files = items
      .map((i) => results.current.get(i.id))
      .filter((r): r is Processed => !!r)
      .map((r) => ({ name: r.filename, blob: r.blob }))
    if (!files.length) return
    setZipping(true)
    try {
      saveBlob(await zipBlobs(files), 'khamsat-images.zip')
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">أداة صور خمسات 🖼️</h1>
        <p className="text-slate-500 dark:text-slate-400">
          غيّر أبعاد صور خدمتك لتناسب خمسات مباشرة من المتصفح. الصور مش بتتبعت لأي سيرفر، المعالجة كلها على جهازك.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">النوع الافتراضي للصور الجديدة:</span>
        {PRESET_LIST.map((p) => (
          <button
            key={p.key}
            onClick={() => setDefaultPreset(p.key)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              defaultPreset === p.key
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-slate-300 hover:border-emerald-500 dark:border-slate-700'
            }`}
          >
            {p.label}{' '}
            <span dir="ltr" className="opacity-70">
              {p.key === 'custom' ? `${customSize.width}×${customSize.height}` : `${p.width}×${p.height}`}
            </span>
          </button>
        ))}
      </div>

      {(defaultPreset === 'custom' || items.some((i) => i.preset === 'custom')) && (
        <CustomSizePanel value={customSize} onChange={setCustomSize} />
      )}

      <Dropzone onFiles={addFiles} />
      <Settings value={options} onChange={setOptions} />

      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{items.length} صورة</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  results.current.clear()
                  setItems([])
                }}
                className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                مسح الكل
              </button>
              <button
                onClick={downloadAll}
                disabled={zipping}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900"
              >
                {zipping ? 'جاري التجهيز…' : 'تحميل الكل (ZIP)'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <ImageCard
                key={item.id}
                item={item}
                options={options}
                customSize={customSize}
                onPreset={setPreset}
                onRemove={remove}
                onResult={onResult}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
