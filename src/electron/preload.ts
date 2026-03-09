import { contextBridge, ipcRenderer } from "electron"
import type FeedItem from "@/shared/types/feedItem"

const api = {
  articleService: {
    saveArticles: (feedUrl: string, articles: FeedItem[]) =>
      ipcRenderer.invoke("articleService", "saveArticles", feedUrl, articles),
    markArticleAsRead: (articleId: string) =>
      ipcRenderer.invoke("articleService", "markArticleAsRead", articleId),
    deleteAllArticlesByFeedUrl: (feedUrl: string) =>
      ipcRenderer.invoke(
        "articleService",
        "deleteAllArticlesByFeedUrl",
        feedUrl,
      ),
    getAll: (prop: {
      includeFeeds: boolean
      ignoreRead: boolean
      cursor?: {
        id: string
        pubDate: Date
      }
      take?: number
      summaryPreview?: {
        length: number
      }
    }) => ipcRenderer.invoke("articleService", "getAll", prop),
    markAllArticlesAsRead: () =>
      ipcRenderer.invoke("articleService", "markAllArticlesAsRead"),
    getArticleContentById: (articleId: string) =>
      ipcRenderer.invoke("articleService", "getArticleContentById", articleId),
  },
  feedService: {
    addFeed: (title: string, url: string) =>
      ipcRenderer.invoke("feedService", "addFeed", title, url),
    getFeeds: () => ipcRenderer.invoke("feedService", "getFeeds"),
    deleteFeed: (url: string) =>
      ipcRenderer.invoke("feedService", "deleteFeed", url),
    updateFeed: (url: string, title: string) =>
      ipcRenderer.invoke("feedService", "updateFeed", url, title),
  },
  feedSyncService: {
    syncFeeds: () => ipcRenderer.invoke("feedSyncService", "syncFeeds"),
  },
  feedParser: (url: string, timeout?: number) =>
    ipcRenderer.invoke("feedParser", url, timeout),
  dataStorage: {
    getTheme: () => ipcRenderer.invoke("dataStorage", "getTheme"),
    setTheme: (theme: "light" | "dark" | "system") =>
      ipcRenderer.invoke("dataStorage", "setTheme", theme),
    getFilterType: () => ipcRenderer.invoke("dataStorage", "getFilterType"),
    setFilterType: (filterType: "all" | "unread") =>
      ipcRenderer.invoke("dataStorage", "setFilterType", filterType),
  },
  openInBrowser: (url: string) => ipcRenderer.invoke("openInBrowser", url),
  fetchImage: (url: string) => ipcRenderer.invoke("fetchImage", url),
}

contextBridge.exposeInMainWorld("ipcBridge", api)

export type IpcBridge = typeof api
