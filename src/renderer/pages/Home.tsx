import { useTranslation } from "react-i18next"
import NewFeed from "@/renderer/components/NewFeed"
import { Button } from "@/renderer/components/ui/button"
import { useState } from "react"

export default function Home() {
  const { t } = useTranslation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const openDialog = () => setIsDialogOpen(true)
  return (
    <>
      <h1 className="text-2xl text-center">{t("greeting")}</h1>
      <Button onClick={openDialog}>New Feed</Button>
      <NewFeed isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  )
}
