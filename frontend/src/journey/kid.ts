// The kid on the bike, drawn as simple shapes. The iPhone app has the same file,
// so both apps draw the same kid. Coordinates: (0, 0) is where the wheels touch
// the road, x goes right (the way the kid rides), y goes down (so up is negative).
//
// There are two climbers, a boy and a girl (picked on the Profile page). They
// share every pose; only the look changes: colours, and the girl's ponytail.

export type Shape =
  | { kind: 'path'; d: string; fill?: string; stroke?: string; width?: number }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill: string };

export type Climber = 'boy' | 'girl';

/** What makes one climber look different from the other. */
interface Look {
  shirt: string;
  shorts: string;
  cap: string;
  capDark: string; // the brim and the button on top
  backpack: string;
  ponytail: boolean;
}

const BOY: Look = {
  shirt: '#c9d9fb',
  shorts: '#3b4fa8',
  cap: '#6278d8',
  capDark: '#4c5fc0',
  backpack: '#f59e0b',
  ponytail: false,
};

const GIRL: Look = {
  shirt: '#fecdd3',
  shorts: '#be185d',
  cap: '#f472b6',
  capDark: '#db2777',
  backpack: '#2dd4bf',
  ponytail: true,
};

const SKIN = '#f6c9a3';
const SKIN_FAR = '#dfa883'; // the leg on the far side, a little darker
const HAIR = '#5b3a29';
const SHOE = '#2b2540';
const FRAME = '#7c5cf0'; // the purple bike
const FACE = '#3a2530';

const line = (d: string, stroke: string, width: number): Shape => ({
  kind: 'path',
  d,
  stroke,
  width,
});
const dot = (cx: number, cy: number, r: number, fill: string): Shape => ({
  kind: 'circle',
  cx,
  cy,
  r,
  fill,
});

type Face = 'smile' | 'grin' | 'sleep' | 'read';

/** A round head with a cap, facing right. (x, y) is the middle of the head. */
function head(look: Look, x: number, y: number, face: Face): Shape[] {
  const shapes: Shape[] = [];
  if (look.ponytail) {
    // Behind the head: a ponytail swinging back from under the cap, and longer hair.
    shapes.push(
      {
        kind: 'path',
        d: `M${x - 4.2},${y - 3.4} q-5.2,-0.6 -6.4,5.6 q2.6,-2.6 5.4,-1.2 Z`,
        fill: HAIR,
      },
      dot(x - 4.6, y + 1.8, 1.8, HAIR),
    );
  }
  shapes.push(
    dot(x - 4.4, y + 0.5, 1.6, HAIR), // hair peeking out at the back
    dot(x, y, 5.5, SKIN),
    dot(x - 2, y + 0.5, 1.2, '#eab38c'), // ear
    dot(x + 3, y + 1.4, 0.9, '#f4a3a3'), // rosy cheek
  );
  if (face === 'read') {
    shapes.push(dot(x + 2.4, y + 0.3, 0.75, FACE)); // eye looking down at the book
    if (look.ponytail) {
      shapes.push(line(`M${x + 2.8},${y - 0.1} l0.9,-0.5`, FACE, 0.45)); // eyelash
    }
  } else if (face === 'sleep') {
    shapes.push(line(`M${x + 1.2},${y - 0.5} q0.8,0.6 1.6,0`, FACE, 0.6));
  } else {
    shapes.push(dot(x + 2.3, y - 0.6, 0.75, FACE)); // eye
    if (look.ponytail) {
      shapes.push(line(`M${x + 2.7},${y - 1.2} l0.9,-0.8`, FACE, 0.45)); // eyelash
    }
  }
  shapes.push(
    face === 'grin'
      ? line(`M${x + 1},${y + 2.3} q1.4,1.4 2.8,0`, FACE, 0.7)
      : line(`M${x + 1.6},${y + 2.4} q1,0.8 2,0`, FACE, 0.6),
    // The cap: a dome over the top of the head, a brim to the front, a button.
    {
      kind: 'path',
      d: `M${x - 5.6},${y - 1.3} A5.7,5.7 0 0 1 ${x + 5.7},${y - 1.6} Z`,
      fill: look.cap,
    },
    line(`M${x + 4.2},${y - 1.6} L${x + 9},${y - 1}`, look.capDark, 1.8),
    dot(x, y - 7, 0.8, look.capDark),
  );
  return shapes;
}

