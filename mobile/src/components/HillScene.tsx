import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
  TSpan,
} from 'react-native-svg';
import { FLAG, HEIGHT, riderAt, ROAD, WIDTH } from '../journey/hill';
import { sceneColors, weatherLabel, type Weather, type WeatherKind } from '../journey/weather';

// The cyclist lives in its own 64 x 60 box. The point where the wheels touch the road
// is at (34, 50) inside the box; the space above is for the "+1" label, and the space
// on the left is where the rider sits down to rest at the finish.
const BOX_W = 64;
const BOX_H = 60;
const GROUND_X = 34;
const GROUND_Y = 50;

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

/** A soft cloud whose bottom-left corner is at (x, y). */
function Cloud({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <Path
      d={`M${x},${y} a8,8 0 0 1 5,-14 a12,12 0 0 1 22,-3 a9,9 0 0 1 7,17 Z`}
      fill={color}
      opacity={0.95}
    />
  );
}

/** The sky: sun or moon, clouds, rain, snow, lightning or fog, depending on the weather. */
function Sky({ weather }: { weather: Weather }) {
  const colors = sceneColors(weather);
  const { kind, isDay } = weather;
  const showSunOrMoon = kind === 'clear' || kind === 'partly';

  return (
    <G>
      {showSunOrMoon &&
        (isDay ? (
          // Sun and moon stay left of the finish, so the resting rider is easy to see.
          <Circle cx={232} cy={24} r={14} fill="#fcd34d" />
        ) : (
          <G>
            {[
              [30, 20],
              [90, 36],
              [150, 14],
              [200, 44],
              [300, 18],
              [120, 60],
            ].map(([x, y]) => (
              <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.2} fill="#ffffff" opacity={0.8} />
            ))}
            {/* A crescent: a pale circle with a sky-coloured circle over one side */}
            <Circle cx={232} cy={24} r={11} fill="#f1f5f9" />
            <Circle cx={237} cy={20} r={10} fill={colors.skyTop} />
          </G>
        ))}

      {CLOUD_SPOTS.slice(0, CLOUDS[kind]).map((spot) => (
        <Cloud key={spot.x} x={spot.x} y={spot.y} color={colors.cloud} />
      ))}

      {(kind === 'rain' || kind === 'storm') &&
        Array.from({ length: 16 }, (_, i) => {
          const x = 14 + i * 19;
          const y = 48 + (i % 3) * 14;
          return (
            <Line
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

      {kind === 'snow' &&
        Array.from({ length: 18 }, (_, i) => (
          <Circle key={i} cx={10 + i * 17.5} cy={44 + ((i * 37) % 50)} r={1.8} fill="#ffffff" />
        ))}

      {kind === 'storm' && (
        <Path d="M150,30 L140,52 L149,52 L142,72 L160,46 L151,46 Z" fill="#facc15" />
      )}

      {kind === 'fog' &&
        [40, 62, 84].map((y) => (
          <Rect
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
    </G>
  );
}

// ride: on the bike (also while riding up to the finish, "arrive");
// celebrate: off the bike at the finish, arms up; rest: sitting on the grass.
type Pose = 'ride' | 'arrive' | 'celebrate' | 'rest';

/** Which rider is shown for a pose ("arrive" still shows the rider on the bike). */
function shownRider(pose: Pose): 'ride' | 'celebrate' | 'rest' {
  return pose === 'arrive' ? 'ride' : pose;
}

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
  accessibilityLabel: string;
}

/** The hill with the weather as its sky, a finish flag, and a cyclist who rides up after every tick. */
export function HillScene({ progress, weather, gainText, accessibilityLabel }: HillSceneProps) {
  const colors = sceneColors(weather);
  const [width, setWidth] = useState(0); // the drawing's real width, known after layout
  const scale = width / WIDTH;
  const rider = riderAt(progress);

  // What the rider is doing. Already at the finish when the screen opens: resting.
  const [pose, setPose] = useState<Pose>(progress >= 1 ? 'rest' : 'ride');

  // When progress changes, start a ride. (React's "remember the previous value" pattern.)
  const [previous, setPrevious] = useState(progress);
  const [ride, setRide] = useState({ count: 0, gained: 0, wave: false });
  if (progress !== previous) {
    setPrevious(progress);
    if (progress > previous) {
      setRide({
        count: ride.count + 1,
        gained: progress - previous,
        // Passing the middle of the hill (but not finishing): wave while riding.
        wave: previous < 0.5 && progress >= 0.5 && progress < 1,
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

  // Animated values: where the cyclist is (in drawing units), and how far through a ride (0 to 1).
  const position = useRef(new Animated.ValueXY({ x: rider.x, y: rider.y })).current;
  const riding = useRef(new Animated.Value(1)).current;
  const waving = useRef(new Animated.Value(1)).current; // 0 to 1 during a halfway wave
  const hop = useRef(new Animated.Value(0)).current; // loops 0 to 1 while celebrating
  // How visible each rider is: on the bike, cheering, resting (1 = shown).
  const onBike = useRef(new Animated.Value(shownRider(pose) === 'ride' ? 1 : 0)).current;
  const cheering = useRef(new Animated.Value(0)).current;
  const resting = useRef(new Animated.Value(pose === 'rest' ? 1 : 0)).current;

  // Slide to the new place on the road (up after a tick, down after an undo).
  useEffect(() => {
    Animated.timing(position, {
      toValue: { x: rider.x, y: rider.y },
      duration: 1200,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [position, rider.x, rider.y]);

  // On every tick that moves us up: spin the wheels, bob the rider, float the label.
  useEffect(() => {
    if (ride.count === 0) return;
    riding.setValue(0);
    Animated.timing(riding, {
      toValue: 1,
      duration: 1600,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [riding, ride.count]);

  // Halfway up: wave during the ride.
  useEffect(() => {
    if (!ride.wave) return;
    waving.setValue(0);
    Animated.timing(waving, {
      toValue: 1,
      duration: 1600,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [waving, ride.wave, ride.count]);

  // Switch riders with a short fade, and hop while celebrating.
  useEffect(() => {
    const now = shownRider(pose);
    const riders = [
      [onBike, 'ride'],
      [cheering, 'celebrate'],
      [resting, 'rest'],
    ] as const;
    for (const [value, which] of riders) {
      Animated.timing(value, {
        toValue: now === which ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    if (now !== 'celebrate') return;
    hop.setValue(0);
    const loop = Animated.loop(
      Animated.timing(hop, { toValue: 1, duration: 400, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pose, onBike, cheering, resting, hop]);

  // The waving arm swings back and forth at the shoulder; the handlebar arm hides meanwhile.
  const waveAngle = waving.interpolate({
    inputRange: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
    outputRange: [
      '-20deg',
      '25deg',
      '-20deg',
      '25deg',
      '-20deg',
      '25deg',
      '-20deg',
      '25deg',
      '-20deg',
    ],
  });
  const waveArm = waving.interpolate({
    inputRange: [0, 0.01, 0.99, 1],
    outputRange: [0, 1, 1, 0],
  });
  const handlebarArm = waving.interpolate({
    inputRange: [0, 0.01, 0.99, 1],
    outputRange: [1, 0, 0, 1],
  });
  const hopUp = hop.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -4 * scale, 0],
  });
  const confettiBlink = hop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1, 0.2] });

  const wheelSpin = riding.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: ['0deg', '720deg', '720deg'],
  });
  const bob = riding.interpolate({
    inputRange: [0, 0.09, 0.19, 0.28, 0.37, 0.47, 0.56, 0.66, 0.75, 1],
    outputRange: [0, -1.5, 0, -1.5, 0, -1.5, 0, -1.5, 0, 0].map((v) => v * scale),
  });
  const labelOpacity = riding.interpolate({
    inputRange: [0, 0.15, 0.7, 1],
    outputRange: [0, 1, 1, 0],
  });
  const labelRise = riding.interpolate({
    inputRange: [0, 1],
    outputRange: [4 * scale, -8 * scale],
  });

  return (
    // The box keeps the drawing's shape at any phone width.
    <View
      style={{ width: '100%', aspectRatio: WIDTH / HEIGHT }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={`${accessibilityLabel}. Weather: ${weatherLabel(weather)}`}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.skyTop} />
            <Stop offset="1" stopColor={colors.skyBottom} />
          </LinearGradient>
        </Defs>
        <Rect width={WIDTH} height={HEIGHT} fill="url(#sky)" />
        <Sky weather={weather} />

        {/* A far-away hill, then the hill itself with the road along its top */}
        <Path d="M0,110 Q90,60 180,96 T320,80 V150 H0 Z" fill={colors.farHill} />
        <Path d={`${ROAD} V${HEIGHT} H0 Z`} fill={colors.ground} />
        <Path d={ROAD} stroke={colors.road} strokeWidth={3} fill="none" strokeLinecap="round" />

        {/* The finish flag */}
        <G transform={`translate(${FLAG.x}, ${FLAG.y})`}>
          <Line x1={0} y1={0} x2={0} y2={-26} stroke={colors.ink} strokeWidth={1.5} />
          <Rect
            x={0}
            y={-26}
            width={14}
            height={9}
            fill="#ffffff"
            stroke={colors.ink}
            strokeWidth={0.8}
          />
          <Rect x={0} y={-26} width={3.5} height={4.5} fill="#17201c" />
          <Rect x={7} y={-26} width={3.5} height={4.5} fill="#17201c" />
          <Rect x={3.5} y={-21.5} width={3.5} height={4.5} fill="#17201c" />
          <Rect x={10.5} y={-21.5} width={3.5} height={4.5} fill="#17201c" />
        </G>
      </Svg>

      {/* The weather, in words */}
      <Text
        style={{
          position: 'absolute',
          top: 8,
          left: 10,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: 'rgba(0,0,0,0.25)',
          color: '#ffffff',
          fontSize: 13,
          fontWeight: '600',
        }}
      >
        {weatherLabel(weather)}
      </Text>

      {/* The cyclist (a simple placeholder drawing), on top of the scene. */}
      {width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: BOX_W * scale,
            height: BOX_H * scale,
            // Turn around the point where the wheels touch the road.
            transformOrigin: `${(GROUND_X / BOX_W) * 100}% ${(GROUND_Y / BOX_H) * 100}%`,
            transform: [
              { translateX: Animated.multiply(Animated.add(position.x, -GROUND_X), scale) },
              { translateY: Animated.multiply(Animated.add(position.y, -GROUND_Y), scale) },
              { rotate: `${rider.angle}deg` },
            ],
          }}
        >
          <Animated.View style={{ flex: 1, transform: [{ translateY: bob }] }}>
            {/* The bike frame. viewBox puts (0, 0) where the wheels touch the road. */}
            <Svg
              style={StyleSheet.absoluteFill}
              viewBox={`${-GROUND_X} ${-GROUND_Y} ${BOX_W} ${BOX_H}`}
            >
              <Path
                d="M-9,-8 L0,-8 L-3,-18 Z M0,-8 L8,-19 L-3,-18 M8,-19 L10,-8"
                stroke={colors.ink}
                strokeWidth={2}
                fill="none"
                strokeLinejoin="round"
              />
            </Svg>

            {/* The rider on the bike */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: onBike }]}>
              <Svg
                width="100%"
                height="100%"
                viewBox={`${-GROUND_X} ${-GROUND_Y} ${BOX_W} ${BOX_H}`}
              >
                <G strokeLinecap="round">
                  <Line x1={-3} y1={-19} x2={3} y2={-30} stroke="#ea580c" strokeWidth={4} />
                  <Line x1={-3} y1={-19} x2={1} y2={-9} stroke={colors.ink} strokeWidth={2.5} />
                </G>
                <Circle cx={6} cy={-35} r={4.5} fill={colors.ink} />
              </Svg>
              {/* The arm on the handlebar... */}
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: handlebarArm }]}>
                <Svg
                  width="100%"
                  height="100%"
                  viewBox={`${-GROUND_X} ${-GROUND_Y} ${BOX_W} ${BOX_H}`}
                >
                  <Line
                    x1={3}
                    y1={-30}
                    x2={8}
                    y2={-20}
                    stroke="#ea580c"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                </Svg>
              </Animated.View>
              {/* ...or, halfway up, raised and waving. Its box turns around the shoulder. */}
              <Animated.View
                style={{
                  position: 'absolute',
                  left: (GROUND_X + 3 - 2) * scale,
                  top: (GROUND_Y - 30 - 13) * scale,
                  width: 8 * scale,
                  height: 14 * scale,
                  opacity: waveArm,
                  transformOrigin: '25% 92.86%', // the shoulder: (2, 13) in the 8 x 14 box
                  transform: [{ rotate: waveAngle }],
                }}
              >
                <Svg width="100%" height="100%" viewBox="-2 -13 8 14">
                  <Line
                    x1={0}
                    y1={0}
                    x2={3}
                    y2={-11}
                    stroke="#ea580c"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                </Svg>
              </Animated.View>
            </Animated.View>

            {/* The rider celebrating: off the bike, arms up, hopping, with confetti */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: cheering }]}>
              <Animated.View
                style={[StyleSheet.absoluteFill, { transform: [{ translateY: hopUp }] }]}
              >
                <Svg
                  width="100%"
                  height="100%"
                  viewBox={`${-GROUND_X} ${-GROUND_Y} ${BOX_W} ${BOX_H}`}
                >
                  <G strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <Path d="M-25,0 L-22,-10 L-19,0" stroke={colors.ink} strokeWidth={2.5} />
                    <Line x1={-22} y1={-10} x2={-22} y2={-21} stroke="#ea580c" strokeWidth={4} />
                    <Path d="M-29,-31 L-22,-19 L-15,-31" stroke="#ea580c" strokeWidth={2.5} />
                  </G>
                  <Circle cx={-22} cy={-27} r={4.5} fill={colors.ink} />
                </Svg>
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: confettiBlink }]}>
                <Svg
                  width="100%"
                  height="100%"
                  viewBox={`${-GROUND_X} ${-GROUND_Y} ${BOX_W} ${BOX_H}`}
                >
                  {CONFETTI.map(({ x, y, color }) => (
                    <Rect key={x + ',' + y} x={x} y={y} width={2.5} height={2.5} fill={color} />
                  ))}
                </Svg>
              </Animated.View>
            </Animated.View>

            {/* The rider resting: sitting on the grass behind the bike, hand on knee */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: resting }]}>
              <Svg
                width="100%"
                height="100%"
                viewBox={`${-GROUND_X} ${-GROUND_Y} ${BOX_W} ${BOX_H}`}
              >
                <G strokeLinecap="round">
                  <Path
                    d="M-26,-2 L-19,-8 L-13,-1"
                    stroke={colors.ink}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinejoin="round"
                  />
                  <Line x1={-26} y1={-3} x2={-24} y2={-15} stroke="#ea580c" strokeWidth={4} />
                  <Line x1={-24} y1={-13} x2={-19} y2={-8} stroke="#ea580c" strokeWidth={2.5} />
                </G>
                <Circle cx={-23} cy={-20} r={4.5} fill={colors.ink} />
                <SvgText fill={colors.ink} fontWeight="800" opacity={0.8}>
                  <TSpan x={-16} y={-26} fontSize={6}>
                    z
                  </TSpan>
                  <TSpan x={-11} y={-31} fontSize={8}>
                    z
                  </TSpan>
                </SvgText>
              </Svg>
            </Animated.View>

            {/* The two wheels, each spinning around its own centre. */}
            {[-9, 10].map((wheelX) => (
              <Animated.View
                key={wheelX}
                style={{
                  position: 'absolute',
                  left: (GROUND_X + wheelX - 8) * scale,
                  top: (GROUND_Y - 8 - 8) * scale,
                  width: 16 * scale,
                  height: 16 * scale,
                  transform: [{ rotate: wheelSpin }],
                }}
              >
                <Svg width="100%" height="100%" viewBox="-8 -8 16 16">
                  <Circle r={7} stroke={colors.ink} strokeWidth={2} fill="none" />
                  <Path d="M-7,0 H7 M0,-7 V7" stroke={colors.ink} strokeWidth={1} />
                </Svg>
              </Animated.View>
            ))}

            {/* "+1", floating up and fading after a tick */}
            {ride.count > 0 && (
              <Animated.Text
                style={{
                  position: 'absolute',
                  top: 0,
                  left: -20 * scale,
                  right: -20 * scale,
                  textAlign: 'center',
                  fontSize: 11 * scale,
                  fontWeight: '800',
                  color: colors.road,
                  opacity: labelOpacity,
                  transform: [{ translateY: labelRise }],
                }}
              >
                {gainText(ride.gained)}
              </Animated.Text>
            )}
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}
