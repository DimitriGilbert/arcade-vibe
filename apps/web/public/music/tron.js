// Arcade Vibe - "Boss Run" (Heavy Funk)
// 130 BPM - Motivation & Grit
// Lower octaves, heavier sound, no high-pitched "sparkles"

stack(
  // -- DRUMS --
  // Heavy Rock Breakbeat
  s(`
    <
      [bd [~ sd] bd [~ sd]]
      [bd [~ sd] [bd bd] [sd ~]]
      [bd [~ sd] bd [sd sd]]
      [bd [~ sd] [bd bd] [sd [~ sd]]]
    >
  `)
    .bank("rolandtr707")
    .gain(1.1)
    .clip(1.3),

  // -- HI-HATS --
  s("hh*8").bank("rolandtr707").gain(0.3).pan(0.2),

  // -- BASS --
  // Driving E Minor Riff - Low and Gritty (Octave 1-2)
  note(`
    <
      [e1 e2] [e1 g1] [e1 a1] [e1 b1]
      [e1 e2] [e1 d2] [b1 a1] [g1 e1]
      [e1 e2] [e1 g1] [e1 a1] [e1 b1]
      [c2 b1] [a1 g1] [e1 ~] [~ ~]
    >
  `)
    .s("sawtooth")
    .gain(1.0)
    .lpf(800)
    .lpq(2)
    .decay(0.2)
    .sustain(0),

  // -- RHYTHM GUITAR / SYNTH --
  // Crunchy Stabs (Octave 3)
  note(`
    <
      [~ [e3,g3,b3]] ~ [~ [e3,g3,b3]]
      [~ [d3,fis3,a3]] ~ [~ [d3,fis3,a3]]
      [~ [c3,e3,g3]] ~ [~ [c3,e3,g3]]
      [~ [b2,dis3,fis3]] ~ [~ [b2,dis3,fis3]]
    >
  `)
    .s("square")
    .gain(0.4)
    .decay(0.1)
    // .width(0.5) // Fuller sound
    .pan(0.7),

  // -- LEAD MELODY --
  // Bluesy, determined (Octave 4 - NO 5s!)
  note(`
    <
      [e4 ~ g4 ~] [a4 ~ b4 ~] [d4 ~ b4 ~] [a4 ~ g4 ~]
      [e4 ~ g4 ~] [a4 ~ b4 ~] [d4 ~ e4 ~] [~ ~ ~ ~]
      [e4 ~ g4 ~] [a4 ~ b4 ~] [c4 ~ b4 ~] [a4 ~ g4 ~]
      [e4 d4 b3 a3] [g3 a3 b3 d4] [e4 ~ ~ ~] [~ ~ ~ ~]
    >
  `)
    .s("square")
    .gain(0.5)
    .lpf(2000) // Mellow, not piercing
    // .port(0.05)
    .delay(0.2)
    .delaytime(0.25)
    .delayfeedback(0.3),
).cpm(130 / 4);
