import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/renderer/components/ui/card"
import { Input } from "@/renderer/components/ui/input"
import { Button } from "@/renderer/components/ui/button"
import { useState } from "react"
import { useFeedParser } from "../hooks/useApi"
import { toast } from "react-hot-toast"

export default function NewFeed() {
  const { t } = useTranslation()
  const [feedUrl, setFeedUrl] = useState("")
  const [isButtonDisabled, setIsButtonDisabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const feedParser = useFeedParser()
  const handleAddFeed = async () => {
    console.log("Add feed:", feedUrl)
    let result = null
    setIsLoading(true)
    try {
      result = await feedParser(feedUrl)
    } catch (_) {
      toast.error(t("feedParsingFailed"))
    }
    setIsLoading(false)
    console.log("Parsed feed:", result)
  }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedUrl(e.target.value.trim())
    setIsButtonDisabled(e.target.value.trim() === "")
  }
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="flex flex-col px-5 py-10 w-full max-w-md">
        <div className="flex flex-col items-center">
          <CardTitle className="text-lg">{t("newFeed")}</CardTitle>
          <CardDescription>{t("newFeedDescription")}</CardDescription>
        </div>
        <CardContent>
          <Input
            value={feedUrl}
            onChange={handleInputChange}
            placeholder="https://example.com/rss"
            className="w-full"
            readOnly={isLoading}
          />
          <Button
            className="w-full mt-4"
            onClick={handleAddFeed}
            disabled={isButtonDisabled || isLoading}
          >
            {isLoading ? t("loading") : t("next")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
