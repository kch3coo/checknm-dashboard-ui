async function toNumberArray(img: Blob | string | number[] | null): Promise<number[]> {
  if (img instanceof Blob) {
    const buf = await img.arrayBuffer()
    return Array.from(new Uint8Array(buf))
  }
  if (typeof img === 'string') {
    // 如果带前缀，去掉前缀；否则就当纯 Base64
    const base64 = img.includes(',') ? img.split(',')[1] : img
    // atob 解码成二进制串
    const binStr = atob(base64)
    // 每个字符的 charCode 就是对应的字节
    return Array.from(binStr).map((ch) => ch.charCodeAt(0))
  }
  if (Array.isArray(img)) {
    return img
  }
  return []
}

export const ImageUtils = {
  toNumberArray
}
