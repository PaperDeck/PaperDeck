import { useTranslation } from "react-i18next"
import NewFeed from "@/renderer/components/NewFeed"
import { Button } from "@/renderer/components/ui/button"
import { useState } from "react"
import { Link } from "react-router"
import { useTheme } from "@/renderer/hooks/useTheme"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/renderer/components/ui/dropdown-menu"

export default function Home() {
  const { t } = useTranslation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const openDialog = () => setIsDialogOpen(true)
  const { setTheme, theme } = useTheme()
  return (
    <div className="flex flex-col items-center pt-10 gap-5">
      <h1 className="text-2xl text-center">{t("greeting")}</h1>
      <Button onClick={openDialog}>New Feed</Button>
      <NewFeed isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Link to="/articles">Go to Articles</Link>
    </div>
  )
}
