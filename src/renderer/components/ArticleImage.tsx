import { useFetchImage } from "@/renderer/hooks/useApi"
import { useState } from "react"
import { cn } from "@/renderer/lib/utils"
import { Skeleton } from "@/renderer/components/ui/skeleton"
import pLimit from "p-limit"
import { useOnInView } from "react-intersection-observer"
import { TriangleAlert, RefreshCcw } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/renderer/components/ui/tooltip"
import IconButton from "@/renderer/components/IconButton"
import { useTranslation } from "react-i18next"

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
  const [hasError, setHasError] = useState(false)
  const { t } = useTranslation()
  const fetchImage = useFetchImage()
  const loadImage = async () => {
    const result = await imageFetchLimit(() => fetchImage(src))

    if (!result.success) {
      console.error("Failed to fetch image:", result.error)
      setHasError(true)
      return
    }
    setLoadedImage({
      source: src,
      displaySrc: result.data,
    })
  }
  const inViewRef = useOnInView(loadImage, {
    triggerOnce: true,
  })
  const handleReloadImage = () => {
    setHasError(false)
    setLoadedImage(null)
    loadImage()
  }

  return (
    <>
      {hasError ? (
        <div
          className={cn(
            "w-full rounded h-48 border flex flex-col items-center justify-center text-gray-500 dark:text-gray-400",
            className,
          )}
        >
          <TriangleAlert size={24} className="mb-2" />
          <p className="mb-3">{t("failedToLoadImage")}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton onClick={handleReloadImage}>
                <RefreshCcw size={24} />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>{t("reloadImage")}</TooltipContent>
          </Tooltip>
        </div>
      ) : !loadedImage || loadedImage.source !== src ? (
        <Skeleton
          className={cn("w-full h-48 rounded my-3", className)}
          ref={inViewRef}
        />
      ) : (
        <img
          src={loadedImage.displaySrc}
          className={cn("max-w-full rounded mt-3", className)}
          alt={alt}
          onError={() => setHasError(true)}
          {...props}
        />
      )}
      {alt && (
        <p className="text-sm text-center m-3 text-gray-500 dark:text-gray-400">
          {alt}
        </p>
      )}
    </>
  )
}
