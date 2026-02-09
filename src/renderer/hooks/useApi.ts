export const useArticleService = () => {
  return window.ipcBridge.articleService
}
export const useFeedService = () => {
  return window.ipcBridge.feedService
}
export const useFeedSyncService = () => {
  return window.ipcBridge.feedSyncService
}
export const useFeedParser = () => {
  return window.ipcBridge.feedParser
}
