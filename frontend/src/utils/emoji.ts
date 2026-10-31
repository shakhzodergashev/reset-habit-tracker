// One emoji, the same rule as backend/src/habits/emoji.ts: skin tones (👍🏽),
// flags (🇺🇿), keycaps (1️⃣) and joined emojis (👩‍💻) each count as one.
const EMOJI =
  /\p{Regional_Indicator}{2}|[#*0-9]️?⃣|\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:[\u{E0020}-\u{E007E}]+\u{E007F})?(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?)*/gu;

/** The last emoji in some text ("hi 💧📚" -> "📚"), or null if there is none. */
export function lastEmoji(text: string): string | null {
  const all = text.match(EMOJI);
  return all ? all[all.length - 1] : null;
}

/** "12.75" for 12.75, "12" for 12: journey days without trailing zeros. */
export function formatDays(days: number): string {
  return String(Math.round(days * 100) / 100);
}
