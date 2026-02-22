// SYNTHWAVE - "Outrun Horizon" (Improved)
// 130 BPM | 80s Neon Racing | A(8) → B(8) loop
// Fixes: gradual kick intro, smooth LPF sweep A→B transition
// A = C-F-Am-G driving verse | B = Eb-Bb-Cm-Ab epic bridge

// --- DRUMS ---
// Kick: starts sparse (1st cycle = just 1 hit), builds over 8 cycles, fills on 8th
// Using 'every' and arrange to ramp up gradually
const kick = arrange(
  // First 4 cycles: sparse kick builds in
  [1, s("bd").bank("RolandTR707").gain(0.9)],
  [1, s("bd ~ ~ bd").bank("RolandTR707").gain(0.9)],
  [2, s("bd ~ bd bd").bank("RolandTR707").gain(1.0)],
  // Then full 4-on-the-floor for the rest
  [4, s("bd*4").bank("RolandTR707").gain(1.1)],
  // Fill on the 8th cycle before switch
  [8, every(8, x => x.fast(2),
    s("<[bd*4]!7 [bd bd bd bd bd bd bd bd]>").bank("RolandTR707").gain(1.1)
  )],
  [8, every(8, x => x.fast(2),
    s("<[bd*4]!7 [bd bd bd bd bd bd bd bd]>").bank("RolandTR707").gain(1.1)
  )]
)

// Hats: also start quiet, grow in
const hats = arrange(
  [4, silence],
  [4, s("hh*8").bank("RolandTR707").gain(0.15)],
  [8, every(8, x => x.fast(2).gain(0.5),
    s("hh*16").bank("RolandTR707").gain(0.25)
  )],
  [8, every(8, x => x.fast(2).gain(0.5),
    s("hh*16").bank("RolandTR707").gain(0.25)
  )]
)

const openHat = arrange(
  [4, silence],
  [4, s("~ oh ~ oh").bank("RolandTR707").gain(0.4)],
  [16, s("~ oh ~ oh").bank("RolandTR707").gain(0.55)]
)

// --- SECTION A: Driving verse (C-F-Am-G) ---
// LPF sweeps open over the 8 cycles of A using sine.range
const bassA = note("<[c1 c2]*8 [f1 f2]*8 [a1 a2]*8 [g1 g2]*8 [c1 c2]*8 [f1 f2]*8 [a1 a2]*8 [g1 g2 g1 c2]*8>")
  .s("sawtooth").lpf(1200).lpq(2).decay(0.15).sustain(0)

// Chords: LPF rises from dark to bright across section A
const chordsA = note("<[c3,eb3,g3] [f3,a3,c4] [a3,c4,e4] [g3,b3,d4] [c3,eb3,g3] [f3,a3,c4] [a3,c4,e4] [g3,b3,d4,f4]>")
  .s("supersaw")
  .lpf(sine.range(1200, 4200).slow(8))  // Sweeps open over 8 bars
  .jux(rev).room(0.4).gain(0.45)

const leadA = note("<[c5 ~ eb5 ~ d5 ~ ~ ~] [~ f5 ~ d5 c5 ~ ~ ~] [g5 ~ eb5 ~ d5 ~ c5 ~] [~ g5 f5 eb5 d5 c5 d5 eb5] [c5 ~ eb5 ~ d5 ~ ~ ~] [~ f5 ~ d5 c5 ~ ~ ~] [g5 ~ f5 ~ eb5 ~ d5 ~] [c6 ~ ~ ~ g5 f5 eb5 d5]>")
  .s("square").lpf(5500).delay(0.3).delayt(0.25).gain(0.38)

// --- SECTION B: Epic bridge (Eb-Bb-Cm-Ab) ---
// LPF opens further + bigger room = spatial shift signals the new section
const bassB = note("<[eb1 eb2]*8 [bb1 bb2]*8 [c2 c3]*8 [ab1 ab2]*8 [eb1 eb2]*8 [bb1 bb2]*8 [c2 c3]*8 [bb1 ab1 g1 f1]*8>")
  .s("sawtooth").lpf(1600).lpq(3).decay(0.18).sustain(0)

// Chords: LPF sweeps from darker to fully open, bigger room for the epic feel
const chordsB = note("<[eb3,g3,bb3] [bb2,d3,f3] [c3,eb3,g3] [ab2,c3,eb3] [eb3,g3,bb3] [bb2,d3,f3] [c3,eb3,g3] [ab2,c3,eb3,g3]>")
  .s("supersaw")
  .lpf(sine.range(2500, 5500).slow(8))  // Opens up more than section A
  .jux(rev).room(0.65).gain(0.5).size(0.6)

const leadB = note("<[eb5 ~ g5 ~ bb5 ~ ~ ~] [~ f5 ~ eb5 d5 ~ ~ ~] [g5 ~ eb5 ~ c5 ~ ~ ~] [~ ab5 g5 f5 eb5 d5 eb5 f5] [bb5 ~ ~ ~ g5 ~ f5 ~] [~ eb5 ~ d5 c5 ~ bb4 ~] [c5 ~ eb5 ~ g5 ~ bb5 ~] [eb6 ~ bb5 ~ g5 f5 eb5 d5]>")
  .s("square").lpf(6000).delay(0.35).delayt(0.25).room(0.2).gain(0.42)

// --- TRANSITION PAD: bridges the cut between A and B ---
// A long slow pad that fades in near the end of A and fades out early in B
const transitionPad = arrange(
  [16, silence],  // Silent in A
  // Enters at B: warm chord wash
  [8, note("<[c3,eb3,g3,bb3]!8>")
    .s("sine")
    .gain(sine.range(0, 0.2).slow(8))  // Fades in gently across section B
    .room(0.9).size(1.0).lpf(2000)]
)

// --- FULL ARRANGEMENT: A(8) → B(8) looping ---
stack(
  kick, hats, openHat,
  arrange(
    [8, bassA],
    [8, bassB]
  ),
  arrange(
    [8, chordsA],
    [8, chordsB]
  ),
  arrange(
    [8, leadA],
    [8, leadB]
  ),
  transitionPad
).cpm(130 / 4)
