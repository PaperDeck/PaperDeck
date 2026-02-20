import { useLayoutEffect, useRef } from "react"

function useScrollRestoration(pageKey: string) {
  const scrollRef = useRef(0)
  useLayoutEffect(() => {
    const scrollArea = document.querySelector(
      "[data-radix-scroll-area-viewport]",
    )
    const savedScrollY = sessionStorage.getItem(pageKey) || "0"
    if (!scrollArea) {
      console.warn("Scroll area not found for scroll restoration.")
      return
    }
    scrollArea.scrollTo(0, parseInt(savedScrollY))
    sessionStorage.removeItem(pageKey)
    return () => {
      if (
        !scrollArea ||
        "scrollTop" in scrollArea === false ||
        typeof scrollArea.scrollTop !== "number"
      ) {
        console.warn(
          "Scroll area does not support scrollY for scroll restoration.",
        )
        return
      }
      scrollRef.current = scrollArea.scrollTop
      sessionStorage.setItem(pageKey, scrollRef.current.toString())
    }
  }, [pageKey])
}

export default useScrollRestoration
