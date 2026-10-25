import { useEffect, useRef, useState } from 'react'

interface Props {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onCommit: (v: number) => void
}

/**
 * Slider بيعرض القيمة لحظياً أثناء السحب، لكن بيبعت القيمة لفوق (onCommit)
 * لما المستخدم يسيب الـ slider بس، عشان مانعمل معالجة صور مع كل حركة.
 */
export default function CommitSlider({ label, value, min, max, step = 10, onCommit }: Props) {
  const [local, setLocal] = useState(value)
  const localRef = useRef(value)

  // لو القيمة اتغيرت من بره (reset مثلاً)
  useEffect(() => {
    setLocal(value)
    localRef.current = value
  }, [value])

  const commit = () => {
    if (localRef.current !== value) onCommit(localRef.current)
  }

  return (
    <div>
      <label className="mb-1 flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span dir="ltr" className="tabular-nums">{local}px</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={local}
        onChange={(e) => {
          const v = Number(e.target.value)
          localRef.current = v
          setLocal(v)
        }}
        onPointerUp={commit}
        onPointerCancel={commit}
        onKeyUp={commit}
        onBlur={commit}
        className="w-full accent-emerald-600"
      />
    </div>
  )
}
