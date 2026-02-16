import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "@/renderer/i18n/en/translation.json"

const resources = {
  en: {
    translation: en,
  },
}

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  resources: resources,
})

export default i18n
