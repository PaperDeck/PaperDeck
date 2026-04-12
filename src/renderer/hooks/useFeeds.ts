import type { Feed } from "@/../generated/prisma/browser"
import { useCallback, useState } from "react"
import { useFeedService } from "@/renderer/hooks/useApi"

interface UseFeedsReturn {
  feeds: Feed[] | null
  isLoading: boolean
  getFeeds: () => Promise<void>
}

export default function useFeeds(): UseFeedsReturn {
  const feedService = useFeedService()
  const [feeds, setFeeds] = useState<Feed[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getFeeds = useCallback(async () => {
    setIsLoading(true)

    const result = await feedService.getFeeds()
    if (!result.success) {
      console.error("Failed to fetch feeds:", result.error)
      setFeeds(null)
      setIsLoading(false)
      return
    }

    setFeeds(result.data)
    setIsLoading(false)
  }, [feedService])

  return {
    feeds,
    isLoading,
    getFeeds,
  }
}
