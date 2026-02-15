import { useTranslation } from "react-i18next"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

const useRelativeTime = () => {
  const { i18n } = useTranslation()

  const fromNow = (date: string | number | Date) => {
    const currentLang = i18n.language.toLowerCase()
    return dayjs(date).locale(currentLang).fromNow()
  }

  return fromNow
}

export default useRelativeTime
