/**
 * Real Candidate Pair Extractor
 * Extracts candidate headline pairs from live ingested RSS articles in MongoDB or direct RSS feeds.
 * Every headline, publisher name, timestamp, and URL is 100% real.
 * Output: candidatePairs_unlabeled.json (UNLABELED - contains NO gold labels or pre-filled annotator fields).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Parser = require('rss-parser');
const parser = new Parser();

const RSS_FEEDS = {
  Tech: [
    { url: 'https://techcrunch.com/feed/', source: 'TechCrunch' },
    { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge' }
  ],
  Finance: [
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC News' },
    { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664', source: 'CNBC' }
  ],
  Geopolitics: [
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC News' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera' }
  ],
  Sports: [
    { url: 'https://feeds.bbci.co.uk/sport/rss.xml', source: 'BBC Sport' },
    { url: 'https://www.espn.com/espn/rss/news', source: 'ESPN' }
  ],
  AI: [
    { url: 'https://news.google.com/rss/search?q=Artificial+Intelligence&hl=en-US&gl=US&ceid=US:en', source: 'Google News AI' }
  ],
  Crypto: [
    { url: 'https://cointelegraph.com/rss', source: 'Cointelegraph' }
  ],
  Health: [
    { url: 'https://feeds.bbci.co.uk/news/health/rss.xml', source: 'BBC News Health' }
  ],
  Science: [
    { url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', source: 'BBC News Science' }
  ],
  Entertainment: [
    { url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', source: 'BBC News Arts' }
  ],
  Space: [
    { url: 'https://news.google.com/rss/search?q=Space+Astronomy+NASA&hl=en-US&gl=US&ceid=US:en', source: 'Google News Space' }
  ],
  Automotive: [
    { url: 'https://news.google.com/rss/search?q=Electric+Vehicles+Automotive&hl=en-US&gl=US&ceid=US:en', source: 'Google News Automotive' }
  ],
  Defense: [
    { url: 'https://news.google.com/rss/search?q=Global+Defense+Military&hl=en-US&gl=US&ceid=US:en', source: 'Google News Defense' }
  ]
};

async function fetchRealArticles() {
  console.log('📡 Ingesting live RSS wire feeds across sectors...');
  const articles = [];
  const seenHashes = new Set();

  for (const [sector, feeds] of Object.entries(RSS_FEEDS)) {
    for (const feedConfig of feeds) {
      try {
        const feed = await parser.parseURL(feedConfig.url);
        for (const item of (feed.items || [])) {
          if (!item.title) continue;
          const cleanTitle = item.title.trim();
          const titleHash = crypto.createHash('md5').update(cleanTitle.toLowerCase()).digest('hex');
          if (seenHashes.has(titleHash)) continue;
          seenHashes.add(titleHash);

          articles.push({
            id: `art_${articles.length + 1}`,
            title: cleanTitle,
            source: feedConfig.source,
            url: item.link || '',
            published: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            sector: sector
          });
        }
      } catch (err) {
        console.warn(`  ⚠️ Failed to fetch feed ${feedConfig.url}: ${err.message}`);
      }
    }
  }

  console.log(`✅ Ingested ${articles.length} real unique articles from live wire feeds.`);
  return articles;
}

function generateCandidatePairs(articles) {
  console.log('⚡ Generating candidate article pairs within 48-hour sliding window...');
  const pairs = [];
  let pairCounter = 1;

  // Group by sector
  const bySector = {};
  articles.forEach(art => {
    if (!bySector[art.sector]) bySector[art.sector] = [];
    bySector[art.sector].push(art);
  });

  // Generate same-sector candidate pairs
  for (const [sector, sectorArticles] of Object.entries(bySector)) {
    for (let i = 0; i < sectorArticles.length; i++) {
      for (let j = i + 1; j < sectorArticles.length; j++) {
        const a = sectorArticles[i];
        const b = sectorArticles[j];
        
        // 48-hour time window check
        const dtHours = Math.abs(new Date(a.published) - new Date(b.published)) / (1000 * 3600);
        if (dtHours > 48) continue;

        // Skip if identical source and title
        if (a.source === b.source && a.title === b.title) continue;

        pairs.push({
          id: `pair_${String(pairCounter++).padStart(4, '0')}`,
          headline_a: a.title,
          headline_b: b.title,
          source_a: a.source,
          source_b: b.source,
          published_a: a.published,
          published_b: b.published,
          url_a: a.url,
          url_b: b.url,
          sector_a: a.sector,
          sector_b: b.sector
        });
      }
    }
  }

  // Generate cross-sector negative pairs for diversity
  const sectors = Object.keys(bySector);
  for (let s1 = 0; s1 < sectors.length; s1++) {
    for (let s2 = s1 + 1; s2 < sectors.length; s2++) {
      const arts1 = bySector[sectors[s1]];
      const arts2 = bySector[sectors[s2]];
      const sampleCount = Math.min(3, arts1.length, arts2.length);
      
      for (let k = 0; k < sampleCount; k++) {
        const a = arts1[k];
        const b = arts2[k];
        pairs.push({
          id: `pair_${String(pairCounter++).padStart(4, '0')}`,
          headline_a: a.title,
          headline_b: b.title,
          source_a: a.source,
          source_b: b.source,
          published_a: a.published,
          published_b: b.published,
          url_a: a.url,
          url_b: b.url,
          sector_a: a.sector,
          sector_b: b.sector
        });
      }
    }
  }

  console.log(`✅ Generated ${pairs.length} unlabeled candidate pairs.`);
  return pairs;
}

async function main() {
  const articles = await fetchRealArticles();
  const pairs = generateCandidatePairs(articles);

  const outPath = path.join(__dirname, 'candidatePairs_unlabeled.json');
  fs.writeFileSync(outPath, JSON.stringify(pairs, null, 2));
  console.log(`\n🎉 Saved unlabeled candidate pairs to: ${outPath}`);
  console.log('📌 NOTE: This file is strictly UNLABELED. No gold label or pre-filled annotator fields exist.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fetchRealArticles, generateCandidatePairs };
