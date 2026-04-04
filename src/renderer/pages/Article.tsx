import { Navigate, useParams } from "react-router"
import useArticles from "@/renderer/hooks/useArticles"
import DOMPurify from "dompurify"
import parse from "html-react-parser"
import { useOpenInBrowser, useArticleService } from "@/renderer/hooks/useApi"
import type { DOMNode } from "html-react-parser"
import type { ChildNode } from "domhandler"
import { cn } from "@/renderer/lib/utils"
import ArticleImage from "@/renderer/components/ArticleImage"
import CodeBlock from "@/renderer/components/CodeBlock"
import useDataStorage from "@/renderer/hooks/useDataStorage"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import Blockquote from "@/renderer/components/Blockquote"
import type { ArticleWithFeed } from "@/shared/types/article"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  EllipsisVertical,
  SquareArrowOutUpRight,
} from "lucide-react"
import IconButton from "@/renderer/components/IconButton"
import {
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuItem,
} from "@/renderer/components/ui/dropdown-menu"
import { BellDot } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/renderer/components/ui/tooltip"
import toast from "react-hot-toast"

function isUrl(str: string): boolean {
  try {
    new URL(decodeURIComponent(str))
    return true
  } catch {
    return false
  }
}

function getDomainFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.hostname
  } catch {
    return url
  }
}
function getProtocolFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol
  } catch {
    return ""
  }
}

const LANGUAGE_ALIAS_MAP: Record<string, string> = {
  "c++": "cpp",
  csharp: "c#",
  cs: "c#",
  golang: "go",
  js: "javascript",
  jsx: "jsx",
  md: "markdown",
  py: "python",
  rb: "ruby",
  rs: "rust",
  sh: "bash",
  shell: "bash",
  ts: "typescript",
  yml: "yaml",
}

function normalizeLanguageToken(token: string): string | undefined {
  const normalized = token
    .trim()
    .toLowerCase()
    .replace(/[{}()[\],]/g, "")
    .replace(/^\.+/, "")

  if (!normalized) return
  return LANGUAGE_ALIAS_MAP[normalized] ?? normalized
}

