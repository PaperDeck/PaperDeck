import { shell } from "electron"
export default function openInBrowser(url: string) {
  shell.openExternal(url)
}
