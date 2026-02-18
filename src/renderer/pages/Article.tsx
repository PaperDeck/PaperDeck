import { useParams } from "react-router"
import useArticles from "@/renderer/hooks/useArticles"
import DOMPurify from "dompurify"
import parse from "html-react-parser"
import { useOpenInBrowser } from "@/renderer/hooks/useApi"
import type { DOMNode } from "html-react-parser"
import type { ChildNode } from "domhandler"
import { cn } from "@/renderer/lib/utils"

function isUrl(str: string): boolean {
  try {
    new URL(decodeURIComponent(str))
    return true
  } catch {
    return false
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
        <div className="flex flex-col gap-5 mt-3 mb-10">
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
            },
          })}
        </div>
      </div>
    </div>
  )
}
