export const DIVINE_HERO_ICON_IDS = [
  'prism',
  'hand',
  'peony',
  'key',
  'star',
  'eye',
  'moth',
  'watch',
  'feather',
  'shell',
  'snake',
  'hourglass',
  'apple',
  'scissors',
  'pomegranate',
  'domino',
  'bell',
  'compass',
  'bust',
  'pen',
  'crystal',
  'ribbon',
  'rose',
  'heart',
  'pearl',
  'mask',
  'matches',
  'glove',
  'door',
  'envelope',
] as const;

export type DivineHeroIconId = (typeof DIVINE_HERO_ICON_IDS)[number];

export interface DivineHeroIcon {
  id: DivineHeroIconId;
  label: string;
  src: string;
}

export const DIVINE_HERO_ICONS: readonly DivineHeroIcon[] =
  DIVINE_HERO_ICON_IDS.map((id) => ({
    id,
    label: `${id.charAt(0).toUpperCase()}${id.slice(1)}`,
    src: `/collage-v1/${id}.webp`,
  }));

export function isDivineHeroIconId(value: unknown): value is DivineHeroIconId {
  return (
    typeof value === 'string' &&
    DIVINE_HERO_ICON_IDS.includes(value as DivineHeroIconId)
  );
}

export function divineHeroIcon(
  value: DivineHeroIconId | undefined,
): DivineHeroIcon | undefined {
  return value
    ? DIVINE_HERO_ICONS.find((icon) => icon.id === value)
    : undefined;
}
