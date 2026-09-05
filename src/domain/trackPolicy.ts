export type ProductTrack = 'A' | 'B';

export interface TrackPolicy {
  readonly id: ProductTrack;
  readonly productName: string;
  readonly subtitle: string;
  readonly licensedAssetsAllowed: boolean;
  readonly officialAffiliationAllowed: boolean;
  readonly visualCopyPolicy: 'licensedExact' | 'originalMafiaInspired';
}

export const TRACK_POLICIES: Readonly<Record<ProductTrack, TrackPolicy>> = {
  A: {
    id: 'A',
    productName: 'TGM Alarm Center',
    subtitle: 'Event & Alarm Companion',
    licensedAssetsAllowed: true,
    officialAffiliationAllowed: true,
    visualCopyPolicy: 'licensedExact',
  },
  B: {
    id: 'B',
    productName: 'MAFIA COMMAND CENTER',
    subtitle: 'Event & Alarm Companion',
    licensedAssetsAllowed: false,
    officialAffiliationAllowed: false,
    visualCopyPolicy: 'originalMafiaInspired',
  },
};

const FORBIDDEN_TRACK_B_TERMS = [
  'The Grand Mafia',
  'TGM',
  'Official TGM',
  'Official Grand Mafia',
  'The Grand Mafia Companion',
];

export function validateTrackIdentity(track: ProductTrack, value: string): boolean {
  if (track === 'A') return value.trim().length > 0;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && !FORBIDDEN_TRACK_B_TERMS.some((term) => normalized.includes(term.toLowerCase()));
}

export function assertTrackIdentity(track: ProductTrack, value: string): void {
  if (!validateTrackIdentity(track, value)) throw new Error(`Invalid product identity for Track ${track}`);
}

export function trackPolicy(track: ProductTrack): TrackPolicy {
  return TRACK_POLICIES[track];
}
