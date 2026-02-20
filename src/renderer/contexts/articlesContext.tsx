import { createContext } from "react"
import type { ArticleWithFeed } from "@/shared/types/article"

type ArticlesListContextType = {
  articles: ArticleWithFeed[] | null
  setArticles: (articles: ArticleWithFeed[]) => void
}
const initialArticleListContext: ArticlesListContextType = {
  articles: [],
  setArticles: () => null,
}

const ArticlesListContext = createContext(initialArticleListContext)

export default ArticlesListContext
