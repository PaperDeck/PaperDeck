import type { ReactNode } from "react"
import { cn } from "@/renderer/lib/utils"
interface IconButtonProps {
  children: ReactNode
  className?: string
  [key: string]: unknown
}
export default function IconButton({
  children,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center justify-center p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:pointer-events-none transition-colors duration-200",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
