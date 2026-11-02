import { useEffect, useId, useState } from 'react';
import { FLAG, HEIGHT, KID_SCALE, riderAt, ROAD, WIDTH } from '../journey/hill';
import {
  sceneColors,
  weatherLabel,
  type Weather,
  type WeatherKind,
} from '../journey/weather';
import { useAuth } from '../auth/auth-context';
import {
  BIKE,
  KIDS,
  PAGE_TURN,
  SHOULDER,
  ZZZ,
  type Shape,
} from '../journey/kid';
import './HillScene.css';

/** Draws a list of shapes from journey/kid.ts. */
function Shapes({ shapes }: { shapes: Shape[] }) {
  return shapes.map((shape, i) =>
    shape.kind === 'circle' ? (
      <circle
        key={i}
        cx={shape.cx}
        cy={shape.cy}
        r={shape.r}
        fill={shape.fill}
      />
    ) : (
      <path
        key={i}
        d={shape.d}
        fill={shape.fill ?? 'none'}
        stroke={shape.stroke}
        strokeWidth={shape.width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  );
}

const CLOUDS: Record<WeatherKind, number> = {
  clear: 0,
  partly: 1,
  cloudy: 3,
  fog: 0,
  rain: 3,
  snow: 2,
  storm: 3,
};
const CLOUD_SPOTS = [
  { x: 175, y: 26 },
  { x: 60, y: 22 },
  { x: 118, y: 42 },
];
const STARS = [
  [30, 20],
  [90, 36],
  [150, 14],
  [200, 44],
  [300, 18],
  [120, 60],
];

/** The sky: sun or moon, clouds, rain, snow, lightning or fog, depending on the weather. */
function Sky({ weather }: { weather: Weather }) {
  const colors = sceneColors(weather);
  const { kind, isDay } = weather;
  const showSunOrMoon = kind === 'clear' || kind === 'partly';

  return (
    <g>
      {showSunOrMoon &&
        (isDay ? (
          // Sun and moon stay left of the finish, so the resting rider is easy to see.
          <circle cx={232} cy={24} r={14} fill="#fcd34d" />
        ) : (
          <g>
            {STARS.map(([x, y]) => (
              <circle
                key={`${x}-${y}`}
                cx={x}
                cy={y}
                r={1.2}
                fill="#ffffff"
                opacity={0.8}
              />
            ))}
            {/* A crescent: a pale circle with a sky-coloured circle over one side */}
            <circle cx={232} cy={24} r={11} fill="#f1f5f9" />
            <circle cx={237} cy={20} r={10} fill={colors.skyTop} />
          </g>
        ))}

      {CLOUD_SPOTS.slice(0, CLOUDS[kind]).map(({ x, y }) => (
        <path
          key={x}
          className="hill-cloud"
          d={`M${x},${y} a8,8 0 0 1 5,-14 a12,12 0 0 1 22,-3 a9,9 0 0 1 7,17 Z`}
          fill={colors.cloud}
          opacity={0.95}
        />
      ))}

      {(kind === 'rain' || kind === 'storm') && (
        <g className="hill-rain">
          {Array.from({ length: 16 }, (_, i) => {
            const x = 14 + i * 19;
            const y = 48 + (i % 3) * 14;
            return (
              <line
                key={i}
                x1={x}
                y1={y}
                x2={x - 3}
                y2={y + 9}
                stroke={colors.rain}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      )}

      {kind === 'snow' && (
        <g className="hill-snow">
          {Array.from({ length: 18 }, (_, i) => (
            <circle
              key={i}
              cx={10 + i * 17.5}
              cy={44 + ((i * 37) % 50)}
              r={1.8}
              fill="#ffffff"
            />
          ))}
        </g>
      )}

      {kind === 'storm' && (
        <path
          className="hill-lightning"
          d="M150,30 L140,52 L149,52 L142,72 L160,46 L151,46 Z"
          fill="#facc15"
        />
      )}

      {kind === 'fog' &&
        [40, 62, 84].map((y) => (
          <rect
            key={y}
            x={-10}
            y={y}
            width={340}
            height={9}
            rx={4.5}
            fill="#ffffff"
            opacity={0.45}
          />
        ))}
    </g>
  );
}

/** A wheel with spokes, so you can see it turn. */
function Wheel({ cx, color }: { cx: number; color: string }) {
  return (
    <g className="hill-wheel" stroke={color} fill="none">
      <circle cx={cx} cy={-8} r={7} strokeWidth={2} />
      <path d={`M${cx - 7},-8 H${cx + 7} M${cx},-15 V-1`} strokeWidth={1} />
    </g>
  );
}

// ride: on the bike (also while riding up to the finish, "arrive");
// celebrate: off the bike at the finish, arms up; rest: sitting on the grass.
type Pose = 'ride' | 'arrive' | 'celebrate' | 'rest';

const CONFETTI = [
  { x: -32, y: -40, color: '#f43f5e' },
  { x: -26, y: -47, color: '#facc15' },
  { x: -18, y: -45, color: '#3b82f6' },
  { x: -12, y: -39, color: '#22c55e' },
  { x: -31, y: -33, color: '#a855f7' },
  { x: -13, y: -32, color: '#f97316' },
];

interface HillSceneProps {
  progress: number; // 0 = bottom, 1 = the finish flag
  weather: Weather;
  gainText: (gained: number) => string; // the label after a tick, e.g. "+1" or "+0.25 day"
  label: string; // what screen readers say about the picture
  rideInOnOpen?: boolean; // start at the bottom and ride up to `progress` when shown
}

/** The hill with the weather as its sky, a finish flag, and a cyclist who rides up after every tick. */
export function HillScene({
  progress: target,
  weather,
  gainText,
  label,
  rideInOnOpen = false,
}: HillSceneProps) {
  const colors = sceneColors(weather);
  const { user } = useAuth();
  const kid = KIDS[user?.climber ?? 'boy']; // the climber picked on the Profile page

  // Riding in: show the bottom first, then (a moment later) the real place,
  // so the cyclist rides all the way up like after a tick.
  const [hasRiddenIn, setHasRiddenIn] = useState(!rideInOnOpen);
  useEffect(() => {
    if (hasRiddenIn) return;
    const timer = setTimeout(() => setHasRiddenIn(true), 300);
    return () => clearTimeout(timer);
  }, [hasRiddenIn]);
  const progress = hasRiddenIn ? target : 0;
  const rider = riderAt(progress);
  const skyId = useId(); // a unique id for the sky gradient, in case two hills are on one page

  // What the rider is doing. Already at the finish when the page opens: resting.
  const [pose, setPose] = useState<Pose>(progress >= 1 ? 'rest' : 'ride');

  // When progress changes, start a ride. (React's "remember the previous value" pattern.)
  const [previous, setPrevious] = useState(progress);
  const [ride, setRide] = useState({
    count: 0,
    gained: 0,
    wave: false,
    intro: false,
  });
  if (progress !== previous) {
    setPrevious(progress);
    if (progress > previous) {
      setRide({
        count: ride.count + 1,
        gained: progress - previous,
        // Passing the middle of the hill (but not finishing): wave while riding.
        wave: previous < 0.5 && progress >= 0.5 && progress < 1,
        // The ride-in is not a new tick, so it shows no "+1" label.
        intro: rideInOnOpen && ride.count === 0,
      });
    }
    if (progress >= 1 && previous < 1) setPose('arrive'); // the last tick
    if (progress < 1) setPose('ride'); // an undo: straight back on the bike
  }

  // At the finish: ride up, then celebrate (2s), then rest.
  useEffect(() => {
    const next = { arrive: 'celebrate', celebrate: 'rest' } as const;
    if (pose !== 'arrive' && pose !== 'celebrate') return;
    const timer = setTimeout(
      () => setPose(next[pose]),
      pose === 'arrive' ? 1300 : 2000, // 1.3s: just after the 1.2s ride up
    );
    return () => clearTimeout(timer);
  }, [pose]);

  return (
    <div className="hill-scene">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${label}. Weather: ${weatherLabel(weather)}`}
      >
        <defs>
          <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={colors.skyTop} />
            <stop offset="1" stopColor={colors.skyBottom} />
          </linearGradient>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill={`url(#${skyId})`} />
        <Sky weather={weather} />

        {/* A far-away hill, then the hill itself with the road along its top */}
        <path
          d="M0,110 Q90,60 180,96 T320,80 V150 H0 Z"
          fill={colors.farHill}
        />
        <path d={`${ROAD} V${HEIGHT} H0 Z`} fill={colors.ground} />
        <path
          d={ROAD}
          stroke={colors.road}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />

        {/* The finish flag */}
        <g transform={`translate(${FLAG.x} ${FLAG.y})`}>
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={-26}
            stroke={colors.ink}
            strokeWidth={1.5}
          />
          <rect
            x={0}
            y={-26}
            width={14}
            height={9}
            fill="#ffffff"
            stroke={colors.ink}
            strokeWidth={0.8}
          />
          {[
            [0, -26],
            [7, -26],
            [3.5, -21.5],
            [10.5, -21.5],
          ].map(([x, y]) => (
            <rect
              key={`${x}${y}`}
              x={x}
              y={y}
              width={3.5}
              height={4.5}
              fill="#17201c"
            />
          ))}
        </g>

        {/* The kid on the bike, tilted to match the slope.
            A CSS transition slides it to its new place. */}
        <g
          // The pose class decides which rider is shown (see HillScene.css).
          className={`hill-rider pose-${pose === 'arrive' ? 'ride' : pose}`}
          style={{
            transform: `translate(${rider.x}px, ${rider.y}px) rotate(${rider.angle}deg) scale(${KID_SCALE})`,
          }}
        >
          {/* key = ride.count: a new key restarts the animation on every tick. */}
          <g
            key={ride.count}
            className={[
              'hill-rider-body',
              ride.count > 0 && 'is-riding',
              ride.wave && 'is-waving',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <Wheel cx={-9} color={colors.ink} />
            <Wheel cx={10} color={colors.ink} />
            <Shapes shapes={BIKE} />

            {/* The kid on the bike */}
            <g className="hill-rider-on">
              {/* The legs: 4 drawings, shown one after another while riding (a flip-book). */}
              {kid.legFrames.map((frame, i) => (
                <g key={i} className={`hill-legs hill-legs-${i}`}>
                  <Shapes shapes={frame} />
                </g>
              ))}
              <Shapes shapes={kid.riderBody} />
              {/* The arm on the handlebar... */}
              <g className="hill-arm">
                <Shapes shapes={kid.handlebarArm} />
              </g>
              {/* ...or, halfway up, raised and waving (it turns at the shoulder). */}
              <g transform={`translate(${SHOULDER.x} ${SHOULDER.y})`}>
                <g className="hill-wave-arm">
                  <Shapes shapes={kid.waveArm} />
                </g>
              </g>
              <Shapes shapes={kid.riderHead} />
            </g>

            {/* At the finish: off the bike, arms up, hopping, with confetti */}
            <g className="hill-rider-cheer">
              <g className="hill-cheer-jump">
                <Shapes shapes={kid.cheer} />
              </g>
              {CONFETTI.map(({ x, y, color }) => (
                <rect
                  key={`${x}${y}`}
                  className="hill-confetti"
                  x={x}
                  y={y}
                  width={2.5}
                  height={2.5}
                  fill={color}
                />
              ))}
            </g>

            {/* Then resting on the grass behind the bike: reading a book in the
                daytime, asleep at night. */}
            <g className="hill-rider-rest">
              {weather.isDay ? (
                <>
                  <Shapes shapes={kid.read} />
                  <g className="hill-page">
                    <Shapes shapes={PAGE_TURN} />
                  </g>
                </>
              ) : (
                <>
                  <Shapes shapes={kid.rest} />
                  <text className="hill-zzz" fill={colors.ink}>
                    {ZZZ.map((z) => (
                      <tspan key={z.x} x={z.x} y={z.y} fontSize={z.size}>
                        z
                      </tspan>
                    ))}
                  </text>
                </>
              )}
            </g>
            {ride.count > 0 && !ride.intro && (
              <text
                className="hill-gain"
                x={0}
                y={-46}
                textAnchor="middle"
                fill={colors.road}
              >
                {gainText(ride.gained)}
              </text>
            )}
          </g>
        </g>
      </svg>

      {/* The weather, in words */}
      <span className="hill-weather">{weatherLabel(weather)}</span>
    </div>
  );
}
