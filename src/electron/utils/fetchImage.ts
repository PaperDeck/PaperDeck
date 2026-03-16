import axios from "axios"
import type { AxiosResponse } from "axios"

async function fetchImage(url: string, timeout: number = 10000) {
  const response: AxiosResponse = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: timeout,
  })
  Buffer.from(response.data, "binary").toString("base64")
  const contentType = response.headers["content-type"]
  const base64Data = Buffer.from(response.data, "binary").toString("base64")
  return `data:${contentType};base64,${base64Data}`
}

export default fetchImage
