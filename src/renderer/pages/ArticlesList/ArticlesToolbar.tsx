import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Check,
  ListFilter,
  MailCheck,
  Plus,
  RefreshCcw,
  Settings,
} from "lucide-react"
import { useInView } from "react-intersection-observer"
import IconButton from "@/renderer/components/IconButton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/renderer/components/ui/tooltip"
import { cn } from "@/renderer/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import NewFeed from "@/renderer/components/NewFeed"
import type { SyncResult } from "@/electron/services/feedSyncService"

type ArticlesToolbarProps = {
  articleCount: number
  fetchResult: SyncResult | null
  filterType: "all" | "unread"
  isLoading: boolean
  onFilterChange: (filter: "all" | "unread") => Promise<void>
  onMarkAllAsRead: () => Promise<void>
  onRefresh: () => Promise<void>
  handleSettingsClick: () => void
}

export default function ArticlesToolbar({
  articleCount,
  fetchResult,
  filterType,
  isLoading,
  onFilterChange,
  onMarkAllAsRead,
  onRefresh,
  handleSettingsClick,
}: ArticlesToolbarProps) {
  const { t } = useTranslation()
  const [isMarkReadDialogOpen, setIsMarkReadDialogOpen] = useState(false)
  const [isNewFeedDialogOpen, setIsNewFeedDialogOpen] = useState(false)
  const { ref: refreshAnchorRef, inView: isRefreshAnchorInView } = useInView({
    threshold: 0,
  })
  const showStickyRefreshButton = !isRefreshAnchorInView

  return (
    <>
      <div ref={refreshAnchorRef} className="flex mb-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton
              onClick={onRefresh}
              disabled={isLoading || !fetchResult}
            >
              <RefreshCcw
                size={32}
                className={
                  isLoading || !fetchResult ? "animate-spin opacity-50" : ""
                }
              />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>{t("refreshFeeds")}</TooltipContent>
        </Tooltip>
      </div>
      <div className="sticky top-0 z-20 bg-zinc-50 dark:bg-zinc-900 py-3 flex gap-1 justify-between w-md mb-1">
        <div className="flex gap-1">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <IconButton>
                    <ListFilter size={24} />
                  </IconButton>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{t("filterArticles")}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              className="flex flex-col whitespace-nowrap w-40"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuItem
                className={cn(filterType === "all" && "font-bold")}
                onSelect={() => onFilterChange("all")}
              >
                <Check
                  size={16}
                  className={filterType === "all" ? "" : "opacity-0"}
                />
                {t("allArticles")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(filterType === "unread" && "font-bold")}
                onSelect={() => onFilterChange("unread")}
              >
                <Check
                  size={16}
                  className={filterType === "unread" ? "" : "opacity-0"}
                />
                {t("unreadArticles")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger
              asChild
              className={cn(
                (filterType === "all" || isLoading || articleCount === 0) &&
                  "invisible",
              )}
            >
              <IconButton onClick={() => setIsMarkReadDialogOpen(true)}>
                <MailCheck size={24} />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>{t("markAllRead")}</TooltipContent>
          </Tooltip>
          <AlertDialog
            open={isMarkReadDialogOpen}
            onOpenChange={setIsMarkReadDialogOpen}
          >
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogMedia>
                  <MailCheck />
                </AlertDialogMedia>
                <AlertDialogTitle>{t("areYouSure")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("markAllAsReadConfirmation")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={onMarkAllAsRead}>
                  {t("confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {showStickyRefreshButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                onClick={onRefresh}
                disabled={isLoading || !fetchResult}
              >
                <RefreshCcw
                  size={24}
                  className={
                    isLoading || !fetchResult ? "animate-spin opacity-50" : ""
                  }
                />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>{t("refreshFeeds")}</TooltipContent>
          </Tooltip>
        )}
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton>
                <Settings size={24} onClick={handleSettingsClick} />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>{t("settings")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton onClick={() => setIsNewFeedDialogOpen(true)}>
                <Plus size={24} />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>{t("newFeed")}</TooltipContent>
          </Tooltip>
        </div>
        <NewFeed
          isOpen={isNewFeedDialogOpen}
          onOpenChange={setIsNewFeedDialogOpen}
        />
      </div>
    </>
  )
}
