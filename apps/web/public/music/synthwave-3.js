// Arcade Vibe - "Neon Horizon" (Improved)
// 150 BPM | High-Energy Arcade Racing
// Structure: 32-bar loop = Intro(8) → A(8) → Breakdown(4) → B(12)
// Uses LPF sweeps for smooth section transitions, no hard cuts

// ─────────────────────────────────────────────
// DRUMS
// ─────────────────────────────────────────────

// Kick: starts with just a few hits, builds to full
const kick = arrange(
  // Intro: sparse kick - just beats 1 and 3
  [2, s("bd ~ bd ~").bank("rolandtr707").gain(1.0).room(0.25)],
  // Second intro phrase: adds offbeat
  [2, s("bd ~ [bd ~] [~ bd]").bank("rolandtr707").gain(1.0).room(0.25)],
  // Section A: driving with variation every 4th bar
  [8, s(`
    <
      [bd [~ sd] bd [~ sd]]!3 [bd sd bd [sd, bd*4]]
      [bd [~ sd] bd [~ sd]]!3 [bd sd [bd bd] [sd*4]]
    >
  `).bank("rolandtr707").gain(1.2).clip(1.1).room(0.3)],
  // Breakdown: kick drops to half time
  [4, s("bd ~ ~ ~").bank("rolandtr707").gain(0.9).room(0.5)],
  // Section B: full energy + fills
  [12, s(`
    <
      [bd [~ sd] bd [~ sd]]!3 [bd sd bd [sd, bd*4]]
      [bd [~ sd] bd [~ sd]]!3 [bd sd bd [sd, bd*4]]
      [bd [~ sd] bd [~ sd]]!3 [bd*2 sd*2 [bd,sd]*2 [sd*4]]
    >
  `).bank("rolandtr707").gain(1.2).clip(1.1).room(0.3)]
)

// Hi-hats: silent in intro, grow in
const hats = arrange(
  [2, silence],
  [2, s("hh*8").bank("rolandtr707").gain(0.15).pan(0.2)],
  [8, s("hh*16").bank("rolandtr707").gain(0.25).pan(0.2)],
  [4, s("hh*4").bank("rolandtr707").gain(0.2).pan(0.2)],  // Sparse in breakdown
  [12, s("hh*16").bank("rolandtr707").gain(0.25).pan(0.2)]
)

// Ride: enters in section B, panned opposite
const ride = arrange(
  [20, silence],
  [12, s("~ ride ~ ride").bank("rolandtr707").gain(0.2)]
)

// ─────────────────────────────────────────────
// BASS
// ─────────────────────────────────────────────

// LPF sweep: intro bass is filtered dark, sweeps open into A, stays bright
// Breakdown: bass becomes a simple half-time pulse
// Section B: new chord progression (modal shift)

const bass = arrange(
  // Intro: filtered bass, LPF rises from ~400 → 1000
  [4, note("<[f1@3 f2] [g1@3 g2] [e1@3 e2] [a1@3 a2]>*8")
    .s("sawtooth")
    .lpf(sine.range(300, 900).slow(4))
    .lpq(5).decay(0.12).sustain(0).gain(0.6)],
  // Into A: LPF fully open, standard drive
  [4, note("<[f1@3 f2] [g1@3 g2] [e1@3 e2] [a1@3 a2]>*8")
    .s("sawtooth").lpf(1000).lpq(5).decay(0.12).sustain(0).gain(0.75)],
  // Section A continues
  [8, note("<[f1@3 f2] [g1@3 g2] [a1@3 a2] [c2@3 c3]>*8")
    .s("sawtooth").lpf(1000).lpq(5).decay(0.12).sustain(0).gain(0.75)],
  // Breakdown: slow melodic bass, filter sweeps down for tension
  [4, note("<f1@2 e1 a1@2 g1@2 e1 d1>")
    .s("sawtooth")
    .lpf(sine.range(200, 600).slow(4))
    .lpq(8).decay(0.4).sustain(0.2).gain(0.65)],
  // Section B: new progression D-E-F-G, LPF sweeps back up = energy return
  [12, note("<[d1@3 d2] [e1@3 e2] [f1@3 f2] [g1@3 g2]>*8")
    .s("sawtooth")
    .lpf(sine.range(700, 1400).slow(12))
    .lpq(4).decay(0.12).sustain(0).gain(0.78)]
)

// ─────────────────────────────────────────────
// SYNTH CHORDS
// ─────────────────────────────────────────────

