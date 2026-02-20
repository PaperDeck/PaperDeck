import { useFetchImage } from "@/renderer/hooks/useApi"
import { useState, useEffect } from "react"
import { cn } from "@/renderer/lib/utils"
import { Skeleton } from "@/renderer/components/ui/skeleton"

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
  const [displaySrc, setDisplaySrc] = useState<string | null>(null)
  const fetchImage = useFetchImage()
  useEffect(() => {
    const loadImage = async () => {
      try {
        const result = await fetchImage(src)
        if (!result.success) {
          console.error("Failed to fetch image:", result.error)
          return
        }
        setDisplaySrc(result.data)
      } catch (error) {
        console.error("Failed to load image:", error)
      }
    }
    loadImage()
  }, [src, fetchImage])
  if (!displaySrc) {
    return <Skeleton className={cn("w-full h-48 rounded my-3", className)} />
  }
  return (
    <img
      src={displaySrc}
      alt={alt || ""}
      className={cn("max-w-full rounded my-3", className)}
      {...props}
    ></img>
  )
}
