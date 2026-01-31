import crypto from "crypto"

export default function hashString(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex")
}
