// TRON - "Acid Grid"
// 142 BPM | Squelchy Cyberpunk | A(8, heavy break) → B(8, half-time glitch) loop

// --- DRUMS ---
const drums = arrange(
  [8, s("<[bd [~ sd] bd [~ sd]]!7 [bd [~ sd] [bd*4] [sd*4]]>").bank("RolandTR909").shape(0.6).gain(1.1)],
  [8, s("<[bd ~ ~ ~ ~ ~ sd ~]!7 [bd ~ sd ~ bd bd sd*4]>").bank("RolandTR909").shape(0.8).gain(1.2)] // Half-time trap feel
)

const hats = arrange(
  [8, s("~ <oh oh oh [oh hh*2]>").bank("RolandTR909").gain(0.5)],
  [8, s("hh*16").bank("RolandTR909").gain(0.3).jux(rev)] // Skittering glitch hats
)

// --- ACID BASS ---
const bass = arrange(
  [8, note("<[d1 d2 d1 d2 d1 f1 d1 g1] [d1 c2 d1 d2 d1 a1 d1 f1] [d1 d2 d1 d2 d1 f1 d1 g1] [d1 c2 bb0 c1 a0 d1 f1 g1]>")
    .s("sawtooth").lpf(sine.range(300, 3500).slow(4)).lpattack(0.01).lpdecay(0.15).lpq(12).lpenv(3).gain(0.85).distort(0.4)],
  [8, note("<[d1 ~ ~ ~ d2 ~ f1 ~] [~ ~ c2 ~ ~ ~ a1 ~]>") // Sparse but extremely aggressive
    .s("sawtooth").lpf(sine.range(1000, 8000).slow(8)).lpattack(0.05).lpdecay(0.4).lpq(20).lpenv(4).gain(0.7).distort(0.8).room(0.6)]
)

// --- CYBER STABS ---
const stabs = arrange(
  [8, note("<[~ d4 ~ f4 ~ ~ ~ ~] [~ a4 ~ g4 ~ ~ f4 e4] [~ d4 ~ f4 ~ ~ ~ ~] [c5 ~ a4 ~ g4 f4 d4 ~]>")
    .s("square").delay(0.4).room(0.4).gain(0.4)],
  [8, note("<[d5,f5,a5] ~ ~ ~>").s("square").delay(0.8).delayt(0.33).room(0.9).size(0.9).gain(0.3).mask("<1 0 0 0>")] // Massive lonely chord
)

stack(drums, hats, bass, stabs).cpm(142/4)
