import { useRef, useLayoutEffect } from "react"

function useScrollAreaRef() {
  const ref = useRef<Element | null>(null)

  useLayoutEffect(() => {
    const scrollArea = document.querySelector(
      "[data-radix-scroll-area-viewport]",
    )
    if (scrollArea) {
      ref.current = scrollArea
    } else {
      console.warn("Scroll area not found for virtualizer.")
    }
  }, [])

  return ref
}

export default useScrollAreaRef
