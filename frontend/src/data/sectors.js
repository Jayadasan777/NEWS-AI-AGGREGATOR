/**
 * sectors.js — Single source of truth for the 14 real backend domains.
 * Curated with a Rich, Settled, Jewel-Toned Editorial Color Palette for professional news presentation.
 * Sourced from /backend/jobs/newsEngine.js RSS_FEEDS registry.
 */
export const SECTORS = [
  { name: 'AI',            color: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.45)', particle: '#A78BFA', tag: 'NEURAL NETS & LLMS' },
  { name: 'Tech',          color: '#0EA5E9', glow: 'rgba(14, 165, 233, 0.45)',  particle: '#38BDF8', tag: 'HARDWARE & SILICON' },
  { name: 'Geopolitics',   color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.45)',  particle: '#FCD34D', tag: 'GLOBAL DIPLOMACY' },
  { name: 'Finance',       color: '#10B981', glow: 'rgba(16, 185, 129, 0.45)',  particle: '#34D399', tag: 'MARKETS & MACRO' },
  { name: 'Science',       color: '#0284C7', glow: 'rgba(2, 132, 199, 0.45)',   particle: '#38BDF8', tag: 'RESEARCH & DISCOVERY' },
  { name: 'Space',         color: '#6366F1', glow: 'rgba(99, 102, 241, 0.45)',  particle: '#818CF8', tag: 'ORBITAL & ASTRONOMY' },
  { name: 'Defense',       color: '#64748B', glow: 'rgba(100, 116, 139, 0.45)', particle: '#94A3B8', tag: 'SECURITY & STRATEGY' },
  { name: 'Health',        color: '#E11D48', glow: 'rgba(225, 29, 72, 0.45)',   particle: '#FB7185', tag: 'BIOTECH & MEDICINE' },
  { name: 'Startups',      color: '#EA580C', glow: 'rgba(234, 88, 12, 0.45)',   particle: '#FB923C', tag: 'VENTURE & FOUNDERS' },
  { name: 'Crypto',        color: '#CA8A04', glow: 'rgba(202, 138, 4, 0.45)',   particle: '#FACC15', tag: 'DEFI & PROTOCOLS' },
  { name: 'Sports',        color: '#9333EA', glow: 'rgba(147, 51, 234, 0.45)',  particle: '#C084FC', tag: 'GLOBAL ATHLETICS' },
  { name: 'Entertainment', color: '#BE185D', glow: 'rgba(190, 24, 93, 0.45)',   particle: '#F472B6', tag: 'CULTURE & MEDIA' },
  { name: 'Environment',   color: '#16A34A', glow: 'rgba(22, 163, 74, 0.45)',   particle: '#4ADE80', tag: 'CLIMATE & ENERGY' },
  { name: 'Automotive',    color: '#0D9488', glow: 'rgba(13, 148, 136, 0.45)',  particle: '#2DD4BF', tag: 'EV & MOBILITY' },
];

export const getSector = (name) =>
  SECTORS.find((s) => s.name.toLowerCase() === name?.toLowerCase()) || SECTORS[0];
