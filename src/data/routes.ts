export type Format = 'jpeg' | 'jpg' | 'png' | 'webp';

export type KeywordRoute = {
  slug: string;
  format: Format;
  formatLabel: string;
  unit: 'kb' | 'mb';
  sizeValue: number;
  sizeLabel: string;
  targetKB: number;
  title: string;
  description: string;
  h1: string;
};

const formatCatalog: Array<{ format: Format; label: string }> = [
  { format: 'jpeg', label: 'JPEG' },
  { format: 'jpg', label: 'JPG' },
  { format: 'png', label: 'PNG' },
  { format: 'webp', label: 'WebP' }
];

const kbSizes = [
  10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
  60, 70, 75, 80, 90, 100, 110, 120, 125, 130,
  140, 150, 160, 180, 200, 220, 240, 250, 280, 300,
  320, 350, 360, 400, 450, 500, 550, 600, 650, 700,
  750, 800, 900, 1000, 1200, 1500, 1800, 2000
] as const;

const mbSizes = [1, 2, 3, 4, 5, 8, 10] as const;

const sizeCatalog = [
  ...kbSizes.map((value) => ({ value, unit: 'kb' as const })),
  ...mbSizes.map((value) => ({ value, unit: 'mb' as const }))
];

const toTargetKB = (value: number, unit: 'kb' | 'mb') => (unit === 'mb' ? value * 1024 : value);

export const keywordRoutes: KeywordRoute[] = formatCatalog.flatMap(({ format, label }) =>
  sizeCatalog.map(({ value, unit }) => {
    const sizeLabel = `${value}${unit}`;
    const slug = `compress-${format}-to-${sizeLabel}`;

    return {
      slug,
      format,
      formatLabel: label,
      unit,
      sizeValue: value,
      sizeLabel: sizeLabel.toUpperCase(),
      targetKB: toTargetKB(value, unit),
      title: `Compress ${label} to ${sizeLabel.toUpperCase()} Online Free`,
      description: `Compress ${label} images to ${sizeLabel.toUpperCase()} online with a private browser-based tool. Fast, static, and built for exact size targets.`,
      h1: `Compress ${label} to ${sizeLabel.toUpperCase()} - Free & Secure`
    };
  })
);

export const getRouteBySlug = (slug: string) => keywordRoutes.find((entry) => entry.slug === slug);
