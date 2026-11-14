import { Request, Response } from 'express';

const PALETTES: Record<string, [string, string, string]> = {
  'art-pop': ['#18181B', '#FF3B5C', '#FB7185'],
  'art-hiphop': ['#111114', '#F59E0B', '#D97706'],
  'art-rock': ['#141418', '#EF4444', '#991B1B'],
  'art-classical': ['#0F172A', '#E2E8F0', '#94A3B8'],
  'art-jazz': ['#1C1917', '#D97706', '#FDE68A'],
  'art-electronic': ['#09090B', '#EC4899', '#6366F1'],
  'art-indie': ['#18181B', '#14B8A6', '#5EEAD4'],
  'art-bollywood': ['#1F1215', '#F43F5E', '#FBBF24'],
  'art-punjabi': ['#14181F', '#F97316', '#FACC15'],
  'art-lofi': ['#13151A', '#8B5CF6', '#C4B5FD'],
  'art-devotional': ['#1B1612', '#EA580C', '#FED7AA'],
  'art-instrumental': ['#0F1418', '#38BDF8', '#BAE6FD'],
};

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function serveArtworkSvg(req: Request, res: Response) {
  const seed = String(req.params.seed || 'melody').replace(/\.svg$/i, '');
  const h = hashSeed(seed);
  const keys = Object.keys(PALETTES);
  const matchedKey = keys.find((k) => seed.includes(k.replace('art-', ''))) || keys[h % keys.length];
  const [bg, accent, soft] = PALETTES[matchedKey];

  const cx = 160 + (h % 180);
  const cy = 140 + ((h >> 4) % 200);
  const r1 = 110 + ((h >> 8) % 80);
  const r2 = 60 + ((h >> 12) % 60);
  const rot = (h % 90) - 45;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg-${h}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="#050507" />
    </linearGradient>
    <radialGradient id="glow-${h}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.55" />
      <stop offset="65%" stop-color="${soft}" stop-opacity="0.16" />
      <stop offset="100%" stop-color="${bg}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg-${h})" />
  <circle cx="${cx}" cy="${cy}" r="${r1 * 1.9}" fill="url(#glow-${h})" />
  <g transform="translate(256,256) rotate(${rot})">
    <circle cx="0" cy="0" r="${r1}" fill="none" stroke="${soft}" stroke-opacity="0.22" stroke-width="1.5" />
    <circle cx="0" cy="0" r="${r2}" fill="none" stroke="${accent}" stroke-opacity="0.65" stroke-width="2" />
    <rect x="-${r2}" y="-${r2}" width="${r2 * 2}" height="${r2 * 2}" rx="12" fill="none" stroke="#ffffff" stroke-opacity="0.14" stroke-width="1" />
    <line x1="-180" y1="0" x2="180" y2="0" stroke="${accent}" stroke-opacity="0.3" stroke-width="1" />
    <circle cx="0" cy="0" r="14" fill="${accent}" fill-opacity="0.9" />
  </g>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
}
