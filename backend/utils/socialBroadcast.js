const axios = require('axios');
const Article = require('../models/Article');

/**
 * Broadcasts an article to the configured Webhook (Make.com / Zapier / n8n / Discord / Telegram).
 * Includes:
 * 1. Strict Broadcast Idempotency Lock
 * 2. Smart-Queue Staggered Drip-Feed Timing Check
 * 3. Webhook Self-Healing Retry Logic (Up to 3 automated retries)
 *
 * @param {Object|string} articleOrId - The Mongoose Article document or article ID.
 * @param {Object} [options={}] - Options (e.g. { force: true } to override idempotency for manual trigger)
 * @returns {Promise<{success: boolean, message: string, data?: Object, simulation?: boolean}>}
 */
const broadcastArticle = async (articleOrId, options = {}) => {
  let article;
  try {
    if (typeof articleOrId === 'string' || articleOrId instanceof require('mongoose').Types.ObjectId) {
      article = await Article.findById(articleOrId);
    } else {
      article = articleOrId;
    }

    if (!article) {
      throw new Error('Article not found for social broadcasting.');
    }

    // ── FEATURE 1: Strict Broadcast Idempotency Lock ────────────────────────
    if (!options.force && article.broadcast_status === 'broadcasted') {
      console.log(`🔒 Idempotency Lock: Article "${article.title}" already broadcasted. Skipping duplicate dispatch.`);
      return {
        success: true,
        skipped: true,
        message: 'Idempotency Lock: Article has already been broadcasted. Duplicate dispatch prevented.'
      };
    }

    // ── FEATURE 2: Autonomous Smart-Queue Staggered Drip-Feeding Check ──────
    if (!options.force && article.scheduled_broadcast_time && Date.now() < new Date(article.scheduled_broadcast_time).getTime()) {
      console.log(`⏱️ Drip Queue: Broadcast for "${article.title}" is scheduled for ${new Date(article.scheduled_broadcast_time).toLocaleTimeString()}. Deferring dispatch.`);
      return {
        success: true,
        deferred: true,
        message: `Drip Queue: Scheduled for future delivery at ${new Date(article.scheduled_broadcast_time).toLocaleTimeString()}.`
      };
    }

    const webhookUrl = process.env.SOCIAL_WEBHOOK_URL;
    
    const formattedPost = `${article.social_caption || article.title}\n\n${(article.social_hashtags || []).join(' ')}`;
    const captionText = article.social_caption || `${article.title}\n\n${article.unique_summary.slice(0, 200)}...`;
    const hashtagsArray = article.social_hashtags || [`#${article.sector}`, '#NewsAI', '#BreakingNews'];
    const safeImageUrl = article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80';

    // Prepare standardized dual-structure social media payload (flat + nested)
    const payload = {
      event: 'NEW_ARTICLE_BROADCAST',
      timestamp: new Date().toISOString(),
      id: article._id,
      title: article.title,
      summary: article.unique_summary,
      sector: article.sector,
      image_url: safeImageUrl,
      photo_url: safeImageUrl,
      url: article.url || '',
      link: article.url || '',
      caption: captionText,
      message: formattedPost,
      social_caption: captionText,
      social_hashtags: hashtagsArray,
      formatted_post: formattedPost,
      article: {
        id: article._id,
        title: article.title,
        summary: article.unique_summary,
        sector: article.sector,
        image_url: safeImageUrl,
        photo_url: safeImageUrl,
        url: article.url || '',
        link: article.url || '',
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
        // ── FEATURE 5: Webhook Self-Healing & Retry Logic ────────────────────
        article.retry_count = (article.retry_count || 0) + 1;
        article.broadcast_error = error.message || 'Webhook dispatch failed.';
        
        if (article.retry_count < 3) {
          // Schedule automated retry in 15 minutes
          article.broadcast_status = 'pending';
          article.scheduled_broadcast_time = new Date(Date.now() + 15 * 60 * 1000);
          console.log(`🩹 Webhook Self-Healing: Retry #${article.retry_count} scheduled in 15 minutes for "${article.title}"`);
        } else {
          // Max retries reached — mark failed
          article.broadcast_status = 'failed';
          article.broadcast_time = new Date();
          console.log(`🔴 Max retries (3/3) reached for "${article.title}". Marked as failed.`);
        }
        
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
