import type { Format } from './route-types';

export function parseSize(value: string): number {
  const lower = value.toLowerCase();
  const amount = Number.parseFloat(lower);
  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error(`Invalid size value: ${value}`);
  }

  if (lower.endsWith('mb')) {
    return Math.round(amount * 1024 * 1024);
  }

  return Math.round(amount * 1024);
}

export function formatSizeLabel(value: string): string {
  return value.toUpperCase();
}

export function formatLabel(format: Format): string {
  return format === 'jpeg' ? 'JPEG' : format.toUpperCase();
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function platformLabel(value: string): string {
  const labels: Record<string, string> = {
    youtube: 'YouTube',
    linkedin: 'LinkedIn',
    tiktok: 'TikTok',
    whatsapp: 'WhatsApp',
  };

  return labels[value] ?? capitalize(value);
}

export function assetLabel(value: string): string {
  return value.split('-').map(capitalize).join(' ');
}
