// src/utils/image.ts
export function makeDataUrl(rawVal: string): string {
  if (!rawVal) return ''
  if (rawVal.startsWith('data:')) return rawVal
  return `data:image/png;base64,${rawVal}`
}
