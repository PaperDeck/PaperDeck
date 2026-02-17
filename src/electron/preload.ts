import { contextBridge, ipcRenderer } from "electron"
import type Parser from "rss-parser"

const api = {
  articleService: {
    saveArticles: (feedUrl: string, articles: Parser.Item[]) =>
      ipcRenderer.invoke("articleService", "saveArticles", feedUrl, articles),
    markArticleAsRead: (articleId: string) =>
      ipcRenderer.invoke("articleService", "markArticleAsRead", articleId),
    getArticlesByFeedUrl: (feedUrl: string, limit?: number) =>
      ipcRenderer.invoke(
        "articleService",
        "getArticlesByFeedUrl",
        feedUrl,
        limit,
      ),
    deleteAllArticlesByFeedUrl: (feedUrl: string) =>
      ipcRenderer.invoke(
        "articleService",
        "deleteAllArticlesByFeedUrl",
        feedUrl,
      ),
    getAll: (includeFeeds = false) =>
      ipcRenderer.invoke("articleService", "getAll", includeFeeds),
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
  },
}

contextBridge.exposeInMainWorld("ipcBridge", api)

export type IpcBridge = typeof api
