import { useNavigate } from "react-router"
import { ArrowLeft, Sun, Moon, Settings as SettingsIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import useDataStorage from "@/renderer/hooks/useDataStorage"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/renderer/components/ui/dropdown-menu"
import type { IDataStorage } from "@/shared/types/dataStorage"
import { Button } from "@/renderer/components/ui/button"

export default function Settings() {
  const navigate = useNavigate()
  const handleBackClick = () => navigate(-1)
  const { t } = useTranslation()
  const { theme, setTheme } = useDataStorage()
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
      </div>
    </div>
  )
}
