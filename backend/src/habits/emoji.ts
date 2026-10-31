/**
 * Exactly one emoji, as typed on a phone or computer emoji keyboard. That includes
 * skin tones (👍🏽), flags (🇺🇿), keycaps (1️⃣) and joined emojis (👩‍💻), but not
 * plain text or two emojis.
 */
export const SINGLE_EMOJI =
  /^(?:\p{Regional_Indicator}{2}|[#*0-9]️?⃣|\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:[\u{E0020}-\u{E007E}]+\u{E007F})?(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?)*)$/u;

export function isSingleEmoji(value: string): boolean {
  return SINGLE_EMOJI.test(value);
}
