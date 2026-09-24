const axios = require("axios");
const CustomError = require("../../utils/customError");
const Logger = require("../../services/logger");

let lastGoodRate = null;

class GoldRateController {
  static async fetchGoldRate(req, res, next) {
    try {
      const { data } = await axios.post(
        "http://insight.indelmoney.com:8089/indel/api/insight/latestLTV",
        {},
        {
          headers: {
            Api_key: "ed8d7baf6b5bc3be44ea3fcd65482541a6770d8d",
          },
          timeout: 10000,
        }
      );

      const rate = data?.status && data?.LTV ? parseFloat(data.LTV) : NaN;
      if (!Number.isFinite(rate)) {
        throw new CustomError("Failed to fetch gold rate", 502);
      }

      lastGoodRate = rate;
      return res.status(200).json({ success: true, goldRate: rate });
    } catch (error) {
      // Log only a short summary; never the raw axios error (contains the API key)
      const upstreamStatus = error.response?.status;
      Logger.error(
        `Gold rate fetch failed${upstreamStatus ? ` (upstream ${upstreamStatus})` : ""}: ${error.message}`
      );

      // Serve last known rate so the site keeps working during upstream outages
      if (lastGoodRate !== null) {
        return res.status(200).json({ success: true, goldRate: lastGoodRate, stale: true });
      }

      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        return next(new CustomError("Gold rate service timeout", 504));
      }
      if (error instanceof CustomError) {
        return next(error);
      }
      next(new CustomError("Gold rate service unavailable", 502));
    }
  }
}

module.exports = GoldRateController;
