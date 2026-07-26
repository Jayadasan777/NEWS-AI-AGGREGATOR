const axios = require('axios');
const Article = require('../models/Article');

/**
 * Broadcasts an article to the configured Webhook (Make.com / Zapier / n8n / Discord / Telegram).
 * @param {Object|string} articleOrId - The Mongoose Article document or article ID.
 * @returns {Promise<{success: boolean, message: string, data?: Object}>}
 */
const broadcastArticle = async (articleOrId) => {
  try {
    let article = articleOrId;
    if (typeof articleOrId === 'string' || articleOrId instanceof require('mongoose').Types.ObjectId) {
      article = await Article.findById(articleOrId);
    }

    if (!article) {
      throw new Error('Article not found for social broadcasting.');
    }

    const webhookUrl = process.env.SOCIAL_WEBHOOK_URL;
    
    // Prepare standardized social media payload
    const payload = {
      event: 'NEW_ARTICLE_BROADCAST',
      timestamp: new Date().toISOString(),
      article: {
        id: article._id,
        title: article.title,
        summary: article.unique_summary,
        sector: article.sector,
        image_url: article.image_url,
        url: article.url || '',
        social_caption: article.social_caption || `${article.title}\n\n${article.unique_summary.slice(0, 200)}...`,
        social_hashtags: article.social_hashtags || [`#${article.sector}`, '#NewsAI', '#BreakingNews'],
        formatted_post: `${article.social_caption || article.title}\n\n${(article.social_hashtags || []).join(' ')}`
      }
    };

    if (!webhookUrl) {
      console.log(`[📱 SOCIAL SIMULATION] No SOCIAL_WEBHOOK_URL set in .env. Simulating broadcast for "${article.title}":`);
      console.log(`--- IG CAPTION PREVIEW ---`);
      console.log(payload.article.formatted_post);
      console.log(`--------------------------`);
      
      article.broadcast_status = 'broadcasted';
      await article.save();
      
      return {
        success: true,
        simulation: true,
        message: 'Successfully simulated broadcast (No SOCIAL_WEBHOOK_URL configured in .env). Article marked as broadcasted.',
        payload
      };
    }

    console.log(`🚀 Dispatching Webhook to ${webhookUrl} for article "${article.title}"...`);
    const response = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    article.broadcast_status = 'broadcasted';
    await article.save();

    console.log(`✅ Webhook dispatch successful! Status: ${response.status}`);
    return {
      success: true,
      simulation: false,
      message: `Broadcasted successfully to webhook (Status: ${response.status})`,
      data: response.data
    };

  } catch (error) {
    console.error('❌ Social Broadcast Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to dispatch social broadcast.'
    };
  }
};

module.exports = { broadcastArticle };
