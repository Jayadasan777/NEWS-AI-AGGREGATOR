/**
 * sectors.js — Single source of truth for the 14 real backend domains.
 * Curated with a 100% Professional Black & White Editorial Palette for luxury news presentation.
 * Sourced from /backend/jobs/newsEngine.js RSS_FEEDS registry.
 */
export const SECTORS = [
  { name: 'AI',            color: '#F5F5F5', glow: 'rgba(245, 245, 245, 0.25)', particle: '#FFFFFF', tag: 'NEURAL NETS & LLMS' },
  { name: 'Tech',          color: '#E5E5E5', glow: 'rgba(229, 229, 229, 0.25)', particle: '#F5F5F5', tag: 'HARDWARE & SILICON' },
  { name: 'Geopolitics',   color: '#D4D4D4', glow: 'rgba(212, 212, 212, 0.25)', particle: '#E5E5E5', tag: 'GLOBAL DIPLOMACY' },
  { name: 'Finance',       color: '#C8C8C8', glow: 'rgba(200, 200, 200, 0.25)', particle: '#D4D4D4', tag: 'MARKETS & MACRO' },
  { name: 'Science',       color: '#B8B8B8', glow: 'rgba(184, 184, 184, 0.25)', particle: '#C8C8C8', tag: 'RESEARCH & DISCOVERY' },
  { name: 'Space',         color: '#A8A8A8', glow: 'rgba(168, 168, 168, 0.25)', particle: '#B8B8B8', tag: 'ORBITAL & ASTRONOMY' },
  { name: 'Defense',       color: '#989898', glow: 'rgba(152, 152, 152, 0.25)', particle: '#A8A8A8', tag: 'SECURITY & STRATEGY' },
  { name: 'Health',        color: '#E5E5E5', glow: 'rgba(229, 229, 229, 0.25)', particle: '#F5F5F5', tag: 'BIOTECH & MEDICINE' },
  { name: 'Startups',      color: '#D4D4D4', glow: 'rgba(212, 212, 212, 0.25)', particle: '#E5E5E5', tag: 'VENTURE & FOUNDERS' },
  { name: 'Crypto',        color: '#C8C8C8', glow: 'rgba(200, 200, 200, 0.25)', particle: '#D4D4D4', tag: 'DEFI & PROTOCOLS' },
  { name: 'Sports',        color: '#B8B8B8', glow: 'rgba(184, 184, 184, 0.25)', particle: '#C8C8C8', tag: 'GLOBAL ATHLETICS' },
  { name: 'Entertainment', color: '#A8A8A8', glow: 'rgba(168, 168, 168, 0.25)', particle: '#B8B8B8', tag: 'CULTURE & MEDIA' },
  { name: 'Environment',   color: '#989898', glow: 'rgba(152, 152, 152, 0.25)', particle: '#A8A8A8', tag: 'CLIMATE & ENERGY' },
  { name: 'Automotive',    color: '#D4D4D4', glow: 'rgba(212, 212, 212, 0.25)', particle: '#E5E5E5', tag: 'EV & MOBILITY' },
];

export const getSector = (name) =>
  SECTORS.find((s) => s.name.toLowerCase() === name?.toLowerCase()) || SECTORS[0];
