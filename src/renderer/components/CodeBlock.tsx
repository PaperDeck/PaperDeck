import ShikiHighlighter from "react-shiki"
import { ScrollArea } from "@/renderer/components/ui/scroll-area"
import { cn } from "../lib/utils"

interface CodeBlockProps {
  code: string
  language: string
  theme: "dark" | "light"
  className?: string
}

function CodeBlock({ code, language, theme, className }: CodeBlockProps) {
  // TODO: Allow user to choose theme
  const shikiTheme = theme === "dark" ? "one-dark-pro" : "ayu-light"
  return (
    <ScrollArea className="max-w-full" horizontal>
      <ShikiHighlighter
        language={language}
        theme={shikiTheme}
        className={cn("whitespace-pre-wrap", className)}
      >
        {code}
      </ShikiHighlighter>
    </ScrollArea>
  )
}

export default CodeBlock