// ---------- the same for both climbers ----------

/** The bike frame, seat and handlebar (the wheels are drawn on their own, to spin). */
export const BIKE: Shape[] = [
  line('M-9,-8 L0,-8 L-3,-18 Z M0,-8 L8,-19 L-3,-18 M8,-19 L10,-8', FRAME, 2.2),
  line('M-6,-19.5 L-0.5,-19.5', SHOE, 2.2), // seat
  line('M8,-19 L7,-22.5 L10.5,-23', SHOE, 1.8), // handlebar
];

/** Where the shoulder is: the waving arm turns around this point. */
export const SHOULDER = { x: 0.5, y: -28.5 };

/** A page being turned: shown now and then over the right-hand page. */
export const PAGE_TURN: Shape[] = [
  {
    kind: 'path',
    d: 'M-20,-13 L-18.4,-16 L-18.4,-12.4 L-20,-9.4 Z',
    fill: '#f1f0f7',
  },
];

/** Where the resting kid's "z z" floats. */
export const ZZZ = [
  { x: -18, y: -26, size: 6 },
  { x: -14, y: -31, size: 8 },
];

/**
 * Where the knee goes, so a thigh of length `a` and a shin of length `b` reach
 * from the hip to the foot (the knee bends forward, the way a rider's does).
 */
function kneeBetween(
  hip: { x: number; y: number },
  foot: { x: number; y: number },
  a: number,
  b: number,
) {
  const dx = foot.x - hip.x;
  const dy = foot.y - hip.y;
  const d = Math.min(Math.hypot(dx, dy), a + b - 0.01);
  const toFoot = Math.atan2(dy, dx);
  // The law of cosines gives the angle between the thigh and the hip-to-foot line.
  const bend = Math.acos((a * a + d * d - b * b) / (2 * a * d));
  const options = [toFoot - bend, toFoot + bend].map((t) => ({
    x: hip.x + a * Math.cos(t),
    y: hip.y + a * Math.sin(t),
  }));
  return options[0].x > options[1].x ? options[0] : options[1];
}

/**
 * The legs at 4 moments of one turn of the pedals. Showing them one after
 * another, quickly, makes the kid pedal (like a flip-book).
 */
const LEG_FRAMES: Shape[][] = [0, 1, 2, 3].map((step) => {
  const crank = { x: 0, y: -8 };
  const hip = { x: -3, y: -19 };
  const angle = (step * Math.PI) / 2;
  return [angle + Math.PI, angle].flatMap((a, i) => {
    const foot = {
      x: crank.x + 3.5 * Math.cos(a),
      y: crank.y + 3.5 * Math.sin(a),
    };
    const knee = kneeBetween(hip, foot, 7.5, 8);
    const skin = i === 0 ? SKIN_FAR : SKIN; // the far leg first, behind
    return [
      line(`M${crank.x},${crank.y} L${foot.x},${foot.y}`, SHOE, 1.2), // pedal arm
      line(
        `M${hip.x},${hip.y} L${knee.x},${knee.y} L${foot.x},${foot.y}`,
        skin,
        2.6,
      ),
      line(`M${foot.x - 1.2},${foot.y} L${foot.x + 1.8},${foot.y}`, SHOE, 2.2), // shoe
    ];
  });
});

// ---------- one climber ----------

/** Every pose of one climber, ready to draw. */
export interface Kid {
  riderBody: Shape[]; // backpack, shirt and shorts, sitting on the bike
  riderHead: Shape[];
  handlebarArm: Shape[];
  waveArm: Shape[]; // drawn from the shoulder at (0, 0)
  legFrames: Shape[][];
  cheer: Shape[]; // at the finish, next to the bike, arms up
  read: Shape[]; // in the daytime, on the grass with a book
  rest: Shape[]; // at night, on the grass, asleep
}

