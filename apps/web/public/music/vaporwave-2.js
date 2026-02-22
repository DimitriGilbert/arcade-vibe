// Arcade Vibe - "Midnight Drift" (Eurobeat/High Energy)
// 165 BPM - High Speed Chase / Boss Battle
// Inspired by Initial D and aggressive Sega racers

// Progression: Dm - Bb - Gm - A (i - VI - iv - V)
// Very driving, minor key urgency

stack(
  // -- DRUMS --
  // Aggressive Eurobeat/Dance rhythm
  s(`
    <
      [bd [~ sd] bd [~ sd]]!3 [bd [~ sd] bd [sd*4]]
      [bd [~ sd] bd [~ sd]]!3 [bd*4 sd*4]
    >
  `)
    .bank("rolandtr909") // 909 has more punch for this style
    .gain(1.3)
    .clip(1.4),

  // Off-beat Open Hats (The driving force)
  s("~ oh").bank("rolandtr909").gain(0.5).decay(0.1), // Tighten them up

  // Crash on transitions
  s("crash ~ ~ ~").bank("rolandtr909").gain(0.4).mask("<1 0 0 0>"),

  // -- TURBO BASS --
  // Octave jumping "Gallop" bassline
  note(`
    <
      [d2 [~ d3] d2 d3]!4
      [bb1 [~ bb2] bb1 bb2]!4
      [g1 [~ g2] g1 g2]!4
      [a1 [~ a2] a1 a2]!4
    >
  `)
    .s("sawtooth")
    .lpf(2000)
    .lpq(2)
    .decay(0.1)
    .sustain(0)
    .gain(0.85),

  // -- SYNTH STABS --
  // High energy brass/orchestra hits
  note(`
    <
      [d4,f4,a4]
      [bb3,d4,f4]
      [g3,bb3,d4]
      [a3,cis4,e4]
    >
  `)
    .mask("1 0 1 0 1 0 1 1") // Syncopated rhythm
    .s("supersaw")
    .lpf(8000)
    .attack(0.01)
    .decay(0.15)
    .sustain(0)
    .gain(0.6)
    .jux(rev), // Wide stereo image

  // -- ARPEGGIATOR "THE ENGINE" --
  // Constant 16th note motion
  note(`
    <
      [d5 f5 a5 d6]
      [bb4 d5 f5 bb5]
      [g4 bb4 d5 g5]
      [a4 cis5 e5 a5]
    >*4
  `)
    .s("square")
    .gain(0.25)
    .pan(sine.slow(2)), // Panning left/right like a passing car

  // -- LEAD MELODY --
  // Fast, shredding solo style
  note(`
    <
      [d5 ~ ~ d5] [f5 ~ ~ f5] [a5 g5 f5 e5] [f5 e5 d5 c5]
      [bb4 ~ ~ bb4] [d5 ~ ~ d5] [f5 e5 d5 c5] [d5 c5 bb4 a4]
      [g4 ~ ~ g4] [bb4 ~ ~ bb4] [d5 c5 bb4 a4] [bb4 a4 g4 f4]
      [e4 f4 g4 a4] [cis5 d5 e5 f5] [g5 a5] [a5*4]
    >
  `)
    .s("sawtooth")
    .gain(0.5)
    .lpf(6000)
    .delay(0.3)
    .delaytime(0.125)
    .delayfeedback(0.4), // Slapback delay
).cpm(165 / 4);
