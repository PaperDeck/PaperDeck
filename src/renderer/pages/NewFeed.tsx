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
import { useForm, Controller } from "react-hook-form"

interface FormData {
  url: string
}

export default function NewFeed() {
  const { t } = useTranslation()
  const [isButtonDisabled, setIsButtonDisabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const feedParser = useFeedParser()
  const { control, handleSubmit } = useForm({
    defaultValues: {
      url: "",
    },
  })
  const handleAddFeed = async (data: FormData) => {
    console.log("Add feed:", data.url)
    let result = null
    setIsLoading(true)
    try {
      result = await feedParser(data.url)
    } catch (_) {
      toast.error(t("feedParsingFailed"))
    }
    setIsLoading(false)
    console.log("Parsed feed:", result)
  }
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="flex flex-col px-5 py-10 w-full max-w-md">
        <div className="flex flex-col items-center">
          <CardTitle className="text-lg">{t("newFeed")}</CardTitle>
          <CardDescription>{t("newFeedDescription")}</CardDescription>
        </div>
        <CardContent>
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
                    setIsButtonDisabled(e.target.value === "")
                  }}
                />
              )}
            />

            <Button
              className="w-full mt-4"
              disabled={isLoading || isButtonDisabled}
              type="submit"
            >
              {isLoading ? t("loading") : t("next")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
