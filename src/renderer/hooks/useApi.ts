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
export const useDataStorage = () => {
  return window.ipcBridge.dataStorage
}
export const useOpenInBrowser = () => {
  return window.ipcBridge.openInBrowser
}
