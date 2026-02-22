// CABINET - "Fireplace Tales"
// 95 BPM | Cozy Organic | A(8, warm groove) → B(8, ambient dream) loop

// --- DRUMS ---
const drums = arrange(
  [8, s("<[bd ~ rim ~]!7 [bd ~ rim rim]>").bank("RolandTR808").gain(0.9)],
  [8, s("~").gain(0)] // Drums completely disappear in the dream section
)

const hats = arrange(
  [8, s("hh*8").bank("RolandTR808").gain(0.2).pan(0.3)],
  [8, s("<~ ~ ~ [hh ~ ~ ~]>").bank("RolandTR808").gain(0.15).room(0.8)] // Just a ghostly whisper
)

// --- BASS ---
const bass = arrange(
  [8, note("<[c2 ~ g2 ~] [a1 ~ e2 ~] [f1 ~ c2 ~] [g1 ~ d2 ~]>").s("triangle")
    .lpf(1000).decay(0.4).sustain(0.2).gain(1.1)],
  [8, note("<c1 a0 f0 g0>").s("triangle") // Deep, long drones
    .lpf(600).attack(0.5).decay(1).sustain(0.8).gain(1.3).slow(2)]
)

// --- PADS ---
const pads = arrange(
  [8, note("<[c3,e3,g3,b3] [a2,c3,e3,g3] [f2,a2,c3,e3] [g2,b2,d3,f3]>").s("sine")
    .room(0.6).gain(0.7).slow(2)],
  [8, note("<[c3,e3,g3,b3,d4] [a2,c3,e3,g3,b3] [f2,a2,c3,e3,g3] [g2,b2,d3,f3,a3]>").s("sine")
    .room(0.9).size(0.8).gain(0.85).slow(2).vib("2:0.1")] // Wider, more complex chords
)

// --- LULLABY MELODY ---
const melody = arrange(
  [8, note("<[e4 ~ g4 ~ c5 ~ ~ ~] [c4 ~ e4 ~ a4 ~ ~ ~] [f4 ~ a4 ~ c5 ~ d5 ~] [b4 ~ ~ ~ g4 ~ ~ ~]>")
    .s("triangle").delay(0.4).room(0.3).gain(0.5).slow(2)],
  [8, note("<[c5 e5 g5 c6] [a4 c5 e5 a5] [f4 a4 c5 f5] [g4 b4 d5 g5]>") // Slow rising arpeggios
    .s("sine").delay(0.6).delayt(0.75).room(0.8).gain(0.3).slow(2)]
)

stack(drums, hats, bass, pads, melody).cpm(95/4)
