import { useTranslation } from "react-i18next"
import { Input } from "@/renderer/components/ui/input"
import { Button } from "@/renderer/components/ui/button"
import { Dialog } from "@/renderer/components/ui/dialog"
import { Skeleton } from "@/renderer/components/ui/skeleton"
import { useEffect, useState } from "react"
import {
  useFeedParser,
  useArticleService,
  useFeedService,
} from "@/renderer/hooks/useApi"
import axios from "axios"
import { useForm, Controller, useWatch } from "react-hook-form"
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/renderer/components/ui/dialog"
import { Rss } from "lucide-react"
import type { Feed } from "@/electron/services/feed/types"
import truncateText from "@/renderer/utils/truncateText"
import { toast } from "react-hot-toast"

interface FormData {
  url: string
}

function isUrl(str: string) {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

export default function NewFeed({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [parseSuccess, setParseSuccess] = useState<boolean | null>(null)
  const [feedResult, setFeedResult] = useState<Feed | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const feedParser = useFeedParser()
  const articleService = useArticleService()
  const feedService = useFeedService()
  const { control, handleSubmit } = useForm({
    defaultValues: {
      url: "",
    },
  })
  const handleAddFeed = (data: FormData) => {
    console.log("Adding feed with URL:", data.url)
    if (!feedResult) {
      console.error("No feed result available to add.")
      return
    }
    setIsAdding(true)
    const addFeed = async () => {
      try {
        const newFeed = await feedService.addFeed(feedResult.title, data.url)
        if (feedResult) {
          await articleService.saveArticles(newFeed.url, feedResult.items)
        }
        onOpenChange(false)
      } catch (_) {
        toast.error(t("failedToAddFeed"))
      } finally {
        setIsAdding(false)
      }
    }
    addFeed()
  }
  const url = useWatch({
    control,
    name: "url",
  })
  useEffect(() => {
    setFeedResult(null)
    setParseSuccess(null)
    if (url === "" || !isUrl(url)) {
      return
    }
    const controller = new AbortController()
    const fetchFeed = async () => {
      setIsLoading(true)
      setFeedResult(null)
      try {
        const result = await feedParser(url, 5000, controller.signal)
        setParseSuccess(true)
        setFeedResult(result)
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error(error)
          setParseSuccess(false)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }
    const timer = setTimeout(() => {
      fetchFeed()
    }, 500)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [feedParser, t, url])
  return (
    <div className="flex items-center justify-center overflow-y-auto max-w-md">
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90%] overflow-y-auto">
          <div className="flex flex-col items-center">
            <Rss className="w-12 h-12 mb-4" />
            <DialogTitle className="text-lg">{t("newFeed")}</DialogTitle>
            <DialogDescription>{t("newFeedDescription")}</DialogDescription>
          </div>
          <form onSubmit={handleSubmit(handleAddFeed)}>
            <Controller
              name="url"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="https://example.com/rss"
                  className="w-full"
                  readOnly={isLoading}
                  {...field}
                  onChange={(e) => {
                    e.target.value = e.target.value.trim()
                    field.onChange(e)
                  }}
                />
              )}
            />
            {isLoading && (
              <div className="flex flex-col gap-2 my-3 p-3 shadow bg-gray-50">
                <Skeleton className="w-32 h-5"></Skeleton>
                <Skeleton className="w-16 h-5 mb-1"></Skeleton>
                <ul>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Skeleton key={n} className="h-10 mb-3 rounded"></Skeleton>
                  ))}
                </ul>
              </div>
            )}
            {feedResult && (
              <div className="flex flex-col gap-2 my-3 p-3 shadow bg-gray-50">
                <h2 className="font-bold text-xl">{feedResult.title}</h2>
                <p className="text-sm text-gray-500">{feedResult.link}</p>
                <hr></hr>
                <p className="font-bold">{t("recentArticles")}</p>
                {feedResult.items.length === 0 && (
                  <p className="text-sm text-gray-500">
                    {t("noArticlesFound")}
                  </p>
                )}
                <ul>
                  {feedResult.items.slice(0, 5).map((article) => (
                    <li
                      key={article.id}
                      className="mb-3 shadow p-2 rounded bg-white"
                    >
                      <div className="text-lg">{article.title}</div>
                      <div>{truncateText(article.summary, 50)}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {parseSuccess === false && (
              <p className="text-sm text-red-500 mt-2">
                {t("feedParsingFailed")}
              </p>
            )}
            <Button
              className="w-full mt-4"
              disabled={isLoading || !parseSuccess || !feedResult || isAdding}
              type="submit"
            >
              {isAdding ? t("adding") : t("add")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
