import feedService from "@/electron/services/feedService"
import XMLBuilder from "fast-xml-builder"
import { XMLParser } from "fast-xml-parser"
import fs from "fs/promises"
import { dialog } from "electron"

type OPMLOutline = {
  "@_text"?: string
  "@_title"?: string
  "@_xmlUrl"?: string
  outline?: OPMLOutline | OPMLOutline[]
}

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

  async importFromOPML(filePath: string) {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    })
    try {
      const xmlData = await fs.readFile(filePath, "utf-8")
      const jsonObj = parser.parse(xmlData)
      const outlines = jsonObj.opml?.body?.outline
      if (!outlines) {
        throw new Error("Invalid OPML file: No outlines found")
      }

      const collectedFeeds: { title: string; url: string }[] = []

      const walkOutlines = (nodes: OPMLOutline | OPMLOutline[]) => {
        const normalizedNodes = Array.isArray(nodes) ? nodes : [nodes]

        for (const node of normalizedNodes) {
          const url = node?.["@_xmlUrl"]
          const title = node?.["@_text"] || node?.["@_title"] || ""

          if (url) {
            collectedFeeds.push({
              title: title || url,
              url,
            })
          }

          if (node.outline) {
            walkOutlines(node.outline)
          }
        }
      }

      walkOutlines(outlines)

      const uniqueFeedMap = new Map<string, { title: string; url: string }>()
      for (const feed of collectedFeeds) {
        if (!uniqueFeedMap.has(feed.url)) {
          uniqueFeedMap.set(feed.url, feed)
        }
      }

      let importedCount = 0
      let skippedCount = 0

      for (const feed of uniqueFeedMap.values()) {
        try {
          await feedService.addFeed(feed.title, feed.url)
          importedCount += 1
        } catch {
          skippedCount += 1
        }
      }

      return {
        totalFound: collectedFeeds.length,
        uniqueFound: uniqueFeedMap.size,
        importedCount,
        skippedCount,
      }
    } catch (error) {
      console.error("Error importing OPML file:", error)
      throw error
    }
  }
  async importFromOPMLWithDialog() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "OPML", extensions: ["opml", "xml"] }],
    })

    if (canceled || filePaths.length === 0) {
      return {
        canceled: true,
        filePath: null,
        result: null,
      }
    }

    const result = await this.importFromOPML(filePaths[0])

    return {
      canceled: false,
      filePath: filePaths[0],
      result,
    }
  }
}

export default new ImportExportService()
