export type ProductTrack = 'A' | 'B';

export interface ProductIdentity {
  track: ProductTrack;
  name: string;
  subtitle: string;
  usesLicensedAssets: boolean;
}

export const PRODUCT_IDENTITIES: Record<ProductTrack, ProductIdentity> = {
  A: {
    track: 'A',
    name: 'TGM Alarm Center',
    subtitle: 'Event & Alarm Companion',
    usesLicensedAssets: true,
  },
  B: {
    track: 'B',
    name: 'MAFIA COMMAND CENTER',
    subtitle: 'Event & Alarm Companion',
    usesLicensedAssets: false,
  },
};

export const FORBIDDEN_UNAUTHORIZED_TRACK_B_NAMES = [
  'The Grand Mafia Alarm Center',
  'TGM Alarm Center',
  'Grand Mafia Alert Hub',
  'The Grand Mafia Companion',
  'Official TGM',
  'Official Grand Mafia',
] as const;

export function assertTrackBIdentity(identity: ProductIdentity): void {
  if (identity.track !== 'B') return;
  if (identity.usesLicensedAssets) throw new Error('Track B cannot use licensed/original assets');
  const normalized = identity.name.trim().toLowerCase();
  if (FORBIDDEN_UNAUTHORIZED_TRACK_B_NAMES.some((name) => name.toLowerCase() === normalized)) {
    throw new Error('Track B identity implies unauthorized official affiliation');
  }
}
