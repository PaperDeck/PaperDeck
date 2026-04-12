export const useArticleService = () => {
  return window.ipcBridge.articleService
}
export const useFeedService = () => {
  return window.ipcBridge.feedService
}

const feedSyncServiceWithScopedProgress = {
  ...window.ipcBridge.feedSyncService,
  syncFeeds: async (callBack?: (total: number, completed: number) => void) => {
    const syncId = crypto.randomUUID()
    let disposeProgressListener: (() => void) | undefined
    if (callBack) {
      disposeProgressListener =
        window.ipcBridge.feedSyncService.onFeedSyncProgress(
          (eventSyncId, total, completed) => {
            if (eventSyncId !== syncId) {
              return
            }
            callBack(total, completed)
          },
        )
    }
    return window.ipcBridge.feedSyncService
      .syncFeeds(syncId)
      .finally(() => disposeProgressListener?.())
  },
}

export const useFeedSyncService = () => {
  return feedSyncServiceWithScopedProgress
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
export const useImportExportService = () => {
  return window.ipcBridge.importExportService
}
