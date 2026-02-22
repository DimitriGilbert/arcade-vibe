// Arcade Vibe - "Pixel Bounce" (Corrected)
// 140 BPM - Mario/Kirby Athletic Theme
// Syncopated, Joyful, Lower Octave, NO width()

stack(
  // -- DRUMS --
  // Bouncy Samba-ish beat
  // Kick on 1, 2, 3, 4
  // Snare on "and" of beats
  s(`
    <
      [bd ~ bd ~] [~ sd ~ sd]
      [bd ~ bd ~] [~ sd ~ sd]
      [bd ~ bd ~] [~ sd ~ sd]
      [bd sd bd sd] [sd sd sd sd]
    >
  `)
    .bank("rolandtr707")
    .gain(1.1)
    .clip(1.2),

  // -- PERCUSSION --
  // Agogo for the "Latin" feel
  s("~ ~ ~ ht").bank("rolandtr707").gain(0.8),

  s("hh*4").bank("rolandtr707").gain(0.2),

  // -- BASS --
  // Triangle Wave - Octave 2
  // Syncopated "Tumbao" rhythm (dotted 8th feel)
  note(`
    <
      [c2 ~ ~ g1] [~ c2 ~ ~]
      [e2 ~ ~ b1] [~ e2 ~ ~]
      [f2 ~ ~ c2] [~ f2 ~ ~]
      [g2 ~ ~ d2] [~ g2 ~ ~]
    >
  `)
    .s("triangle")
    .gain(1.2)
    .decay(0.15)
    .sustain(0)
    .clip(1.1),

  // -- CHORDS --
  // Off-beat "Skank" Stabs (Reggae/Ska style)
  // On the "&" of the beat
  // Octave 3 (Mid-range)
  note(`
    <
      [~ [e3,g3,c4]] [~ [e3,g3,c4]]
      [~ [g3,b3,e4]] [~ [g3,b3,e4]]
      [~ [a3,c4,f4]] [~ [a3,c4,f4]]
      [~ [b3,d4,g4]] [~ [b3,d4,g4]]
    >
  `)
    .s("square")
    .gain(0.35)
    .decay(0.05)
    .sustain(0) // Very short stabs
    .lpf(4000),

  // -- LEAD MELODY --
  // Octave 4 - Catchy, Rhythmic, Call & Response
  // "Pa... Pa-Pa... Pa!"
  note(`
    <
      [c4 ~ ~ e4] [g4 ~ a4 ~] [g4 ~ ~ ~] [~ ~ ~ ~]
      [e4 ~ ~ d4] [c4 ~ d4 ~] [e4 ~ ~ ~] [~ ~ ~ ~]
      [f4 ~ ~ a4] [c5 ~ a4 ~] [g4 ~ e4 ~] [c4 ~ ~ ~]
      [d4 ~ ~ dis4] [e4 ~ c4 ~] [d4 c4 a3 g3] [c4 ~ ~ ~]
    >
  `)
    .s("square")
    .gain(0.6)
    .decay(0.1)
    .sustain(0.3)
    .release(0.1)
    .lpf(5000)
    .delay(0.2),
).cpm(140 / 4);
