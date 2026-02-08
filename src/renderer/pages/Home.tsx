import { useTranslation } from "react-i18next"
import { Link } from "react-router"

export default function Home() {
  const { t } = useTranslation()
  return (
    <>
      <h1 className="text-2xl text-center">{t("greeting")}</h1>
      <Link to="/new">new</Link>
    </>
  )
}
