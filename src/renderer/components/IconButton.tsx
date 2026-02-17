import type { ReactNode } from "react"
interface IconButtonProps {
  children: ReactNode
  [key: string]: unknown
}
export default function IconButton({ children, ...props }: IconButtonProps) {
  return (
    <button
      className="flex items-center justify-center p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:pointer-events-none transition-colors duration-200"
      {...props}
    >
      {children}
    </button>
  )
}
