/**
 * JSON Self-Healing Utility
 * Purpose: Automatically repairs common malformed JSON issues in LLM outputs
 * (trailing commas, missing closing brackets, smart quotes, raw newlines)
 * before falling back. Never throws.
 */

const logger = require('./logger');

/**
 * Attempts to parse JSON string. If standard parsing fails, executes heuristic
 * repair passes and retries parsing. Returns parsed Object/Array or null if unrepairable.
 *
 * @param {string} text - Raw string containing JSON
 * @return {Object|Array|null} Parsed JSON data or null on failure
 */
const repairAndParseJson = (text) => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const trimmed = text.trim();

  // Step 1: Fast path - Standard JSON parse
  try {
    return JSON.parse(trimmed);
  } catch (initialErr) {
    // Continue to repair pipeline
  }

  // Step 2: Extract JSON subset if surrounded by Markdown code blocks or conversation text
  let candidate = trimmed;
  const markdownMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (markdownMatch && markdownMatch[1]) {
    candidate = markdownMatch[1].trim();
  } else {
    const objectOrArrayMatch = candidate.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (objectOrArrayMatch && objectOrArrayMatch[1]) {
      candidate = objectOrArrayMatch[1].trim();
    }
  }

  // Try parsing extracted substring
  try {
    return JSON.parse(candidate);
  } catch (err) {
    // Continue to heuristic repair
  }

  // Step 3: Heuristic repairs
  try {
    let repaired = candidate;

    // Fix smart / curly quotes
    repaired = repaired
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'");

    // Replace duplicated commas
    repaired = repaired.replace(/,\s*,/g, ',');

    // Strip trailing commas before closing braces/brackets
    repaired = repaired.replace(/,\s*([\}\]])/g, '$1');

    // Fix unescaped newlines inside quote strings (common in LLM markdown blocks)
    repaired = repaired.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, '\\n');

    // Attempt parsing post-regex cleanups
    try {
      return JSON.parse(repaired);
    } catch (e) {
      // Continue to bracket balancing
    }

    // Auto-close missing brackets if text was truncated at response limit
    let openBraces = (repaired.match(/\{/g) || []).length;
    let closeBraces = (repaired.match(/\}/g) || []).length;
    let openBrackets = (repaired.match(/\[/g) || []).length;
    let closeBrackets = (repaired.match(/\]/g) || []).length;

    while (closeBrackets < openBrackets) {
      repaired += ']';
      closeBrackets++;
    }

    while (closeBraces < openBraces) {
      repaired += '}';
      closeBraces++;
    }

    // Final trailing comma cleanup after closing bracket injection
    repaired = repaired.replace(/,\s*([\}\]])/g, '$1');

    return JSON.parse(repaired);
  } catch (finalErr) {
    logger.warn('JSON_REPAIR', 'JSON repair pipeline could not recover malformed string', {
      originalLength: text.length,
      sample: text.slice(0, 100) + '...'
    });
    return null;
  }
};

module.exports = { repairAndParseJson };
