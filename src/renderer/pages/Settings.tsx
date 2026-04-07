import { useNavigate } from "react-router"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
export default function Settings() {
  const navigate = useNavigate()
  const handleBackClick = () => navigate(-1)
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center w-full mt-14">
      <div className="flex flex-col gap-2 w-md">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-1 text-gray-600 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
        >
          <ArrowLeft size={16} />
          {t("back")}
        </button>
        <h1 className="text-3xl font-bold">{t("settings")}</h1>
      </div>
    </div>
  )
}
