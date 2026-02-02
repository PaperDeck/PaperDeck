import { prisma } from "../utils/prisma"

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
  async deleteFeed(id: string) {
    return await prisma.feed.delete({
      where: {
        id: id,
      },
    })
  }
  async updateFeed(id: string, title: string, url: string) {
    return await prisma.feed.update({
      where: {
        id: id,
      },
      data: {
        title: title,
        url: url,
      },
    })
  }
}

const feedService = new FeedService()

export default feedService
