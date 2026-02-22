// CYBERPUNK - "Ghost Signal"
// 140 BPM | Dark industrial electro | Glitchy, dystopian, relentless
// Structure: Intro(4) → Drive(8) → Glitch-break(4) → Full(8) loop

// ─────────────────────────────────────────────
// DRUMS — hard, mechanical, angular
// ─────────────────────────────────────────────

const kick = arrange(
  // Intro: kick stutters in
  [2, s("bd ~ ~ ~").bank("RolandTR707").gain(1.2).clip(1.3)],
  [2, s("bd ~ bd ~").bank("RolandTR707").gain(1.2).clip(1.3)],
  // Drive: industrial 4/4 with sidestick
  [8, s(`
    <
      [bd ~ bd [~ bd]] [bd ~ bd [~ bd]]
      [bd ~ bd [~ bd]] [bd [bd bd] bd [~ bd bd]]
    >
  `).bank("RolandTR707").gain(1.3).clip(1.5).room(0.1)],
  // Glitch: kick stutters, skips
  [4, s("bd*8").bank("RolandTR707").gain(1.2).degradeBy(0.4).speed("<1 2 0.5 1>")],
  // Full: driving again
  [8, s(`
    <
      [bd ~ bd [~ bd]] [bd ~ bd [~ bd]]
      [bd ~ bd [~ bd]] [bd [bd bd] bd [~ bd bd]]
    >
  `).bank("RolandTR707").gain(1.3).clip(1.5).room(0.1)]
)

const snare = s(`
  <
    [~ sd ~ sd] [~ sd ~ [sd sd]] [~ sd ~ sd] [~ [sd cp] ~ sd]
  >
`)
  .bank("RolandTR707").gain(0.75).room(0.15)

// Closed hats: mechanical 16ths with dynamic variation
const hats = s("hh*16")
  .bank("RolandTR707")
  .gain("[0.3 0.1 0.5 0.1 0.3 0.15 0.5 0.1]*2")
  .pan(saw.range(0.2, 0.8).slow(2))  // Sweeping pan = robotic feel

// Metal clank accent — very industrial
const clank = s("<~ [rim ~] ~ [rim rim]>")
  .bank("RolandTR707").gain(0.45).speed(2.0).room(0.2)

// Glitch percussion: random bit-crushed hits
const glitch = arrange(
  [4, silence],
  [8, s("cp*16").bank("RolandTR707").gain(0.12).degradeBy(0.75).speed(rand.range(0.5, 4))],
  [4, s("cp*32").bank("RolandTR707").gain(0.15).degradeBy(0.5).speed(rand.range(0.25, 4))],
  [8, s("cp*16").bank("RolandTR707").gain(0.1).degradeBy(0.8).speed(rand.range(0.5, 4))]
)

// ─────────────────────────────────────────────
// BASS — dark, industrial saw
// ─────────────────────────────────────────────

const bass = arrange(
  [4, silence],
  // Drive: heavy octave bass, LPF just barely opens
  [8, note("<[a1 a1 a1 c2] [g1 g1 g1 bb1] [f1 f1 f1 ab1] [e1 e1 e1 g1]>*4")
    .s("sawtooth")
    .lpf(sine.range(120, 800).slow(8))
    .lpq(10).decay(0.08).sustain(0).gain(0.85)],
  // Glitch break: bass drops away, then single low drone
  [4, note("<a1 ~ a0 ~>")
    .s("sawtooth").lpf(300).lpq(15).decay(0.5).sustain(0.3).gain(0.6)],
  // Full: LPF sweeps open fully
  [8, note("<[a1 a1 a1 c2] [g1 g1 g1 bb1] [f1 f1 f1 ab1] [a1 c2 e2 a2]>*4")
    .s("sawtooth")
    .lpf(sine.range(400, 1600).slow(8))
    .lpq(8).decay(0.08).sustain(0).gain(0.9)]
)

// ─────────────────────────────────────────────
// SYNTH CHORDS — cold, sparse, angular
// ─────────────────────────────────────────────

const chords = arrange(
  [4, silence],
  // Drive: cold stabs, narrow LPF
  [8, note("<[a3,c4,e4] [g3,bb3,d4] [f3,ab3,c4] [e3,g3,b3]>")
    .s("square")
    .lpf(sine.range(600, 2000).slow(8))
    .attack(0.001).decay(0.15).sustain(0).gain(0.4)
    .pan("<-0.3 0.3>")],
  // Glitch break: sparse, wide reverb drone
  [4, note("<a3,e4,a4>")
    .s("square").lpf(1200)
    .attack(0.5).decay(1.0).sustain(0.8).release(2.0)
    .gain(0.2).room(0.85).size(1.0)],
  // Full: chords wider, LPF more open, add some grit
  [8, note("<[a3,c4,e4,g4] [g3,bb3,d4,f4] [f3,ab3,c4,eb4] [e3,g3,b3,d4]>")
    .s("square")
    .lpf(sine.range(1000, 3500).slow(8))
    .attack(0.001).decay(0.18).sustain(0.1).gain(0.45)
    .jux(rev).pan("<-0.4 0.4>")]
)

// ─────────────────────────────────────────────
// LEAD — cold arpeggio / melody
// ─────────────────────────────────────────────

const lead = arrange(
  [4, silence],
  // Drive: minor arp runs, very dry
  [8, note(`
    <
      [a4 c5 e5 a5] [g4 bb4 d5 g5] [f4 ab4 c5 f5] [e4 g4 b4 e5]
      [a4 e5 c5 a4] [g4 d5 bb4 g4] [f4 c5 ab4 f4] [a4 c5 e5 a5]
    >*4
  `).s("square").gain(0.25).lpf(4000)
    .delay(0.2).delaytime(0.125).delayfeedback(0.4)],
  // Glitch break: fragmentary, stuttered
  [4, note("<a5 ~ ~ e5> <~ c5 ~ ~>")
    .s("square").gain(0.2).lpf(2000)
    .delay(0.6).delaytime(0.0625).delayfeedback(0.7).room(0.5)],
  // Full: lead rises in register
  [8, note(`
    <
      [a5 c6 e6 a6] [g5 bb5 d6 g6] [f5 ab5 c6 f6] [e5 g5 b5 e6]
      [a4 c5 e5 a5] [g4 bb4 d5 g5] [f4 c5 ab4 f5] [a4 a5 e5 c5]
    >*4
  `).s("square").gain(0.3).lpf(5000)
    .delay(0.25).delaytime(0.125).delayfeedback(0.5)]
)

// ─────────────────────────────────────────────
// STACK
// ─────────────────────────────────────────────

stack(
  kick, snare, hats, clank, glitch,
  bass, chords, lead
).cpm(140 / 4)