function getLanguageFromClassString(
  classString: string | undefined,
): string | undefined {
  if (!classString) return

  const classNames = classString
    .split(/\s+/)
    .map((name) => name.trim())
    .filter(Boolean)

  for (const className of classNames) {
    const normalizedClass = className.toLowerCase().trim()

    const matchedPrefix = normalizedClass.match(
      /^(?:language|lang|grammar|syntax)-([a-z0-9_+#.-]+)$/,
    )
    if (matchedPrefix) {
      const normalized = normalizeLanguageToken(matchedPrefix[1])
      if (normalized) return normalized
    }

    const matchedHighlight = normalizedClass.match(/^hljs-([a-z0-9_+#.-]+)$/)
    if (matchedHighlight) {
      const normalized = normalizeLanguageToken(matchedHighlight[1])
      if (normalized) return normalized
    }

    const matchedPrettyPrint = normalizedClass.match(/^lang-([a-z0-9_+#.-]+)$/)
    if (matchedPrettyPrint) {
      const normalized = normalizeLanguageToken(matchedPrettyPrint[1])
      if (normalized) return normalized
    }
  }

  const brushMatch = classString.match(/brush\s*:\s*([a-z0-9_+#.-]+)/i)
  if (brushMatch) {
    return normalizeLanguageToken(brushMatch[1])
  }

  return
}

function detectCodeLanguage(domNode: DOMNode): string {
  if (domNode.type !== "tag") return "plaintext"

  const ownClass = domNode.attribs.class
  const ownDataLanguage =
    domNode.attribs["data-language"] ?? domNode.attribs["data-lang"]
  const ownLanguage = domNode.attribs.language

  const ownDetected =
    getLanguageFromClassString(ownClass) ??
    normalizeLanguageToken(ownDataLanguage ?? "") ??
    normalizeLanguageToken(ownLanguage ?? "")
  if (ownDetected) return ownDetected

  const firstChild = domNode.children?.[0]
  if (firstChild?.type === "tag") {
    const childDetected =
      getLanguageFromClassString(firstChild.attribs.class) ??
      normalizeLanguageToken(
        firstChild.attribs["data-language"] ??
          firstChild.attribs["data-lang"] ??
          "",
      ) ??
      normalizeLanguageToken(firstChild.attribs.language ?? "")
    if (childDetected) return childDetected
  }

  return "plaintext"
}

function handleImage(domNode: DOMNode, article: ArticleWithFeed) {
  if (domNode.type !== "tag" || domNode.tagName !== "img") {
    return
  }
  const src = domNode.attribs.src
  let imageSrc
  if (src) {
    if (src.startsWith("http://") || src.startsWith("https://")) {
      imageSrc = src
    } else {
      const feedLink = article.feed.url
      imageSrc = `${getProtocolFromUrl(feedLink)}//${getDomainFromUrl(feedLink)}${src.startsWith("/") ? "" : "/"}${src}`
    }
  }
  if (imageSrc) {
    return <ArticleImage src={imageSrc} alt={domNode.attribs.alt} />
  }
}

function resolveResourceUrl(
  src: string | undefined,
  article: ArticleWithFeed,
): string | undefined {
  if (!src) return

  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return src
  }

  try {
    const resolvedUrl = new URL(src, article.feed.url)
    if (resolvedUrl.protocol === "http:" || resolvedUrl.protocol === "https:") {
      return resolvedUrl.href
    }
    return
  } catch {
    return
  }
}

function getTextFromNode(
  node: DOMNode | ChildNode,
  opts: { shouldRemoveHeadingAnchor?: boolean } = {},
): string {
  const { shouldRemoveHeadingAnchor = false } = opts
  if (!node) return ""
  if (
    shouldRemoveHeadingAnchor &&
    node.type === "tag" &&
    node.tagName === "a" &&
    node.attribs.href.startsWith("#")
  ) {
    return ""
  }
  if (node.type === "text") return (node.data ?? "") as string
  if ("children" in node && node.children && node.children.length) {
    return node.children.map((child) => getTextFromNode(child, opts)).join("")
  }
  return ""
}

export default function Article() {
  const { id } = useParams<{ id: string }>()
  const decodedId = decodeURIComponent(id || "")
  const { articles, markArticleAsRead, markArticleAsUnread } = useArticles()
  const article = useMemo(() => {
    if (!articles) return null
    return articles.find((a) => a.id === decodedId) || null
  }, [articles, decodedId])
  const openInBrowser = useOpenInBrowser()
  const articleService = useArticleService()
  const { theme, filterType } = useDataStorage()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [articleContent, setArticleContent] = useState<string | null>(null)
  const markedAsRead = useRef<boolean>(false)

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  useEffect(() => {
    const markRead = async () => {
      if (article && !article.isRead && !markedAsRead.current) {
        markedAsRead.current = true
        const result = await articleService.markArticleAsRead(article.id)
        if (result.success) {
          await markArticleAsRead(article.id)
        } else {
          console.error("Failed to mark article as read:", result.error)
        }
      }
    }
    markRead()
  }, [article, articleService, markArticleAsRead, t])
  useEffect(() => {
    const fetchContent = async () => {
      const result = await articleService.getArticleContentById(decodedId)
      if (result.success) {
        setArticleContent(result.data.content)
      } else {
        console.error("Failed to fetch article content:", result.error)
      }
    }
    fetchContent()
  }, [decodedId, articleService])
  const cleanContent = useMemo(
    () => DOMPurify.sanitize(articleContent || ""),
    [articleContent],
  )

  if (!articles) {
    return <></>
  }
  if (!article) {
    console.error("Article not found:", decodedId)
    return <Navigate to="/articles" replace></Navigate>
  }

  const handleBackClick = () => navigate("/articles")
  const handleViewOriginalClick = () => openInBrowser(article.link)
  const handleMarkAsUnreadClick = async () => {
    const result = await articleService.markArticleAsUnread(article.id)
    if (result.success) {
      await markArticleAsUnread(article.id)
      toast.success(t("markedAsUnread"))
    } else {
      console.error("Failed to mark article as unread:", result.error)
    }
  }

  return (
    <div className="flex flex-col items-center mt-10">
      <div className="flex flex-col w-xl px-5">
        <div className="flex sticky top-0 z-20 bg-zinc-50 dark:bg-zinc-900 py-3">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-1 text-gray-600 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
          >
            <ArrowLeft size={16} />
            {t("back")}
          </button>
          <div className="flex gap-2 ml-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton
                  className={cn(filterType === "all" && "hidden")}
                  disabled={!article.isRead}
                  onClick={handleMarkAsUnreadClick}
                >
                  <BellDot
                    size={18}
                    className={cn(!article.isRead && "opacity-50")}
                  />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>{t("markAsUnread")}</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton>
                  <EllipsisVertical size={18} />
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-full"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuItem onClick={handleViewOriginalClick}>
                  <SquareArrowOutUpRight size={16} className="mr-1" />
                  {t("openInBrowser")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        <div className="flex items-center gap-3">
          {article.pubDate && (
            <p className="text-sm text-gray-600 dark:text-gray-500 mb-4">
              {new Date(article.pubDate).toLocaleDateString()}
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-500 mb-4">
            {article.feed.title}
          </p>
        </div>
        {articleContent && (
          <div className="flex flex-col text-wrap wrap-break-word gap-5 mt-3 mb-10">
            {parse(cleanContent, {
              replace: (domNode) => {
                if (domNode.type === "tag" && domNode.tagName === "a") {
                  const href = domNode.attribs.href
                  const isOk = isUrl(href)
                  if (!isOk) {
                    return (
                      <a className="text-blue-600 dark:text-blue-400">
                        {getTextFromNode(domNode)}
                      </a>
                    )
                  }
                  if (href) {
                    return (
                      <a
                        onClick={(e) => {
                          e.preventDefault()
                          openInBrowser(href)
                        }}
                        className="text-blue-600 dark:text-blue-400"
                      >
                        {getTextFromNode(domNode)}
                      </a>
                    )
                  }
                }
                if (
                  domNode.type === "tag" &&
                  domNode.tagName === "p" &&
                  domNode.children.length > 0 &&
                  domNode.children[0].type === "tag" &&
                  domNode.children[0].tagName === "img"
                ) {
                  return handleImage(domNode.children[0], article)
                }
                if (
                  domNode.type === "tag" &&
                  (domNode.tagName === "h1" ||
                    domNode.tagName === "h2" ||
                    domNode.tagName === "h3" ||
                    domNode.tagName === "h4" ||
                    domNode.tagName === "h5" ||
                    domNode.tagName === "h6")
                ) {
                  const textSize = {
                    h1: "text-2xl",
                    h2: "text-xl",
                    h3: "text-lg",
                    h4: "text-base",
                    h5: "text-sm",
                    h6: "text-sm",
                  }
                  return (
                    <div
                      className={cn(
                        "font-bold mt-4 mb-2",
                        textSize[domNode.tagName],
                      )}
                    >
                      {getTextFromNode(domNode, {
                        shouldRemoveHeadingAnchor: true,
                      })}
                    </div>
                  )
                }
                if (domNode.type === "tag" && domNode.tagName === "img") {
                  return handleImage(domNode, article)
                }
                if (
                  domNode.type === "tag" &&
                  domNode.tagName === "pre" &&
                  domNode.children.length > 0 &&
                  domNode.children[0].type === "tag" &&
                  domNode.children[0].tagName === "code"
                ) {
                  const codeText = getTextFromNode(domNode)
                  const language = detectCodeLanguage(domNode)
                  return (
                    <CodeBlock
                      code={codeText}
                      theme={isDark ? "dark" : "light"}
                      language={language}
                      className="my-3"
                    ></CodeBlock>
                  )
                }
                if (domNode.type === "tag" && domNode.tagName === "code") {
                  const codeText = getTextFromNode(domNode)
                  return (
                    <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded break-all">
                      {codeText}
                    </code>
                  )
                }
                if (
                  domNode.type === "tag" &&
                  domNode.tagName === "blockquote"
                ) {
                  return <Blockquote>{getTextFromNode(domNode)}</Blockquote>
                }
                if (domNode.type === "tag" && domNode.tagName === "svg") {
                  return <div className="my-1"></div>
                }
                if (domNode.type === "tag" && domNode.tagName === "audio") {
                  const mediaSrc = resolveResourceUrl(
                    domNode.attribs.src,
                    article,
                  )
                  return (
                    <audio
                      controls={domNode.attribs.controls !== "false"}
                      autoPlay={domNode.attribs.autoplay !== undefined}
                      muted={domNode.attribs.muted !== undefined}
                      loop={domNode.attribs.loop !== undefined}
                      preload={domNode.attribs.preload || "metadata"}
                      src={mediaSrc}
                      className="w-full my-3"
                    >
                      {domNode.children
                        ?.filter(
                          (child) =>
                            child.type === "tag" && child.name === "source",
                        )
                        .map((child, i) => {
                          if (child.type !== "tag") return null
                          const childSrc = resolveResourceUrl(
                            child.attribs.src,
                            article,
                          )
                          return (
                            <source
                              key={i}
                              src={childSrc}
                              type={child.attribs.type}
                            />
                          )
                        })}
                    </audio>
                  )
                }
                if (domNode.type === "tag" && domNode.tagName === "video") {
                  const mediaSrc = resolveResourceUrl(
                    domNode.attribs.src,
                    article,
                  )
                  const posterSrc = resolveResourceUrl(
                    domNode.attribs.poster,
                    article,
                  )
                  return (
                    <video
                      controls={domNode.attribs.controls !== "false"}
                      autoPlay={domNode.attribs.autoplay !== undefined}
                      muted={domNode.attribs.muted !== undefined}
                      loop={domNode.attribs.loop !== undefined}
                      preload={domNode.attribs.preload || "metadata"}
                      playsInline={domNode.attribs.playsinline !== undefined}
                      poster={posterSrc}
                      src={mediaSrc}
                      className="w-full my-3 rounded-md"
                    >
                      {domNode.children
                        ?.filter(
                          (child) =>
                            child.type === "tag" && child.name === "source",
                        )
                        .map((child, i) => {
                          if (child.type !== "tag") return null
                          const childSrc = resolveResourceUrl(
                            child.attribs.src,
                            article,
                          )
                          return (
                            <source
                              key={i}
                              src={childSrc}
                              type={child.attribs.type}
                            />
                          )
                        })}
                    </video>
                  )
                }
              },
            })}
          </div>
        )}
      </div>
    </div>
  )
}
