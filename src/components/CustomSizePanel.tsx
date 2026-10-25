import { CUSTOM_MAX, CUSTOM_MIN, type CustomSize } from '../lib/presets'
import CommitSlider from './CommitSlider'

interface Props {
  value: CustomSize
  onChange: (v: CustomSize) => void
}

export default function CustomSizePanel({ value, onChange }: Props) {
  return (
    <section className="grid gap-4 rounded-2xl border border-emerald-600/40 bg-white p-4 sm:grid-cols-2 dark:bg-slate-900">
      <CommitSlider
        label="العرض"
        value={value.width}
        min={CUSTOM_MIN}
        max={CUSTOM_MAX}
        onCommit={(width) => onChange({ ...value, width })}
      />
      <CommitSlider
        label="الارتفاع"
        value={value.height}
        min={CUSTOM_MIN}
        max={CUSTOM_MAX}
        onCommit={(height) => onChange({ ...value, height })}
      />
      <p className="text-xs text-slate-500 sm:col-span-2 dark:text-slate-400">
        الأبعاد الحالية: <span dir="ltr">{value.width}×{value.height}</span> — النتيجة بتتحدث لما تسيب الـ slider.
      </p>
    </section>
  )
}
