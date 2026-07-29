/**
 * Event Lifecycle Intelligence Utility
 * Purpose: Computes dynamic event progression stages (Developing, Growing, Consolidated,
 * Mature, Resolved) based on article count and time window deltas.
 * Does NOT alter MongoDB schemas; appends dynamic metadata to API outputs.
 * Fully backward compatible.
 */

/**
 * Computes dynamic lifecycle stage for an event node object.
 *
 * @param {Object} event - Event document or plain Object
 * @return {string} Lifecycle stage identifier
 */
const computeLifecycleStage = (event) => {
  if (!event) return 'Developing';

  const sourceCount = Array.isArray(event.source_articles) ? event.source_articles.length : 1;
  const firstReported = new Date(event.first_reported || Date.now()).getTime();
  const lastUpdated = new Date(event.last_updated || Date.now()).getTime();
  const ageHours = (Date.now() - firstReported) / (1000 * 60 * 60);
  const idleHours = (Date.now() - lastUpdated) / (1000 * 60 * 60);

  if (idleHours > 72) {
    return 'Resolved';
  }

  if (sourceCount >= 4 || ageHours > 48) {
    return 'Mature';
  }

  if (sourceCount === 3) {
    return 'Consolidated';
  }

  if (sourceCount === 2) {
    return 'Growing';
  }

  return 'Developing';
};

/**
 * Enriches event object or array with non-breaking lifecycle_stage property.
 */
const enrichEventWithLifecycle = (eventData) => {
  if (!eventData) return eventData;

  if (Array.isArray(eventData)) {
    return eventData.map(e => {
      const plain = typeof e.toObject === 'function' ? e.toObject() : { ...e };
      plain.lifecycle_stage = computeLifecycleStage(plain);
      return plain;
    });
  }

  const plain = typeof eventData.toObject === 'function' ? eventData.toObject() : { ...eventData };
  plain.lifecycle_stage = computeLifecycleStage(plain);
  return plain;
};

module.exports = {
  computeLifecycleStage,
  enrichEventWithLifecycle
};
