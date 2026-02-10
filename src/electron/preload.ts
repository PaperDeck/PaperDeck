import { contextBridge, ipcRenderer } from "electron"
import type { FeedItem } from "@/electron/services/feed/types"

const api = {
  articleService: {
    saveArticles: (feedId: string, articles: FeedItem[]) =>
      ipcRenderer.invoke("articleService", "saveArticles", feedId, articles),
    markArticleAsRead: (articleId: string) =>
      ipcRenderer.invoke("articleService", "markArticleAsRead", articleId),
    getArticlesByFeedId: (feedId: string, limit?: number) =>
      ipcRenderer.invoke(
        "articleService",
        "getArticlesByFeedId",
        feedId,
        limit,
      ),
    deleteAllArticlesByFeedId: (feedId: string) =>
      ipcRenderer.invoke("articleService", "deleteAllArticlesByFeedId", feedId),
  },
  feedService: {
    addFeed: (title: string, url: string) =>
      ipcRenderer.invoke("feedService", "addFeed", title, url),
    getFeeds: () => ipcRenderer.invoke("feedService", "getFeeds"),
    deleteFeed: (id: string) =>
      ipcRenderer.invoke("feedService", "deleteFeed", id),
    updateFeed: (id: string, title: string, url: string) =>
      ipcRenderer.invoke("feedService", "updateFeed", id, title, url),
  },
  feedSyncService: {
    syncFeeds: () => ipcRenderer.invoke("feedSyncService", "syncFeeds"),
  },
  feedParser: (url: string, timeout?: number, signal?: AbortSignal) =>
    ipcRenderer.invoke("feedParser", url, timeout, signal),
}

contextBridge.exposeInMainWorld("ipcBridge", api)

export type IpcBridge = typeof api
