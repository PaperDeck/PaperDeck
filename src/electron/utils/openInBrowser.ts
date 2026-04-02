import { shell } from "electron"
import normalizeHttpUrl from "@/shared/utils/normalizeHttpUrl"

export default function openInBrowser(url: string) {
  shell.openExternal(normalizeHttpUrl(url.trim()))
}
