import type { User } from '../generated/prisma/client';

/** The two climbers the user can pick for the hill. */
export const CLIMBERS = ['boy', 'girl'] as const;

/** The colours the user can pick for buttons, ticks and the bike. */
export const ACCENTS = [
  'purple',
  'blue',
  'green',
  'orange',
  'pink',
  'red',
] as const;

// The user fields that are safe to send to the client (never the password hash).
export const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  timeZone: true,
  climber: true,
  accent: true,
  createdAt: true,
} as const;

export type PublicUser = Pick<
  User,
  'id' | 'email' | 'timeZone' | 'climber' | 'accent' | 'createdAt'
>;

/** Copies only the safe fields, e.g. from a full user row that has the hash. */
export function toPublicUser(user: PublicUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    timeZone: user.timeZone,
    climber: user.climber,
    accent: user.accent,
    createdAt: user.createdAt,
  };
}
