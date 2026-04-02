export default function normalizeHttpUrl(input: string): string {
  let parsed: URL
  try {
    parsed = new URL(input)
  } catch {
    throw new TypeError("Invalid URL")
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new TypeError("Only HTTP/HTTPS URLs are supported")
  }

  return parsed.toString()
}
