import createPica from 'pica'
import type { Preset } from './presets'

export type FitMode = 'cover' | 'contain' | 'stretch'
export type OutFormat = 'image/jpeg' | 'image/webp' | 'image/png'
export type Background = 'white' | 'black' | 'blur'

export interface ResizeOptions {
  fit: FitMode
  /** 0 = أعلى/يسار ، 0.5 = وسط ، 1 = أسفل/يمين (بيأثر في cover بس) */
  focalX: number
  focalY: number
  format: OutFormat
  quality: number
  background: Background
}

export interface ResizeResult {
  blob: Blob
  width: number
  height: number
  /** الصورة الأصلية أصغر من المطلوب فهتتكبر وتقل جودتها */
  upscaled: boolean
  /** pica مقدرتش تشتغل (حماية fingerprinting) فاستخدمنا resize المتصفح العادي */
  usedFallback: boolean
}

interface Flags {
  fallback: boolean
}

// pica بتدير Web Workers لوحدها، فنعمل instance واحد مشترك.
const pica = createPica()

let picaUnavailable = false

/** تصغير بالمتصفح نفسه (من غير قراءة بكسلات): خطوات نص-نص عشان الجودة. */
function nativeResize(from: HTMLCanvasElement, to: HTMLCanvasElement) {
  let cur = from
  while (cur.width / 2 >= to.width && cur.height / 2 >= to.height) {
    const next = makeCanvas(Math.max(to.width, Math.round(cur.width / 2)), Math.max(to.height, Math.round(cur.height / 2)))
    const c = next.getContext('2d')!
    c.imageSmoothingQuality = 'high'
    c.drawImage(cur, 0, 0, next.width, next.height)
    cur = next
  }
  const ctx = to.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.clearRect(0, 0, to.width, to.height)
  ctx.drawImage(cur, 0, 0, to.width, to.height)
}

async function resizeCanvas(from: HTMLCanvasElement, to: HTMLCanvasElement, flags: Flags) {
  if (!picaUnavailable) {
    try {
      await pica.resize(from, to, { filter: 'lanczos3' })
      return
    } catch (err) {
      if ((err as { code?: string }).code !== 'ERR_GET_IMAGE_DATA') throw err
      picaUnavailable = true
    }
  }
  flags.fallback = true
  nativeResize(from, to)
}

export const EXTENSIONS: Record<OutFormat, string> = {
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/png': 'png',
}

export async function loadBitmap(file: Blob): Promise<ImageBitmap> {
  // from-image: بيحترم EXIF orientation (صور الموبايل)
  return createImageBitmap(file, { imageOrientation: 'from-image' })
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/** بيحسب المستطيل اللي هيتقص من الأصل عشان يطابق نسبة الهدف. */
export function computeCoverCrop(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  focalX: number,
  focalY: number,
) {
  const srcRatio = srcW / srcH
  const dstRatio = dstW / dstH
  let sw = srcW
  let sh = srcH
  if (srcRatio > dstRatio) sw = Math.round(srcH * dstRatio)
  else sh = Math.round(srcW / dstRatio)
  const sx = Math.round((srcW - sw) * focalX)
  const sy = Math.round((srcH - sh) * focalY)
  return { sx, sy, sw, sh }
}

async function drawCover(
  bitmap: ImageBitmap,
  out: HTMLCanvasElement,
  opts: ResizeOptions,
  flags: Flags,
) {
  const { sx, sy, sw, sh } = computeCoverCrop(
    bitmap.width,
    bitmap.height,
    out.width,
    out.height,
    opts.focalX,
    opts.focalY,
  )
  // نقص الجزء المطلوب بالدقة الأصلية، وبعدين pica تصغّره/تكبّره بجودة عالية.
  const cropped = makeCanvas(sw, sh)
  cropped.getContext('2d')!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh)
  await resizeCanvas(cropped, out, flags)
  return sw < out.width || sh < out.height
}

async function drawContain(
  bitmap: ImageBitmap,
  out: HTMLCanvasElement,
  opts: ResizeOptions,
  flags: Flags,
) {
  const ctx = out.getContext('2d')!

  // الخلفية
  if (opts.background === 'blur') {
    const bg = makeCanvas(out.width, out.height)
    const crop = computeCoverCrop(bitmap.width, bitmap.height, out.width, out.height, 0.5, 0.5)
    bg.getContext('2d')!.drawImage(bitmap, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, out.width, out.height)
    ctx.filter = 'blur(28px) brightness(0.8)'
    ctx.drawImage(bg, -40, -40, out.width + 80, out.height + 80)
    ctx.filter = 'none'
  } else {
    ctx.fillStyle = opts.background === 'black' ? '#000' : '#fff'
    ctx.fillRect(0, 0, out.width, out.height)
  }

  const scale = Math.min(out.width / bitmap.width, out.height / bitmap.height)
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const src = makeCanvas(bitmap.width, bitmap.height)
  src.getContext('2d')!.drawImage(bitmap, 0, 0)
  const scaled = makeCanvas(w, h)
  await resizeCanvas(src, scaled, flags)

  ctx.drawImage(scaled, Math.round((out.width - w) / 2), Math.round((out.height - h) / 2))
  return scale > 1
}

async function drawStretch(
  bitmap: ImageBitmap,
  out: HTMLCanvasElement,
  flags: Flags,
) {
  // تمطيط الصورة كلها على الأبعاد المطلوبة من غير الحفاظ على النسبة (بيشوّه الصورة لو النسب مختلفة)
  const src = makeCanvas(bitmap.width, bitmap.height)
  src.getContext('2d')!.drawImage(bitmap, 0, 0)
  await resizeCanvas(src, out, flags)
  return bitmap.width < out.width || bitmap.height < out.height
}

export async function resizeImage(
  bitmap: ImageBitmap,
  preset: Pick<Preset, 'width' | 'height'>,
  opts: ResizeOptions,
): Promise<ResizeResult> {
  const out = makeCanvas(preset.width, preset.height)
  const flags: Flags = { fallback: false }
  const upscaled =
    opts.fit === 'cover'
      ? await drawCover(bitmap, out, opts, flags)
      : opts.fit === 'contain'
        ? await drawContain(bitmap, out, opts, flags)
        : await drawStretch(bitmap, out, flags)

  // JPEG مفيهوش شفافية: نحط الصورة على خلفية بيضاء عشان الشفاف ميطلعش أسود.
  let final = out
  if (opts.format === 'image/jpeg') {
    final = makeCanvas(out.width, out.height)
    const fctx = final.getContext('2d')!
    fctx.fillStyle = '#fff'
    fctx.fillRect(0, 0, final.width, final.height)
    fctx.drawImage(out, 0, 0)
  }
  const blob = await pica.toBlob(final, opts.format, opts.quality)
  return { blob, width: final.width, height: final.height, upscaled, usedFallback: flags.fallback }
}
