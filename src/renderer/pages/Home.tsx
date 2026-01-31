import { useTranslation } from "react-i18next"

function Home() {
  const { t } = useTranslation()
  return (
    <>
      <h1 className="text-2xl text-center">{t("greeting")}</h1>
    </>
  )
}

export default Home
