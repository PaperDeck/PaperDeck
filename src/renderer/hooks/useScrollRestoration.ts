import { useLayoutEffect } from "react"
import useScrollAreaRef from "@/renderer/hooks/useScrollAreaRef"

function useScrollRestoration(pageKey: string, options?: { delay?: number }) {
  const scrollAreaRef = useScrollAreaRef()
  const { delay = 100 } = options || {}
  useLayoutEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    const saved = sessionStorage.getItem(pageKey)
    if (!saved) return

    const target = Number(saved)
    if (isNaN(target) || target <= 0) return
    const restore = () => {
      scrollArea.scrollTop = target
    }

    const frame = requestAnimationFrame(() => {
      restore()
      setTimeout(() => {
        requestAnimationFrame(restore)
        sessionStorage.removeItem(pageKey)
      }, delay)
    })

    return () => cancelAnimationFrame(frame)
  }, [pageKey, delay, scrollAreaRef])
  useLayoutEffect(() => {
    const scrollArea = scrollAreaRef.current
    return () => {
      if (!scrollArea || typeof scrollArea.scrollTop !== "number") {
        console.warn(
          "Scroll area does not support scrollY for scroll restoration.",
        )
        return
      }
      if (scrollArea.scrollTop <= 0) {
        return
      }
      sessionStorage.setItem(pageKey, String(scrollArea.scrollTop))
    }
  }, [pageKey, scrollAreaRef])
}

export default useScrollRestoration
