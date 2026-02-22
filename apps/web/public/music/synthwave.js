// SYNTHWAVE - "Outrun Horizon"
// 130 BPM | 80s Neon Racing | A(8) → B(8) loop
// A = C-F-Am-G driving verse | B = Eb-Bb-Cm-Ab epic bridge

// --- SHARED DRUMS (play throughout, fill every 8 cycles) ---
const kick = every(8, x => x.fast(2),
  s("<[bd(4,4)]!7 [bd bd bd bd bd bd bd bd]>")
  .bank("RolandTR707").gain(1.1)
)

const hats = every(8, x => x.fast(2).gain(0.5),
  s("hh*16").bank("RolandTR707").gain(0.25)
)

const openHat = s("~ oh ~ oh").bank("RolandTR707").gain(0.55)

// --- SECTION A: Driving verse (8 cycles) ---
const bassA = arrange(
  [8, note("<[c1 c2]*8 [f1 f2]*8 [a1 a2]*8 [g1 g2]*8 [c1 c2]*8 [f1 f2]*8 [a1 a2]*8 [g1 g2 g1 c2]*8>")
    .s("sawtooth").lpf(1200).lpq(2).decay(0.15).sustain(0)]
)

const chordsA = arrange(
  [8, note("<[c3,eb3,g3] [f3,a3,c4] [a3,c4,e4] [g3,b3,d4] [c3,eb3,g3] [f3,a3,c4] [a3,c4,e4] [g3,b3,d4,f4]>")
    .s("supersaw").lpf(sine.range(1500,4000).slow(8)).jux(rev).room(0.4).gain(0.45)]
)

const leadA = arrange(
  [8, note("<[c5 ~ eb5 ~ d5 ~ ~ ~] [~ f5 ~ d5 c5 ~ ~ ~] [g5 ~ eb5 ~ d5 ~ c5 ~] [~ g5 f5 eb5 d5 c5 d5 eb5] [c5 ~ eb5 ~ d5 ~ ~ ~] [~ f5 ~ d5 c5 ~ ~ ~] [g5 ~ f5 ~ eb5 ~ d5 ~] [c6 ~ ~ ~ g5 f5 eb5 d5]>")
    .s("square").lpf(5500).delay(0.3).delayt(0.25).gain(0.38)]
)

// --- SECTION B: Epic bridge (8 cycles, key shifts to Eb) ---
const bassB = arrange(
  [8, note("<[eb1 eb2]*8 [bb1 bb2]*8 [c2 c3]*8 [ab1 ab2]*8 [eb1 eb2]*8 [bb1 bb2]*8 [c2 c3]*8 [bb1 ab1 g1 f1]*8>")
    .s("sawtooth").lpf(1600).lpq(3).decay(0.18).sustain(0)]
)

const chordsB = arrange(
  [8, note("<[eb3,g3,bb3] [bb2,d3,f3] [c3,eb3,g3] [ab2,c3,eb3] [eb3,g3,bb3] [bb2,d3,f3] [c3,eb3,g3] [ab2,c3,eb3,g3]>")
    .s("supersaw").lpf(sine.range(2000,5000).slow(8)).jux(rev).room(0.55).gain(0.5).size(0.6)]
)

const leadB = arrange(
  [8, note("<[eb5 ~ g5 ~ bb5 ~ ~ ~] [~ f5 ~ eb5 d5 ~ ~ ~] [g5 ~ eb5 ~ c5 ~ ~ ~] [~ ab5 g5 f5 eb5 d5 eb5 f5] [bb5 ~ ~ ~ g5 ~ f5 ~] [~ eb5 ~ d5 c5 ~ bb4 ~] [c5 ~ eb5 ~ g5 ~ bb5 ~] [eb6 ~ bb5 ~ g5 f5 eb5 d5]>")
    .s("square").lpf(6000).delay(0.35).delayt(0.25).room(0.2).gain(0.42)]
)

// --- FULL ARRANGEMENT: A(8) → B(8) ---
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
  )
).cpm(130/4)
