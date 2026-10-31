import './HabitEmoji.css';

interface HabitEmojiProps {
  emoji: string | null;
  name: string; // without an emoji, the tile shows the name's first letter
  size?: number;
}

/** A rounded square with the habit's emoji in it. */
export function HabitEmoji({ emoji, name, size = 40 }: HabitEmojiProps) {
  return (
    <span
      className={`habit-emoji${emoji ? '' : ' is-letter'}`}
      style={{ width: size, height: size, fontSize: size * 0.55 }}
      aria-hidden="true"
    >
      {emoji ?? name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
