// PIXEL - "Mushroom Hop"
// 160 BPM | 16-bit Platformer Joy | A(8, major) → B(8, minor-ish cave) loop

// --- DRUMS ---
const kick = every(8, x => x.fast(2),
  s("<[bd ~ ~ bd]!7 [bd bd bd bd]>").bank("RolandTR707").gain(1.1)
)

const snare = s("~ <[sd,cp] [sd,cp] [sd,cp] [sd*2,cp*2]>").bank("RolandTR707").gain(0.8)

const hihat = arrange(
  [8, s("[hh hh ~ hh]*2").bank("RolandTR707").gain(0.3)],
  [8, s("[hh ~ hh hh]*2").bank("RolandTR707").gain(0.28)] // slightly different groove in B
)

// --- SECTION A: Major key overworld (C major, bright + bouncy) ---
const bassA = arrange([8,
  note("<[c2 ~ g2 ~ e2 ~ g2 ~] [f2 ~ c3 ~ a2 ~ c3 ~] [d2 ~ a2 ~ f2 ~ a2 ~] [g2 ~ d3 ~ b2 ~ g2 ~] [c2 ~ g2 ~ e2 ~ g2 ~] [f2 ~ c3 ~ a2 ~ c3 ~] [a2 ~ e3 ~ c3 ~ a2 ~] [g2 ~ b2 ~ d3 ~ g3 ~]>")
    .s("triangle").decay(0.14).sustain(0).gain(1.2)
])

const chordsA = arrange([8,
  note("<[~ c4 e4 ~] [~ f4 a4 ~] [~ d4 f4 ~] [~ g4 b4 ~] [~ c4 e4 ~] [~ f4 a4 ~] [~ a4 c5 ~] [~ g4 b4 d5 ~]>")
    .s("pulse").gain(0.38).decay(0.1)
])

const melodyA = arrange([8,
  note("<[c5 e5 g5 ~ a5 g5 e5 ~] [f5 a5 c6 ~ b5 a5 g5 ~] [d5 f5 a5 ~ g5 f5 d5 ~] [b4 d5 g5 ~ a5 g5 b5 c6] [c5 e5 g5 ~ a5 ~ g5 ~] [f5 ~ a5 ~ c6 b5 a5 g5] [a5 g5 f5 e5 d5 e5 f5 g5] [a5 b5 c6 ~ ~ ~ ~ ~]>")
    .s("square").lpf(7000).decay(0.1).sustain(0.1).gain(0.52)
])

// --- SECTION B: Underground cave (A natural minor — spookier, deeper) ---
const bassB = arrange([8,
  note("<[a1 ~ e2 ~ c2 ~ e2 ~] [d2 ~ a2 ~ f2 ~ a2 ~] [e2 ~ b2 ~ g2 ~ b2 ~] [a1 ~ c2 ~ e2 ~ a2 ~] [a1 ~ e2 ~ c2 ~ e2 ~] [d2 ~ a2 ~ f2 ~ a2 ~] [g1 ~ d2 ~ b1 ~ d2 ~] [a1 ~ a2 ~ e2 ~ c2 ~]>")
    .s("triangle").lpf(900).decay(0.18).sustain(0.05).gain(1.15)
])

const chordsB = arrange([8,
  note("<[~ a3 c4 ~] [~ d4 f4 ~] [~ e4 g4 ~] [~ a3 c4 e4 ~] [~ a3 c4 ~] [~ d4 f4 ~] [~ g3 b3 d4 ~] [~ a3 c4 e4 ~]>")
    .s("pulse").lpf(1800).gain(0.3).decay(0.12)
])

const melodyB = arrange([8,
  note("<[a4 ~ c5 ~ e5 ~ c5 ~] [d5 ~ f5 ~ a5 ~ f5 ~] [e5 ~ g5 ~ b5 ~ g5 ~] [a5 ~ ~ ~ e5 ~ c5 ~] [a4 b4 c5 d5 e5 f5 g5 a5] [b5 ~ ~ ~ a5 g5 f5 e5] [d5 e5 f5 ~ e5 d5 c5 b4] [a4 ~ ~ ~ ~ ~ ~ ~]>")
    .s("square").lpf(5000).decay(0.12).sustain(0.08).gain(0.45).room(0.15)
])

stack(
  kick, snare, hihat,
  arrange([8, bassA], [8, bassB]),
  arrange([8, chordsA], [8, chordsB]),
  arrange([8, melodyA], [8, melodyB])
).cpm(160/4)
