export type PresetKey = 'main' | 'gallery' | 'custom'

export interface Preset {
  key: PresetKey
  label: string
  width: number
  height: number
}

// الأبعاد المطلوبة في خمسات — راجعها دايماً من صفحة إضافة الخدمة لأنها ممكن تتغير.
export const PRESETS: Record<PresetKey, Preset> = {
  main: { key: 'main', label: 'الصورة الرئيسية', width: 1700, height: 970 },
  gallery: { key: 'gallery', label: 'معرض الأعمال', width: 800, height: 460 },
  // أبعاد custom بتيجي من الـ sliders (CustomSize في App)، دي قيم افتراضية بس.
  custom: { key: 'custom', label: 'مخصص', width: 1200, height: 700 },
}

export interface CustomSize {
  width: number
  height: number
}

export const DEFAULT_CUSTOM_SIZE: CustomSize = { width: 1200, height: 700 }
export const CUSTOM_MIN = 100
export const CUSTOM_MAX = 4000

export function resolvePreset(key: PresetKey, custom: CustomSize): Preset {
  return key === 'custom' ? { ...PRESETS.custom, ...custom } : PRESETS[key]
}

export const PRESET_LIST = Object.values(PRESETS)
