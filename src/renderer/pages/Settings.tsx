import { useNavigate } from "react-router"
import {
  ArrowLeft,
  Sun,
  Moon,
  Settings as SettingsIcon,
  EllipsisVertical,
  SquareArrowOutUpRight,
  Trash2,
  FileOutput,
  Import,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import useDataStorage from "@/renderer/hooks/useDataStorage"
import useFeeds from "@/renderer/hooks/useFeeds"
import useArticles from "@/renderer/hooks/useArticles"
import { useOpenInBrowser } from "@/renderer/hooks/useApi"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
} from "@/renderer/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/renderer/components/ui/alert-dialog"
import type { IDataStorage } from "@/shared/types/dataStorage"
import { Button } from "@/renderer/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/renderer/components/ui/tooltip"
import IconButton from "@/renderer/components/IconButton"
import { Plus } from "lucide-react"
import NewFeed from "@/renderer/components/NewFeed"
import type { Feed } from "@/schema"
import {
  useArticleService,
  useFeedService,
  useImportExportService,
} from "@/renderer/hooks/useApi"
import toast from "react-hot-toast"

type DeleteFeedDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  feedTitle: string
  onConfirm: () => Promise<void>
  isLoading?: boolean
}

function DeleteFeedDialog({
  isOpen,
  onOpenChange,
  feedTitle,
  onConfirm,
  isLoading,
}: DeleteFeedDialogProps) {
  const { t } = useTranslation()
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {t("deleteFeedTitle", { feedTitle })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteFeedDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const handleBackClick = () => navigate(-1)
  const { t } = useTranslation()
  const { theme, setTheme, filterType } = useDataStorage()
  const { feeds, isLoading, getFeeds } = useFeeds()
  const { getArticles, fetchArticles } = useArticles()
  const [isNewFeedDialogOpen, setIsNewFeedDialogOpen] = useState(false)
  const [isDeleteFeedDialogOpen, setIsDeleteFeedDialogOpen] = useState(false)
  const [feedToDelete, setFeedToDelete] = useState<Feed | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const articleService = useArticleService()
  const feedService = useFeedService()
  const importExportService = useImportExportService()
  const openInBrowser = useOpenInBrowser()
  const feedList = feeds ?? []
  const hasFeeds = feedList.length > 0

  useEffect(() => {
    getFeeds()
  }, [getFeeds])

  const isTheme = (value: string): value is IDataStorage["theme"] => {
    return ["light", "dark", "system"].includes(value)
  }
  const handleThemeChange = (newTheme: string) => {
    if (isTheme(newTheme)) {
      setTheme(newTheme)
    }
  }
  const handleExport = async () => {
    setIsExporting(true)
    const result = await importExportService.exportToOPMLWithDialog()
    if (!result.success) {
      toast.error(t("exportFailed"))
    }
    setIsExporting(false)
  }
  const handleImport = async () => {
    setIsImporting(true)
    const importResult = await importExportService.importFromOPMLWithDialog()
    if (importResult.data.canceled) {
      setIsImporting(false)
      return
    }
    if (!importResult.success) {
      toast.error(t("importFailed"))
    }

    const importedCount = importResult.data.result.importedCount
    const skippedCount = importResult.data.result.skippedCount
    const totalCount = importResult.data.result.totalCount
    if (totalCount === 0) {
      toast.error(t("importNoFeedsFound"))
      setIsImporting(false)
      return
    }
    toast.success(
      t("importSuccess", {
        importedCount,
        skippedCount,
      }),
    )
    if (importedCount > 0) {
      await getFeeds()
      await fetchArticles({
        preloadBeforeSync: false,
        replace: false,
        append: false,
      })
    }
    setIsImporting(false)
  }
  const handleDeleteFeed = async () => {
    if (!feedToDelete) return

    const result = await feedService.deleteFeed(feedToDelete.url)
    if (result.success) {
      toast.success(t("feedDeleted"))
    } else {
      toast.error(t("feedDeleteFailed"))
      return
    }
    await getFeeds()
    await getArticles({
      articleService,
      ignoreRead: filterType === "unread",
      replace: true,
      append: false,
    })
    setIsDeleteFeedDialogOpen(false)
    setFeedToDelete(null)
  }
  return (
    <div className="flex flex-col items-center w-full mt-14">
      <div className="flex flex-col gap-5 w-md">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-1 text-gray-600 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
        >
          <ArrowLeft size={16} />
          {t("back")}
        </button>
        <h1 className="text-3xl font-bold">{t("settings")}</h1>
        <div>
          <p className="font-bold mb-2">{t("theme")}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {theme === "light" && <Sun size={18} />}
                {theme === "dark" && <Moon size={18} />}
                {theme === "system" && <SettingsIcon size={18} />}
                <span>{t(theme)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={handleThemeChange}
              >
                <DropdownMenuRadioItem value="light">
                  <Sun size={16} className="mr-2" />
                  {t("light")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon size={16} className="mr-2" />
                  {t("dark")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <SettingsIcon size={16} className="mr-2" />
                  {t("system")}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div>
          <div className="flex items-center mb-3">
            <p className="font-bold">{t("feedsManagement")}</p>
            <div className="ml-auto flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconButton
                    onClick={handleImport}
                    disabled={isImporting}
                    aria-label={t("importFromOPML")}
                  >
                    <Import size={24} />
                  </IconButton>
                </TooltipTrigger>
                <TooltipContent>{t("importFromOPML")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconButton
                    onClick={handleExport}
                    disabled={isExporting}
                    aria-label={t("exportToOPML")}
                  >
                    <FileOutput size={24} />
                  </IconButton>
                </TooltipTrigger>
                <TooltipContent>{t("exportToOPML")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconButton
                    onClick={() => setIsNewFeedDialogOpen(true)}
                    aria-label={t("newFeed")}
                  >
                    <Plus size={24} />
                  </IconButton>
                </TooltipTrigger>
                <TooltipContent>{t("newFeed")}</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {!isLoading && !hasFeeds && (
            <p className="text-sm text-gray-500">{t("noFeeds")}</p>
          )}
          {hasFeeds && (
            <ul className="space-y-2 mb-5">
              {feedList.map((feed) => (
                <li
                  key={feed.url}
                  className="rounded-md border border-gray-200 dark:border-gray-700 p-3"
                >
                  <div className="flex">
                    <div className="flex-1">
                      <p className="font-medium break-all mb-1">{feed.title}</p>
                      <p className="text-sm text-gray-500 break-all">
                        {feed.url}
                      </p>
                    </div>
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <IconButton aria-label={t("moreOptions")}>
                              <EllipsisVertical size={18} />
                            </IconButton>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("moreOptions")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent
                        className="w-full"
                        onCloseAutoFocus={(e) => e.preventDefault()}
                      >
                        <DropdownMenuItem
                          onClick={() => openInBrowser(feed.url)}
                          aria-label={t("openInBrowser")}
                        >
                          <SquareArrowOutUpRight size={16} className="mr-1" />
                          {t("openInBrowser")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setFeedToDelete(feed)
                            setIsDeleteFeedDialogOpen(true)
                          }}
                          aria-label={t("delete")}
                          variant="destructive"
                        >
                          <Trash2 size={16} className="mr-1" />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <NewFeed
          isOpen={isNewFeedDialogOpen}
          onOpenChange={setIsNewFeedDialogOpen}
          onFeedAdded={async () => {
            await getFeeds()
            await getArticles({
              articleService,
              ignoreRead: filterType === "unread",
              replace: true,
              append: false,
            })
            setIsNewFeedDialogOpen(false)
          }}
        />
        <DeleteFeedDialog
          isOpen={isDeleteFeedDialogOpen}
          onOpenChange={setIsDeleteFeedDialogOpen}
          feedTitle={feedToDelete?.title || ""}
          onConfirm={handleDeleteFeed}
        />
      </div>
    </div>
  )
}
