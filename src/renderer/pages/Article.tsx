import { useParams } from "react-router"
import useArticles from "@/renderer/hooks/useArticles"
import DOMPurify from "dompurify"
import parse from "html-react-parser"
import { useOpenInBrowser } from "@/renderer/hooks/useApi"
import type { DOMNode } from "html-react-parser"
import type { ChildNode } from "domhandler"
import { cn } from "@/renderer/lib/utils"
import ArticleImage from "@/renderer/components/ArticleImage"
import CodeBlock from "@/renderer/components/CodeBlock"
import useTheme from "@/renderer/hooks/useTheme"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import Blockquote from "@/renderer/components/Blockquote"
import type { ArticleWithFeed } from "@/shared/types/article"

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
  const { articles } = useArticles()
  const article = articles?.find((a) => a.id === decodedId)
  const openInBrowser = useOpenInBrowser()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  if (!articles) {
    //TODO: Show loading state
    return <></>
  }
  if (!article) {
    //TODO: Show article not found state
    return <></>
  }
  const cleanContent = DOMPurify.sanitize(article.content || "")
  return (
    <div className="flex flex-col items-center mt-10">
      <div className="flex flex-col max-w-xl px-5">
        <button
          onClick={() => navigate("/articles")}
          className="self-start mb-5 text-gray-600 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
        >
          &larr; {t("back")}
        </button>
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
        <div className="flex flex-col text-wrap gap-5 mt-3 mb-10">
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
                const language =
                  domNode.attribs.class?.split("language-")[1] || "plaintext"
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
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">
                    {codeText}
                  </code>
                )
              }
              if (domNode.type === "tag" && domNode.tagName === "blockquote") {
                return <Blockquote>{getTextFromNode(domNode)}</Blockquote>
              }
            },
          })}
        </div>
      </div>
    </div>
  )
}
