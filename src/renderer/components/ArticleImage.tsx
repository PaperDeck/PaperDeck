import { useState } from "react"
import { cn } from "@/renderer/lib/utils"
import { Skeleton } from "@/renderer/components/ui/skeleton"
import { TriangleAlert, RefreshCcw } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/renderer/components/ui/tooltip"
import IconButton from "@/renderer/components/IconButton"
import { useTranslation } from "react-i18next"

interface ArticleImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt?: string
  caption?: string
}

export default function ArticleImage({
  src,
  alt,
  caption,
  className,
  ...props
}: ArticleImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState<{
    source: string
    timestamp: number
  } | null>(null)
  const [hasError, setHasError] = useState(false)
  const { t } = useTranslation()
  const effectiveSrc =
    reloadToken?.source === src
      ? appendTimestamp(src, reloadToken.timestamp)
      : src
  const isLoaded = loadedSrc === effectiveSrc

  const handleLoad = () => {
    setLoadedSrc(effectiveSrc)
    console.log(`Image loaded: ${effectiveSrc}`)
  }

  const handleError = () => {
    setHasError(true)
  }

  const handleReloadImage = () => {
    setHasError(false)
    setLoadedSrc(null)
    setReloadToken({ source: src, timestamp: Date.now() })
  }

  return (
    <>
      {hasError ? (
        <span
          className={cn(
            "w-full rounded h-48 border flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 my-3",
            className,
          )}
        >
          <TriangleAlert size={24} className="mb-2" />
          <p className="mb-3">{t("failedToLoadImage")}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                onClick={handleReloadImage}
                aria-label={t("reloadImage")}
              >
                <RefreshCcw size={24} />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>{t("reloadImage")}</TooltipContent>
          </Tooltip>
        </span>
      ) : (
        <span className="flex flex-col gap-3 relative w-full">
          {!isLoaded && (
            <Skeleton className={cn("w-full h-48 rounded my-3", className)} />
          )}
          <img
            key={effectiveSrc}
            src={effectiveSrc}
            className={cn(
              "max-w-full rounded mt-3",
              !isLoaded && "absolute inset-0 opacity-0",
              className,
            )}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
          {caption && (
            <span className="text-sm text-center mb-2 text-gray-500 dark:text-gray-400">
              {caption}
            </span>
          )}
        </span>
      )}
    </>
  )
}

function appendTimestamp(src: string, timestamp: number) {
  const hashIndex = src.indexOf("#")
  const hash = hashIndex >= 0 ? src.slice(hashIndex) : ""
  const baseSrc = hashIndex >= 0 ? src.slice(0, hashIndex) : src
  const separator = baseSrc.includes("?") ? "&" : "?"

  return `${baseSrc}${separator}t=${timestamp}${hash}`
}
