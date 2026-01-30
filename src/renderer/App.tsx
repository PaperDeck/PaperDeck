import "./style.css"
import { useTranslation } from "react-i18next"

function App() {
  const { t } = useTranslation()
  return (
    <>
      <h1 className="text-2xl text-center">{t("greeting")}</h1>
    </>
  )
}

export default App
