export interface PlayerColorDef {
  id: string;
  name: string;
  bgHex: string;
  onColorHex: string; // text/icon color with AA contrast
  stageHex: string; // color-mix(in srgb, bgHex 30%, #0B0A18)
  stageAltHex: string; // slightly lighter tone for checkerboard (~6% difference)
}

export const PLAYER_COLORS: PlayerColorDef[] = [
  {
    id: 'blue',
    name: 'Blue',
    bgHex: '#2F6BFF',
    onColorHex: '#FFFFFF',
    stageHex: 'color-mix(in srgb, #2F6BFF 30%, #0B0A18)',
    stageAltHex: 'color-mix(in srgb, #2F6BFF 36%, #0B0A18)',
  },
  {
    id: 'red',
    name: 'Red',
    bgHex: '#FF3D6E',
    onColorHex: '#FFFFFF',
    stageHex: 'color-mix(in srgb, #FF3D6E 30%, #0B0A18)',
    stageAltHex: 'color-mix(in srgb, #FF3D6E 36%, #0B0A18)',
  },
  {
    id: 'purple',
    name: 'Purple',
    bgHex: '#8B5CF6',
    onColorHex: '#FFFFFF',
    stageHex: 'color-mix(in srgb, #8B5CF6 30%, #0B0A18)',
    stageAltHex: 'color-mix(in srgb, #8B5CF6 36%, #0B0A18)',
  },
  {
    id: 'orange',
    name: 'Orange',
    bgHex: '#FF8A00',
    onColorHex: '#14121F',
    stageHex: 'color-mix(in srgb, #FF8A00 30%, #0B0A18)',
    stageAltHex: 'color-mix(in srgb, #FF8A00 36%, #0B0A18)',
  },
  {
    id: 'teal',
    name: 'Teal',
    bgHex: '#00B4D8',
    onColorHex: '#14121F',
    stageHex: 'color-mix(in srgb, #00B4D8 30%, #0B0A18)',
    stageAltHex: 'color-mix(in srgb, #00B4D8 36%, #0B0A18)',
  },
  {
    id: 'lime',
    name: 'Lime',
    bgHex: '#A3E635',
    onColorHex: '#14121F',
    stageHex: 'color-mix(in srgb, #A3E635 30%, #0B0A18)',
    stageAltHex: 'color-mix(in srgb, #A3E635 36%, #0B0A18)',
  },
  {
    id: 'magenta',
    name: 'Magenta',
    bgHex: '#E0218A',
    onColorHex: '#FFFFFF',
    stageHex: 'color-mix(in srgb, #E0218A 30%, #0B0A18)',
    stageAltHex: 'color-mix(in srgb, #E0218A 36%, #0B0A18)',
  },
  {
    id: 'brown',
    name: 'Brown',
    bgHex: '#8D5B4C',
    onColorHex: '#FFFFFF',
    stageHex: 'color-mix(in srgb, #8D5B4C 30%, #0B0A18)',
    stageAltHex: 'color-mix(in srgb, #8D5B4C 36%, #0B0A18)',
  },
];

/**
 * Returns the PlayerColorDef for a given index (0-7), player id ('p1'..'p8'), or color name.
 */
export function getPlayerColor(indexOrId: number | string): PlayerColorDef {
  if (typeof indexOrId === 'number') {
    return PLAYER_COLORS[Math.abs(indexOrId) % PLAYER_COLORS.length];
  }

  // Check by id
  const byId = PLAYER_COLORS.find(
    (c) => c.id.toLowerCase() === indexOrId.toLowerCase()
  );
  if (byId) return byId;

  // Check for 'p1', 'p2', etc.
  if (indexOrId.startsWith('p') || indexOrId.startsWith('P')) {
    const num = parseInt(indexOrId.slice(1), 10);
    if (!isNaN(num) && num >= 1) {
      return PLAYER_COLORS[(num - 1) % PLAYER_COLORS.length];
    }
  }

  return PLAYER_COLORS[0];
}
