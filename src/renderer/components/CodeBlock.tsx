import { useEffect, useRef, useState } from "react"
import ShikiHighlighter from "react-shiki"
import { ScrollArea } from "@/renderer/components/ui/scroll-area"
import { cn } from "@/renderer/lib/utils"
import { Copy, Check } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/renderer/components/ui/tooltip"
import IconButton from "@/renderer/components/IconButton"
import { useTranslation } from "react-i18next"
interface CodeBlockProps {
  code: string
  language: string
  theme: "dark" | "light"
  className?: string
}

function CodeBlock({ code, language, theme, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current)
      }
    }
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)

    if (copiedTimeoutRef.current) {
      clearTimeout(copiedTimeoutRef.current)
    }

    copiedTimeoutRef.current = setTimeout(() => {
      setCopied(false)
    }, 1500)
  }

  // TODO: Allow user to choose theme
  const shikiTheme = theme === "dark" ? "one-dark-pro" : "ayu-light"
  return (
    <div className="group relative max-w-full">
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton
            type="button"
            onClick={handleCopy}
            aria-label={copied ? t("codeBlockCopyDone") : t("codeBlockCopy")}
            className="absolute right-2 top-5 z-10 opacity-0 group-hover:opacity-60 transition-opacity bg-white/80 hover:bg-white hover:opacity-100 dark:bg-zinc-900/80 dark:hover:bg-zinc-900"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </IconButton>
        </TooltipTrigger>
        <TooltipContent>
          {copied ? t("codeBlockCopyDone") : t("codeBlockCopy")}
        </TooltipContent>
      </Tooltip>

      <ScrollArea className="max-w-full" horizontal>
        <ShikiHighlighter
          language={language}
          theme={shikiTheme}
          className={cn("whitespace-pre-wrap", className)}
        >
          {code}
        </ShikiHighlighter>
      </ScrollArea>
    </div>
  )
}

export default CodeBlock
