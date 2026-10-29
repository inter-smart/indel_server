const { models } = require("../../models/index");
const CacheService = require("../../services/cacheService");

const CelebrationPageContent = models.CelebrationPageContent;

const CACHE_KEY = "celebrationPageContent";

class CelebrationPageContentController {
  static async get(req, res, next) {
    try {
      const cachedData = await CacheService.get(CACHE_KEY);

      if (cachedData) {
        return res.json({ success: true, data: JSON.parse(cachedData) });
      }

      // A single row; created empty on first read so no seeding step is needed.
      const [content] = await CelebrationPageContent.findOrCreate({ where: { id: 1 }, defaults: {} });

      await CacheService.set(CACHE_KEY, JSON.stringify(content), 3600);
      res.json({ success: true, data: content });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const [content] = await CelebrationPageContent.findOrCreate({ where: { id: 1 }, defaults: {} });

      await content.update({ ...req.body });

      await CacheService.invalidate(CACHE_KEY);
      res.json({ success: true, data: content, message: "Celebrations Page Content updated" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CelebrationPageContentController;
