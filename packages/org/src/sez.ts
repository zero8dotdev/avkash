// Pure SEZ helpers — no DB imports, safe to unit-test and import in pure logic.
export type LaborRegime = 'STANDARD' | 'SEZ' | 'SHOP_ESTABLISHMENT' | 'OTHER';

export function isSEZ(loc: { laborRegime: string }): boolean {
  return loc.laborRegime === 'SEZ';
}
