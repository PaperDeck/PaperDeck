import { useFetchImage } from "@/renderer/hooks/useApi"
import { useState } from "react"
import { cn } from "@/renderer/lib/utils"
import { Skeleton } from "@/renderer/components/ui/skeleton"
import pLimit from "p-limit"
import { useOnInView } from "react-intersection-observer"

const DEFAULT_IMAGE_CONCURRENCY_LIMIT = 5
const imageFetchLimit = pLimit(DEFAULT_IMAGE_CONCURRENCY_LIMIT)

interface ArticleImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt?: string
}

export default function ArticleImage({
  src,
  alt,
  className,
  ...props
}: ArticleImageProps) {
  const [loadedImage, setLoadedImage] = useState<{
    source: string
    displaySrc: string
  } | null>(null)
  const fetchImage = useFetchImage()

  const inViewRef = useOnInView(
    async () => {
      const result = await imageFetchLimit(() => fetchImage(src))

      if (!result.success) {
        console.error("Failed to fetch image:", result.error)
        return
      }
      setLoadedImage({
        source: src,
        displaySrc: result.data,
      })
    },
    {
      triggerOnce: true,
    },
  )

  if (!loadedImage || loadedImage.source !== src) {
    return (
      <Skeleton
        className={cn("w-full h-48 rounded my-3", className)}
        ref={inViewRef}
      />
    )
  }

  return (
    <img
      src={loadedImage.displaySrc}
      alt={alt || ""}
      className={cn("max-w-full rounded my-3", className)}
      {...props}
    ></img>
  )
}
