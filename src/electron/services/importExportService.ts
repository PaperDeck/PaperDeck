import feedService from "@/electron/services/feedService"
import XMLBuilder from "fast-xml-builder"
import fs from "fs/promises"
import { dialog } from "electron"
class ImportExportService {
  async exportToOPML(filePath: string) {
    const feeds = await feedService.getFeeds()
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      attributeNamePrefix: "@_",
      suppressEmptyNode: true,
    })
    const opmlObject = {
      opml: {
        "@_version": "2.0",
        head: {
          title: "All Feeds",
        },
        body: {
          outline: feeds.map((feed) => ({
            "@_text": feed.title,
            "@_type": "rss",
            "@_xmlUrl": feed.url,
          })),
        },
      },
    }
    const xml = builder.build(opmlObject)
    try {
      await fs.writeFile(filePath, xml, "utf-8")
    } catch (error) {
      console.error("Error writing OPML file:", error)
      throw error
    }
  }

  async exportToOPMLWithDialog() {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: "feeds.opml",
      filters: [{ name: "OPML", extensions: ["opml", "xml"] }],
    })

    if (canceled || !filePath) {
      return {
        canceled: true,
        filePath: null,
      }
    }

    await this.exportToOPML(filePath)

    return {
      canceled: false,
      filePath,
    }
  }
}

export default new ImportExportService()
