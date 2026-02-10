import { prisma } from "@/electron/utils/prisma"

class FeedService {
  async addFeed(title: string, url: string) {
    return await prisma.feed.create({
      data: {
        title: title,
        url: url,
      },
    })
  }
  async getFeeds() {
    return await prisma.feed.findMany()
  }
  async deleteFeed(url: string) {
    return await prisma.feed.delete({
      where: {
        url: url,
      },
    })
  }
  async updateFeed(url: string, title: string) {
    return await prisma.feed.update({
      where: {
        url: url,
      },
      data: {
        title: title,
      },
    })
  }
}

const feedService = new FeedService()

export default feedService
