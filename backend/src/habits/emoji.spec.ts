import { isSingleEmoji } from './emoji';

describe('isSingleEmoji', () => {
  it.each(['💧', '📚', '🏃‍♂️', '👍🏽', '👩‍💻', '🇺🇿', '1️⃣', '❤️', '🏴󠁧󠁢󠁳󠁣󠁴󠁿'])(
    'accepts %s',
    (emoji) => {
      expect(isSingleEmoji(emoji)).toBe(true);
    },
  );

  it.each(['', 'a', 'water', '1', '💧💧', '💧 ', 'hi💧', '<script>'])(
    'rejects "%s"',
    (text) => {
      expect(isSingleEmoji(text)).toBe(false);
    },
  );
});
