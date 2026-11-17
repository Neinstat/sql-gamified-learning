/**
 * How each customer looks (GAME_DESIGN.md §14.3): riso inks for skin, hair and clothes, used by
 * the 3D models in build.ts. ⚠ Placeholder characters (docs/ASSETS.md).
 */
import type { CustomerLook } from '../../sql-core/truck/orders';
import type { Ink } from '../art/riso';

export type Look = {
  skin: Ink;
  hair: Ink;
  hairStyle: 'short' | 'long' | 'cap' | 'sides';
  hat?: Ink;
  top: Ink;
  topShade: Ink;
  legs: Ink;
  extra?: 'lanyard' | 'glasses' | 'paint' | 'straps';
};

export const LOOKS: Record<CustomerLook, Look> = {
  student: { skin: 'skin1', hair: 'woodDark', hairStyle: 'short', top: 'mustard', topShade: 'mustardDark', legs: 'ink', extra: 'straps' },
  office: { skin: 'skin2', hair: 'ink', hairStyle: 'short', top: 'tealLight', topShade: 'teal', legs: 'inkSoft', extra: 'lanyard' },
  runner: { skin: 'skin3', hair: 'ink', hairStyle: 'cap', hat: 'red', top: 'teal', topShade: 'tealDark', legs: 'ink' },
  grandpa: { skin: 'skin1', hair: 'white', hairStyle: 'sides', top: 'wood', topShade: 'woodDark', legs: 'inkSoft', extra: 'glasses' },
  painter: { skin: 'skin2', hair: 'red', hairStyle: 'long', top: 'pink', topShade: 'red', legs: 'woodDark', extra: 'paint' },
};
