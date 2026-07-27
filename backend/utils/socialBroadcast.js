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
    
    const formattedPost = `${article.social_caption || article.title}\n\n${(article.social_hashtags || []).join(' ')}`;
    const captionText = article.social_caption || `${article.title}\n\n${article.unique_summary.slice(0, 200)}...`;
    const hashtagsArray = article.social_hashtags || [`#${article.sector}`, '#NewsAI', '#BreakingNews'];

    // Prepare standardized dual-structure social media payload (flat + nested)
    const payload = {
      event: 'NEW_ARTICLE_BROADCAST',
      timestamp: new Date().toISOString(),
      // Top-level flat properties for direct field mapping in Make.com / Zapier / Discord / n8n
      id: article._id,
      title: article.title,
      summary: article.unique_summary,
      sector: article.sector,
      image_url: article.image_url,
      url: article.url || '',
      caption: captionText,
      message: formattedPost,
      social_caption: captionText,
      social_hashtags: hashtagsArray,
      formatted_post: formattedPost,
      // Nested object structure
      article: {
        id: article._id,
        title: article.title,
        summary: article.unique_summary,
        sector: article.sector,
        image_url: article.image_url,
        url: article.url || '',
        caption: captionText,
        message: formattedPost,
        social_caption: captionText,
        social_hashtags: hashtagsArray,
        formatted_post: formattedPost
      }
    };

    if (!webhookUrl) {
      console.log(`[📱 SOCIAL SIMULATION] No SOCIAL_WEBHOOK_URL set in .env. Simulating broadcast for "${article.title}":`);
      console.log(`--- IG CAPTION PREVIEW ---`);
      console.log(payload.article.formatted_post);
      console.log(`--------------------------`);
      
      article.broadcast_status = 'broadcasted';
      article.broadcast_time = new Date();
      article.broadcast_error = '';
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
    article.broadcast_time = new Date();
    article.broadcast_error = '';
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
    if (article && typeof article.save === 'function') {
      try {
        article.broadcast_status = 'failed';
        article.broadcast_time = new Date();
        article.broadcast_error = error.message || 'Failed to dispatch social broadcast.';
        await article.save();
      } catch (dbErr) {
        console.error('❌ Failed to save error status to DB:', dbErr.message);
      }
    }
    return {
      success: false,
      message: error.message || 'Failed to dispatch social broadcast.',
      error: error.message
    };
  }
};

module.exports = { broadcastArticle };