const chords = arrange(
  // Intro: no chords yet — just filtered bass establishes groove
  [4, silence],
  // Section A entry: chords fade in, LPF climbs
  [4, note("<[f3,a3,c4,e4] [g3,b3,d4] [e3,g3,b3,d4] [a3,c4,e4]>")
    .s("supersaw")
    .lpf(sine.range(800, 4000).slow(4))
    .attack(0.02).decay(0.3).sustain(0.4).release(0.5)
    .gain(0.4).jux(rev).vib("5:0.1")],
  // Section A continues, chords fully open
  [8, note("<[f3,a3,c4,e4] [g3,b3,d4] [a3,c4,e4] [c4,e4,g4]>")
    .s("supersaw").lpf(5000)
    .attack(0.01).decay(0.3).sustain(0.4).release(0.5)
    .gain(0.5).jux(rev).vib("5:0.1")],
  // Breakdown: chords held long, filter drops for dark tension
  [4, note("<[a3,c4,e4,g4] [d3,f3,a3,c4]>")
    .s("supersaw")
    .lpf(sine.range(300, 1500).slow(4))
    .attack(0.3).decay(0.5).sustain(0.7).release(1.2)
    .gain(0.35).room(0.6).slow(2).vib("3:0.05")],
  // Section B: bright + wide, new harmony
  [12, note("<[d3,f3,a3,c4] [e3,g3,b3,d4] [f3,a3,c4,e4] [g3,b3,d4,f4]>")
    .s("supersaw").lpf(5500)
    .attack(0.01).decay(0.3).sustain(0.4).release(0.5)
    .gain(0.55).jux(rev).vib("5:0.15").room(0.35)]
)

// ─────────────────────────────────────────────
// LEAD MELODY
// ─────────────────────────────────────────────

const lead = arrange(
  // Intro: no lead — let rhythm/bass breathe
  [8, silence],
  // Section A: heroic lead
  [8, note(`
    <
      [~ c5 ~ a4] [b4 ~ g4 ~] [~ g4 ~ e4] [a4 ~ c5 ~]
      [~ c5 ~ a4] [b4 ~ d5 ~] [c5 ~ e5 ~] [g5 ~ ~ ~]
    >
  `).s("square").gain(0.35).lpf(3500)
    .delay(0.35).delaytime(0.25).delayfeedback(0.6)],
  // Breakdown: single note melodic phrase, filter barely open
  [4, note("<c5 ~ a4 ~ g4 ~ e4 ~>")
    .s("sine").gain(0.25).lpf(1200)
    .delay(0.4).delaytime(0.375).delayfeedback(0.7).room(0.6)],
  // Section B: climactic lead, higher register + ascending run
  [12, note(`
    <
      [~ c5 ~ a4] [b4 ~ g4 ~] [~ g4 ~ e4] [a4 ~ c5 ~]
      [f4 a4 c5 f5] [e5 d5 c5 b4] [a4 c5 e5 g5] [b4 d5 g5 b5]
      [d5 ~ f5 ~] [e5 ~ g5 ~] [f5 a5 c6 ~] [~ ~ ~ ~]
    >
  `).s("square").gain(0.4).lpf(4000)
    .delay(0.35).delaytime(0.25).delayfeedback(0.65)]
)

// ─────────────────────────────────────────────
// ARPEGGIO FLOURISHES
// ─────────────────────────────────────────────

const arps = arrange(
  // Absent in intro and breakdown
  [8, silence],
  // Section A: subtle sparkle, every other bar only
  [8, note("<[a5 c6 e6] [b5 d6 g6] [g5 b5 e6] [a5 c6 e6]>*4")
    .s("sine").gain(0.15).mask("<0 1>").slow(2).lpf(6000)],
  // Breakdown: silence — contrast
  [4, silence],
  // Section B: arps more present, add a second voice
  [12, stack(
    note("<[a5 c6 e6] [b5 d6 g6] [d6 f6 a6] [c6 e6 g6]>*4")
      .s("sine").gain(0.18).slow(2).lpf(7000),
    note("<[e6 g6 b6] [f6 a6 c7] ~ [g6 b6 d7]>*4")
      .s("sine").gain(0.1).slow(2).lpf(7000).pan(0.6)
  )]
)

// ─────────────────────────────────────────────
// STACK
// ─────────────────────────────────────────────

stack(kick, hats, ride, bass, chords, lead, arps).cpm(150 / 4)
