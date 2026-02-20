import axios from "axios"
import type { AxiosResponse } from "axios"

async function fetchImage(url: string) {
  const response: AxiosResponse = await axios.get(url, {
    responseType: "arraybuffer",
  })
  Buffer.from(response.data, "binary").toString("base64")
  const contentType = response.headers["content-type"]
  const base64Data = Buffer.from(response.data, "binary").toString("base64")
  return `data:${contentType};base64,${base64Data}`
}

export default fetchImage
