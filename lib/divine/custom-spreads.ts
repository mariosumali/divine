import type { SpreadDefinition, SystemSlug } from './types';

export const CUSTOM_SPREADS_KEY = 'divine-custom-spreads:v1';
export const CUSTOM_SPREAD_MAX_CARDS = 10;

export type CustomSpreadLayout = SpreadDefinition['layout'];

export interface CustomSpread extends SpreadDefinition {
  id: `custom:${string}`;
  system: SystemSlug;
  createdAt: string;
  updatedAt: string;
}

export interface CustomSpreadInput {
  id?: string;
  name: string;
  positions: string[];
  layout: CustomSpreadLayout;
}

const layouts: CustomSpreadLayout[] = [
  'single',
  'line',
  'cross',
  'grid',
  'tableau',
];

const isLayout = (value: unknown): value is CustomSpreadLayout =>
  layouts.includes(value as CustomSpreadLayout);

const cleanText = (value: string, maximum: number) =>
  value.trim().replace(/\s+/g, ' ').slice(0, maximum);

export function validateCustomSpread(input: CustomSpreadInput): string[] {
  const errors: string[] = [];
  const name = cleanText(input.name, 80);
  const positions = input.positions.map((position) => cleanText(position, 80));
  if (!name) errors.push('Name your spread.');
  if (positions.length < 1 || positions.length > CUSTOM_SPREAD_MAX_CARDS)
    errors.push('Choose between 1 and 10 cards.');
  if (positions.some((position) => !position))
    errors.push('Name every position.');
  if (!isLayout(input.layout)) errors.push('Choose a supported layout.');
  return errors;
}

export function createCustomSpread(
  system: SystemSlug,
  input: CustomSpreadInput,
  now = new Date().toISOString(),
  randomId = crypto.randomUUID(),
): CustomSpread {
  const errors = validateCustomSpread(input);
  if (errors.length) throw new Error(errors[0]);
  const positions = input.positions.map((position) => cleanText(position, 80));
  return {
    id: input.id?.startsWith('custom:')
      ? (input.id as CustomSpread['id'])
      : `custom:${randomId}`,
    system,
    name: cleanText(input.name, 80),
    description: `${positions.length}-card personal spread`,
    positions,
    layout: positions.length === 1 ? 'single' : input.layout,
    createdAt: now,
    updatedAt: now,
  };
}

function isCustomSpread(value: unknown): value is CustomSpread {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CustomSpread>;
  return (
    typeof item.id === 'string' &&
    item.id.startsWith('custom:') &&
    typeof item.system === 'string' &&
    typeof item.name === 'string' &&
    typeof item.description === 'string' &&
    Array.isArray(item.positions) &&
    item.positions.every((position) => typeof position === 'string') &&
    item.positions.length >= 1 &&
    item.positions.length <= CUSTOM_SPREAD_MAX_CARDS &&
    isLayout(item.layout) &&
    typeof item.createdAt === 'string' &&
    typeof item.updatedAt === 'string'
  );
}

export function parseCustomSpreads(raw: string | null): CustomSpread[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isCustomSpread) : [];
  } catch {
    return [];
  }
}

export function loadCustomSpreads(storage: Storage = localStorage) {
  return parseCustomSpreads(storage.getItem(CUSTOM_SPREADS_KEY));
}

export function storeCustomSpreads(
  spreads: CustomSpread[],
  storage: Storage = localStorage,
) {
  storage.setItem(CUSTOM_SPREADS_KEY, JSON.stringify(spreads));
}
