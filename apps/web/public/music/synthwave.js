// Arcade Vibe - "Neon Horizon" (Full Track)
// 150 BPM - High Energy Arcade Racing
// Structure: 16-Bar Main Loop with variations

stack(
  // -- RHYTHM SECTION --
  // Drums: Driving beat with fills every 4th bar
  s(`
    <
      [bd [~ sd] bd [~ sd]]!3 [bd sd bd [sd, bd*4]]
      [bd [~ sd] bd [~ sd]]!3 [bd sd [bd bd] [sd*4]]
      [bd [~ sd] bd [~ sd]]!3 [bd sd bd [sd, bd*4]]
      [bd [~ sd] bd [~ sd]]!3 [bd*2 sd*2 [bd,sd]*2 [sd*4]]
    >
  `)
    .bank("rolandtr707")
    .gain(1.2)
    .clip(1.1)
    .room(0.3),

  // High Hats: Consistent 16th note drive
  s("hh*16").bank("rolandtr707").gain(0.25).pan(0.2),

  // Ride Cymbal on the off-beat for lift in second half
  s("~ ride")
    .bank("rolandtr707")
    .gain("<0 0.2>") // Volume up in second half of 2-bar phrases
    .slow(2), // Half speed feel

  // -- BASSLINE --
  // 16-Bar Progression
  // Fmaj7 - G - Em7 - Am (Classic progression)
  // Rolling octave bass pattern
  note(`
    <
      [f1@3 f2] [g1@3 g2] [e1@3 e2] [a1@3 a2]
      [f1@3 f2] [g1@3 g2] [a1@3 a2] [c2@3 c3]
      [f1@3 f2] [g1@3 g2] [e1@3 e2] [a1@3 a2]
      [d1@3 d2] [e1@3 e2] [f1@3 f2] [g1@3 g2]
    > * 8
  `)
    .s("sawtooth")
    .lpf(1000)
    .lpq(5)
    .decay(0.12)
    .sustain(0)
    .gain(0.75),

  // -- SYNTH CHORDS --
  // Side-chained pumping feel
  note(`
    <
      [f3,a3,c4,e4] [g3,b3,d4] [e3,g3,b3,d4] [a3,c4,e4]
      [f3,a3,c4,e4] [g3,b3,d4] [a3,c4,e4]   [c4,e4,g4]
      [f3,a3,c4,e4] [g3,b3,d4] [e3,g3,b3,d4] [a3,c4,e4]
      [d3,f3,a3,c4] [e3,g3,b3,d4] [f3,a3,c4,e4] [g3,b3,d4]
    >
  `)
    .s("supersaw")
    .lpf(5000)
    .attack(0.01)
    .decay(0.3)
    .sustain(0.4)
    .release(0.5)
    .gain(0.5)
    .jux(rev) // Stereo widening
    .vib("5:0.1"), // Slight pitch wobble for retro feel

  // -- LEAD MELODY --
  // "Heroic" arcade melody
  note(`
    <
      [~ c5 ~ a4] [b4 ~ g4 ~] [~ g4 ~ e4] [a4 ~ c5 ~]
      [~ c5 ~ a4] [b4 ~ d5 ~] [c5 ~ e5 ~] [g5 ~ ~ ~]
      [~ c5 ~ a4] [b4 ~ g4 ~] [~ g4 ~ e4] [a4 ~ c5 ~]
      [f4 a4 c5 f5] [e5 d5 c5 b4] [a4 c5 e5 g5] [b4 d5 g5 b5]
    >
  `)
    .s("square")
    .gain(0.35)
    .lpf(3500)
    .delay(0.35)
    .delaytime(0.25)
    .delayfeedback(0.6), // Dubby delay
  // Removed .port() as it caused an error

  // -- ARPEGGIO FLOURISHES --
  // High sparkly arps in the background
  note(`
    <
      [a5 c6 e6] [b5 d6 g6] [g5 b5 e6] [a5 c6 e6]
    > * 4
  `)
    .s("sine")
    .gain(0.15)
    .mask("<0 1>") // Only play every other bar
    .slow(2),
).cpm(150 / 4);
