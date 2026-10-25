import type { ResizeOptions } from '../lib/resize'

interface Props {
  value: ResizeOptions
  onChange: (v: ResizeOptions) => void
}

const label = 'mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'
const select =
  'w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900'

export default function Settings({ value, onChange }: Props) {
  const set = <K extends keyof ResizeOptions>(k: K, v: ResizeOptions[K]) => onChange({ ...value, [k]: v })

  return (
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <label className={label}>طريقة الملاءمة</label>
        <select className={select} value={value.fit} onChange={(e) => set('fit', e.target.value as ResizeOptions['fit'])}>
          <option value="cover">Cover — قص الزيادة (الأنسب)</option>
          <option value="contain">Contain — الصورة كاملة + خلفية</option>
          <option value="stretch">Stretch — تمطيط (بيشوّه النسبة)</option>
        </select>
      </div>

      {value.fit === 'cover' ? (
        <div>
          <label className={label}>نقطة التركيز (رأسي)</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={value.focalY}
            onChange={(e) => set('focalY', Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>أعلى</span>
            <span>وسط</span>
            <span>أسفل</span>
          </div>
        </div>
      ) : value.fit === 'contain' ? (
        <div>
          <label className={label}>الخلفية</label>
          <select className={select} value={value.background} onChange={(e) => set('background', e.target.value as ResizeOptions['background'])}>
            <option value="white">أبيض</option>
            <option value="black">أسود</option>
            <option value="blur">صورة مموهة (Blur)</option>
          </select>
        </div>
      ) : (
        <div>
          <label className={label}>التمطيط</label>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            الصورة هتتمط على الأبعاد كاملة، فلو نسبتها مختلفة هتبان مشوهة.
          </p>
        </div>
      )}

      <div>
        <label className={label}>الصيغة</label>
        <select className={select} value={value.format} onChange={(e) => set('format', e.target.value as ResizeOptions['format'])}>
          <option value="image/jpeg">JPG</option>
          <option value="image/webp">WebP</option>
          <option value="image/png">PNG</option>
        </select>
      </div>

      <div>
        <label className={label}>الجودة: {Math.round(value.quality * 100)}%</label>
        <input
          type="range"
          min={0.5}
          max={1}
          step={0.05}
          disabled={value.format === 'image/png'}
          value={value.quality}
          onChange={(e) => set('quality', Number(e.target.value))}
          className="w-full accent-emerald-600 disabled:opacity-40"
        />
      </div>
    </section>
  )
}
