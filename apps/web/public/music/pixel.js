// Arcade Vibe - "Hyper Pixel Sprint" (Corrected Speed)
// 220 BPM - Mario Athletic on Caffeine
// Pure Joy & Speed

stack(
  // -- DRUMS --
  // Fast "Train" Beat (Polka/Ska)
  s(`
    <
      [bd sd bd sd]
      [bd sd bd sd]
      [bd sd bd sd]
      [bd sd [bd bd] [sd sd]]
    >
  `)
    .bank("rolandtr707")
    .gain(1.1)
    .clip(1.2),

  // -- HI-HATS --
  s("~ [oh,hh]")
    .bank("rolandtr707")
    .gain(0.4)
    .decay(0.05),

  // -- BASS --
  // Fast Walking Bass / Oom-Pah - Triangle Wave
  note(`
    <
      [c2 g2 c3 g2] [e2 b2 e3 b2]
      [f2 c3 f3 c3] [g2 d3 g3 d3]
      [c2 g2 c3 g2] [a2 e3 a3 e3]
      [d2 a2 d3 a2] [g2 d3 g3 d3]
    >
  `)
    .s("triangle")
    .gain(1.0)
    .decay(0.1).sustain(0)
    .clip(1.1),

  // -- CHORDS --
  // Ska/Polka Off-beat Stabs
  note(`
    <
      [~ [e3,g3,c4]] [~ [e3,g3,c4]]
      [~ [f3,a3,c4]] [~ [f3,a3,c4]]
      [~ [g3,b3,d4]] [~ [g3,b3,d4]]
      [~ [b3,d4,g4]] [~ [b3,d4,g4]]
    >
  `)
    .s("square")
    .gain(0.3)
    .decay(0.05).sustain(0)
    .lpf(4000),

  // -- LEAD MELODY --
  // Catchy, Rhythmic, Athletic
  note(`
    <
      [c4 ~ e4 g4] [~ a4 g4 e4] [f4 ~ a4 ~] [g4 ~ ~ ~]
      [f4 ~ d4 ~] [e4 ~ c4 ~] [d4 c4 b3 a3] [g3 ~ ~ ~]
      [c4 ~ e4 g4] [c5 ~ b4 a4] [g4 ~ e4 ~] [c4 ~ ~ ~]
      [f4 a4 d4 f4] [e4 g4 c4 e4] [d4 f4 b3 d4] [c4 ~ ~ ~]
    >
  `)
    .s("square")
    .gain(0.6)
    .decay(0.1).sustain(0.2).release(0.1)
    .lpf(6000)
    .delay(0.15)
).cpm(220/4)
