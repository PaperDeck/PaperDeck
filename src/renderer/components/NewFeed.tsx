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
import { useForm, Controller, useWatch } from "react-hook-form"
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/renderer/components/ui/dialog"
import { Rss } from "lucide-react"
import truncateText from "@/shared/utils/truncateText"
import { toast } from "react-hot-toast"
import extractText from "@/renderer/utils/extractText"
import type Parser from "rss-parser"
import { ScrollArea } from "@/renderer/components/ui/scroll-area"

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
  const [feedResult, setFeedResult] =
    useState<Parser.Output<Parser.Item> | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const feedParser = useFeedParser()
  const articleService = useArticleService()
  const feedService = useFeedService()
  const { control, handleSubmit, setValue } = useForm({
    defaultValues: {
      url: "",
    },
  })
  const handleDialogOpenChange = (open: boolean) => {
    if (isAdding && !open) {
      return
    }
    onOpenChange(open)
    if (!open) {
      setFeedResult(null)
      setParseSuccess(null)
      setIsLoading(false)
      setValue("url", "")
    }
  }
  const handleAddFeed = (data: FormData) => {
    if (!feedResult) {
      console.error("No feed result available to add.")
      return
    }
    setIsAdding(true)
    const addFeed = async () => {
      const newFeed = await feedService.addFeed(
        feedResult.title || "",
        data.url,
      )
      if (!newFeed.success) {
        if (newFeed.error.code === "P2002") {
          toast.error(t("feedAlreadyExists"))
        } else {
          toast.error(t("failedToAddFeed"))
          console.error("Failed to add feed:", newFeed.error)
        }
        setIsAdding(false)
        return
      }
      const result = await articleService.saveArticles(
        data.url,
        feedResult.items,
      )
      if (!result.success) {
        console.error("Failed to save articles for the new feed:", result.error)
      }
      handleDialogOpenChange(false)
      toast.success(t("feedAdded"))
      setIsAdding(false)
    }
    addFeed()
  }
  const url = useWatch({
    control,
    name: "url",
  })
  useEffect(() => {
    if (url === "" || !isUrl(url)) {
      return
    }
    let isCurrentRequest = true
    const fetchFeed = async () => {
      setIsLoading(true)
      setFeedResult(null)
      const result = await feedParser(url, 10000)
      if (result.success) {
        setParseSuccess(true)
      } else {
        setParseSuccess(false)
      }
      if (isCurrentRequest) {
        setIsLoading(false)
        setFeedResult(result.data)
      }
    }
    const timer = setTimeout(() => {
      fetchFeed()
    }, 500)
    return () => {
      isCurrentRequest = false
      clearTimeout(timer)
    }
  }, [feedParser, t, url])
  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100">
          <ScrollArea className="max-h-[80vh] flex flex-col items-center">
            <div className="flex flex-col items-center">
              <Rss className="w-12 h-12 mb-4" />
              <DialogTitle className="text-lg">{t("newFeed")}</DialogTitle>
              <DialogDescription className="mb-4">
                {t("newFeedDescription")}
              </DialogDescription>
            </div>
            <form onSubmit={handleSubmit(handleAddFeed)} className="px-1">
              <Controller
                name="url"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="https://example.com/rss"
                    className="w-full max-w-md"
                    {...field}
                    onChange={(e) => {
                      e.target.value = e.target.value.trim()
                      setFeedResult(null)
                      setParseSuccess(null)
                      field.onChange(e)
                    }}
                  />
                )}
              />
              {isLoading && (
                <div className="flex flex-col gap-2 my-3 p-3 shadow bg-gray-50 dark:bg-neutral-700">
                  <Skeleton className="w-32 h-5"></Skeleton>
                  <Skeleton className="w-16 h-5 mb-1"></Skeleton>
                  <ul>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Skeleton
                        key={n}
                        className="h-10 mb-3 rounded"
                      ></Skeleton>
                    ))}
                  </ul>
                </div>
              )}
              {feedResult && (
                <div className="flex flex-col gap-2 my-3 p-3 shadow bg-gray-50 dark:bg-neutral-700">
                  <h2 className="font-bold text-xl text-gray-900 dark:text-gray-100">
                    {feedResult.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {feedResult.link}
                  </p>
                  <hr></hr>
                  <p className="font-bold dark:text-gray-100">
                    {t("recentArticles")}
                  </p>
                  {feedResult.items.length === 0 && (
                    <p className="text-sm text-gray-500">
                      {t("noArticlesFound")}
                    </p>
                  )}
                  <ul>
                    {feedResult.items.slice(0, 5).map((article) => (
                      <li
                        key={article.guid || article.link}
                        className="mb-3 shadow p-2 rounded bg-white dark:bg-neutral-800"
                      >
                        <div className="text-lg mb-3 text-gray-900 dark:text-gray-100">
                          {article.title}
                        </div>
                        <div className="text-gray-700 dark:text-gray-300">
                          {truncateText(
                            extractText(
                              article.summary || article.contentSnippet || "",
                            ),
                            50,
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {parseSuccess === false && (
                <p className="text-sm text-red-500 mt-2 dark:text-red-400">
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
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
