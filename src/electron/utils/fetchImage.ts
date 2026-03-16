import axios from "axios"
import type { AxiosResponse } from "axios"
import normalizeHttpUrl from "@/shared/utils/normalizeHttpUrl"

async function fetchImage(url: string, timeout: number = 10000) {
  const safeUrl = normalizeHttpUrl(url)
  const response: AxiosResponse = await axios.get(safeUrl, {
    responseType: "arraybuffer",
    timeout: timeout,
  })
  const contentType = response.headers["content-type"]
  const base64Data = Buffer.from(response.data, "binary").toString("base64")
  return `data:${contentType};base64,${base64Data}`
}

export default fetchImage
