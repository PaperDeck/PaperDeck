import { useNavigate } from "react-router"
import {
  ArrowLeft,
  Sun,
  Moon,
  Settings as SettingsIcon,
  EllipsisVertical,
  SquareArrowOutUpRight,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import useDataStorage from "@/renderer/hooks/useDataStorage"
import useFeeds from "@/renderer/hooks/useFeeds"
import { useOpenInBrowser } from "@/renderer/hooks/useApi"
import { useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
} from "@/renderer/components/ui/dropdown-menu"
import type { IDataStorage } from "@/shared/types/dataStorage"
import { Button } from "@/renderer/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/renderer/components/ui/tooltip"
import IconButton from "@/renderer/components/IconButton"
import { Plus } from "lucide-react"
import { useState } from "react"
import NewFeed from "@/renderer/components/NewFeed"

export default function Settings() {
  const navigate = useNavigate()
  const handleBackClick = () => navigate(-1)
  const { t } = useTranslation()
  const { theme, setTheme } = useDataStorage()
  const { feeds, isLoading, getFeeds } = useFeeds()
  const [isNewFeedDialogOpen, setIsNewFeedDialogOpen] = useState(false)
  const openInBrowser = useOpenInBrowser()

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
            <DropdownMenuTrigger>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton
                  onClick={() => setIsNewFeedDialogOpen(true)}
                  aria-label={t("newFeed")}
                  className="ml-auto"
                >
                  <Plus size={24} />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>{t("newFeed")}</TooltipContent>
            </Tooltip>
          </div>

          {!isLoading && (!feeds || feeds.length === 0) && (
            <p className="text-sm text-gray-500">{t("noFeeds")}</p>
          )}
          {!isLoading && feeds && feeds.length > 0 && (
            <ul className="space-y-2">
              {feeds.map((feed) => (
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
          onFeedAdded={() => {
            getFeeds()
            setIsNewFeedDialogOpen(false)
          }}
        />
      </div>
    </div>
  )
}
