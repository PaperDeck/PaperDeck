import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/renderer/components/ui/card"
import { Input } from "@/renderer/components/ui/input"
import { Button } from "../components/ui/button"

export default function NewFeed() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="flex flex-col px-5 py-10 w-full max-w-md">
        <div className="flex flex-col items-center">
          <CardTitle className="text-lg">{t("newFeed")}</CardTitle>
          <CardDescription>{t("newFeedDescription")}</CardDescription>
        </div>
        <CardContent>
          <Input placeholder="https://example.com/rss" className="w-full" />
          <Button className="w-full mt-4">{t("next")}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
