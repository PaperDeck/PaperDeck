export default function extractText(html: string): string {
  if (!html) return ""

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")

  let text = doc.body.textContent || ""
  text = text.replace(/\s+/g, "").trim()

  return text
}
