import { zipSync } from 'fflate'

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function zipBlobs(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const entries: Record<string, Uint8Array> = {}
  const used = new Set<string>()
  for (const f of files) {
    let name = f.name
    let i = 1
    while (used.has(name)) name = f.name.replace(/(\.[^.]+)$/, `-${i++}$1`)
    used.add(name)
    entries[name] = new Uint8Array(await f.blob.arrayBuffer())
  }
  // الصور مضغوطة أصلاً، فمفيش فايدة من level أعلى من 0.
  const zipped = zipSync(entries, { level: 0 })
  return new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' })
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}