function drawKid(look: Look): Kid {
  return {
    riderBody: [
      {
        kind: 'path',
        d: 'M-9.5,-29.5 q-1,0 -0.9,1.4 l0.5,7.4 q0.2,1.4 1.6,1.4 l3.3,0 q1.2,0 1,-1.4 l-0.8,-7.6 q-0.2,-1.2 -1.4,-1.2 Z',
        fill: look.backpack,
      },
      line('M-3,-19 L0.5,-28.5', look.shirt, 5.5),
      line('M-4.6,-19.6 L0.2,-18.2', look.shorts, 4.6), // shorts, over the top of the legs
    ],

    riderHead: head(look, 3, -34, 'smile'),

    handlebarArm: [
      line('M0.5,-27.5 L4.5,-24', look.shirt, 2.8),
      line('M4.5,-24 L8.5,-22.6', SKIN, 2.2),
      dot(8.8, -22.6, 1.2, SKIN),
    ],

    waveArm: [
      line('M0,0 L0.8,-3', look.shirt, 2.8),
      line('M0.8,-3 L1.6,-6 L3,-10.5', SKIN, 2.2),
      dot(3.1, -11, 1.3, SKIN),
    ],

    legFrames: LEG_FRAMES,

    cheer: [
      line('M-24.5,-0.5 L-23,-9', SKIN_FAR, 2.6),
      line('M-19.5,-0.5 L-21,-9', SKIN, 2.6),
      line('M-25.8,-0.4 L-23.3,-0.4', SHOE, 2.2),
      line('M-20.5,-0.4 L-17.8,-0.4', SHOE, 2.2),
      { kind: 'path', d: 'M-27,-21 h4.5 v8 h-4.5 Z', fill: look.backpack },
      line('M-22,-10.5 L-22,-19.5', look.shirt, 6),
      line('M-23.6,-11 L-20.4,-11', look.shorts, 4.6),
      line('M-23.5,-18.5 L-27,-23.5 L-28.5,-29', SKIN, 2.3),
      line('M-20.5,-18.5 L-17,-23.5 L-15.5,-29', SKIN, 2.3),
      dot(-28.6, -29.5, 1.3, SKIN),
      dot(-15.4, -29.5, 1.3, SKIN),
      ...head(look, -22, -25.5, 'grin'),
    ],

    read: [
      { kind: 'path', d: 'M-34,-6.5 h5.5 v6 h-5.5 Z', fill: look.backpack }, // backpack on the grass
      line('M-25,-3.5 L-19.5,-9.5 L-14.5,-1', SKIN, 2.6),
      line('M-15.5,-0.6 L-12.5,-0.6', SHOE, 2.2),
      line('M-25.5,-4 L-26.5,-13.5', look.shirt, 6),
      line('M-27,-3.8 L-22.6,-5.2', look.shorts, 4.6),
      ...head(look, -26, -19.5, 'read'),
      // The open book, resting on the knee: a red cover with two white pages.
      {
        kind: 'path',
        d: 'M-23.6,-15.4 L-20,-13.6 L-16.4,-15.4 L-16.4,-10.4 L-20,-8.6 L-23.6,-10.4 Z',
        fill: '#e11d48',
      },
      {
        kind: 'path',
        d: 'M-23,-14.6 L-20,-13 L-20,-9.4 L-23,-11 Z',
        fill: '#ffffff',
      },
      {
        kind: 'path',
        d: 'M-20,-13 L-17,-14.6 L-17,-11 L-20,-9.4 Z',
        fill: '#ffffff',
      },
      // The arm holding the book.
      line('M-26,-12.5 L-23.5,-10.5 L-21.5,-10.3', SKIN, 2.3),
    ],

    rest: [
      { kind: 'path', d: 'M-34,-6.5 h5.5 v6 h-5.5 Z', fill: look.backpack }, // backpack on the grass
      line('M-25,-3.5 L-19.5,-9.5 L-14.5,-1', SKIN, 2.6),
      line('M-15.5,-0.6 L-12.5,-0.6', SHOE, 2.2),
      line('M-25.5,-4 L-26.5,-13.5', look.shirt, 6),
      line('M-27,-3.8 L-22.6,-5.2', look.shorts, 4.6),
      line('M-26,-12.5 L-22,-10 L-19.8,-9.8', SKIN, 2.3),
      ...head(look, -26, -19.5, 'sleep'),
    ],
  };
}

/** Both climbers, drawn once when the app starts. */
export const KIDS: Record<Climber, Kid> = {
  boy: drawKid(BOY),
  girl: drawKid(GIRL),
};
