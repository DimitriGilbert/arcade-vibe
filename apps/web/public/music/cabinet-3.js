// LO-FI HIP HOP - "Rainy Afternoon"
// 78 BPM | Chill study beats | Jazzy chords, dusty drums, warm bass
// Structure: Intro(4) → Main(8) → Bridge(4) → Main reprise(8) loop

// ─────────────────────────────────────────────
// DRUMS — swung 8th-note feel, deliberately loose
// ─────────────────────────────────────────────

// Kick: simple 4/4 with some ghost notes, slightly degraded
const kick = s("<[bd ~ bd ~] [bd ~ [bd bd] ~]>")
  .bank("RolandTR808")
  .gain(0.85)
  .degradeBy(0.08)  // Randomly drops a hit sometimes for organic feel

// Snare: loose, sitting back in the pocket
const snare = s("~ [sd:2] ~ [sd:2 ~]")
  .bank("RolandTR808")
  .gain(0.55)
  .room(0.15)

// Hi-hats: swung pattern with velocity variation
const hats = s("<[hh hh:1 hh hh:2]*4 [[hh hh] hh:1 hh hh:2]*4>")
  .bank("RolandTR808")
  .gain("[0.3 0.2 0.4 0.15]*4")
  .pan(sine.range(0.35, 0.65).slow(8))  // Gentle auto-pan wobble
  .lpf(8000)

// Vinyl crackle: add warmth
const crackle = s("cp*8")
  .bank("RolandTR808")
  .gain(0.04)
  .speed(perlin.range(0.8, 1.1))  // Slightly random pitch = vinyl feel
  .pan(rand)

// ─────────────────────────────────────────────
// BASS — warm, round, simple
// ─────────────────────────────────────────────

// Bass stays filtered (no highs), laid back timing
const bass = note(`
  <
    [~ d2 ~ d2] [~ g2 ~ g2] [~ e2 ~ e2] [~ a2 ~ a2]
    [~ d2 ~ d2] [~ f2 ~ f2] [~ e2 ~ e2] [~ a2 g2 ~]
  >
`)
  .s("triangle")  // Triangle = round & vintage
  .lpf(sine.range(180, 500).slow(16))  // Subtle LPF wobble adds life
  .decay(0.25).sustain(0.3)
  .gain(0.6)

// ─────────────────────────────────────────────
// CHORDS — dusty jazz voicings
// ─────────────────────────────────────────────

// Main progression: Dm7 - G7 - Em7 - A7 (ii-V-I jazz cycle in D minor)
const chordsMain = note(`
  <
    [d3,f3,a3,c4] [g2,b2,d3,f3] [e3,g3,b3,d4] [a2,c3,e3,g3]
    [d3,f3,a3,c4] [f3,a3,c4,e4] [e3,g3,b3,d4] [a2,c#3,e3,g3]
  >
`)
  .s("gm_epiano1")  // Rhodes-style for that lo-fi flavor
  .gain(0.35)
  .lpf(2800)
  .room(0.2)
  .pan(0.45)

// Bridge chords: chromatic dip
const chordsBridge = note(`
  <
    [f3,a3,c4,eb4] [bb2,d3,f3,a3] [eb3,g3,bb3,d4] [ab2,c3,eb3,g3]
  >
`)
  .s("gm_epiano1")
  .gain(0.3)
  .lpf(2200)
  .room(0.3)
  .pan(0.45)

// ─────────────────────────────────────────────
// MELODY — simple, spacious, looping
// ─────────────────────────────────────────────

const melodyMain = note(`
  <
    [~ ~ d5 ~] [c5 ~ a4 ~] [~ b4 ~ g4] [a4 ~ ~ ~]
    [~ ~ d5 ~] [f5 ~ e5 ~] [~ d5 ~ c5] [a4 ~ ~ ~]
  >
`)
  .s("gm_flute")
  .gain(0.28)
  .lpf(4000)
  .delay(0.4)
  .delaytime(0.375)  // Dotted 8th delay = rhythmic interest
  .delayfeedback(0.5)
  .room(0.3)

const melodyBridge = note(`
  <
    [f5 ~ eb5 ~] [d5 ~ bb4 ~] [~ eb5 ~ db5] [c5 ~ ~ ~]
  >
`)
  .s("gm_flute")
  .gain(0.25)
  .lpf(3500)
  .delay(0.45)
  .delaytime(0.375)
  .delayfeedback(0.55)
  .room(0.4)

// ─────────────────────────────────────────────
// FULL ARRANGEMENT
// ─────────────────────────────────────────────

stack(
  // Drums present throughout (kick only in intro)
  arrange(
    [4, kick],
    [4, stack(kick, snare, hats, crackle)],
    [4, stack(kick, snare, hats, crackle)],
    [12, stack(kick, snare, hats, crackle)]
  ),
  // Bass: enters bar 5
  arrange(
    [4, silence],
    [20, bass]
  ),
  // Chords
  arrange(
    [4, silence],
    [8, chordsMain],
    [4, chordsBridge],
    [8, chordsMain]
  ),
  // Melody: enters bar 9
  arrange(
    [8, silence],
    [8, melodyMain],
    [4, melodyBridge],
    [4, melodyMain]
  )
).cpm(78 / 4)
