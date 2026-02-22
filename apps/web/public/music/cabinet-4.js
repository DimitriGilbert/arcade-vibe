// FANTASY TAVERN - "The Wanderer's Rest"
// 95 BPM | Medieval folk | Warm, acoustic, lively jig feel
// Structure: Intro(4) → Verse(8) → Bridge(4) → Chorus(8) loop
// Key: D Dorian (medieval modal feel)

// ─────────────────────────────────────────────
// PERCUSSION — hand drums, tambourine, stomp
// ─────────────────────────────────────────────

// Main groove: lilting 6/8-flavored feel squeezed into 4/4
const stomp = s(`
  <
    [bd ~ [~ bd] ~] [bd ~ [bd ~] ~]
    [bd ~ [~ bd] ~] [bd [bd ~] bd ~]
  >
`)
  .bank("RolandTR707").gain(0.75).room(0.35).lpf(600)

const tambourine = s("<[hh hh hh hh hh hh] [hh hh [hh hh] hh hh hh]>*2")
  .bank("RolandTR707").gain(0.22).pan(0.3).lpf(10000)

// Clap / hand slap on beats 2 & 4
const clap = s("~ [cp] ~ [cp]")
  .bank("RolandTR707").gain(0.4).room(0.3).pan(0.6)

// ─────────────────────────────────────────────
// BASS — plucked lute-style bass line
// ─────────────────────────────────────────────

// D Dorian: D E F G A B C D
const bassVerse = note(`
  <
    [d2 ~ d2 ~] [g2 ~ g2 ~] [a2 ~ a2 ~] [f2 ~ f2 ~]
    [d2 ~ d2 ~] [g2 ~ g2 ~] [a2 ~ c3 d3] [d2 ~ ~ ~]
  >
`)
  .s("gm_acoustic_guitar_nylon")
  .gain(0.5)
  .lpf(1200)
  .decay(0.3).sustain(0.1)

const bassChorus = note(`
  <
    [d2 ~ a2 ~] [g2 ~ d2 ~] [f2 ~ c2 ~] [a2 ~ e2 ~]
    [d2 ~ f2 ~] [g2 ~ a2 ~] [bb2 ~ f2 ~] [a2 g2 f2 d2]
  >
`)
  .s("gm_acoustic_guitar_nylon")
  .gain(0.55)
  .lpf(1400)
  .decay(0.3).sustain(0.1)

// ─────────────────────────────────────────────
// LUTE / GUITAR — strummed chords
// ─────────────────────────────────────────────

// Verse chords: simple open strums, muted feel
const chordsVerse = note(`
  <
    [d3,f3,a3] [g3,b3,d4] [a3,c4,e4] [f3,a3,c4]
    [d3,f3,a3] [g3,b3,d4] [a3,e4,c4] [d3,a3,d4]
  >
`)
  .s("gm_acoustic_guitar_nylon")
  .lpf(3000)
  .gain(0.4)
  .room(0.3)
  .pan(0.4)

// Chorus: bigger strums, brighter
const chordsChorus = note(`
  <
    [d3,f3,a3,d4] [g3,b3,d4,g4] [f3,a3,c4,f4] [a3,c4,e4,a4]
    [d3,f3,a3,d4] [g3,b3,d4]     [bb2,f3,d4]   [a3,e4,c#4]
  >
`)
  .s("gm_acoustic_guitar_nylon")
  .lpf(sine.range(2000, 4500).slow(8))  // LPF opens as chorus builds
  .gain(0.5)
  .room(0.35)
  .pan(0.4)

// ─────────────────────────────────────────────
// MELODY — flute/recorder lead
// ─────────────────────────────────────────────

// Verse melody: D Dorian, stepwise, folk inflection
const melodyVerse = note(`
  <
    [d5 e5 f5 ~] [g5 ~ a5 ~] [~ g5 f5 e5] [d5 ~ ~ ~]
    [f5 ~ e5 ~] [d5 e5 f5 g5] [a5 g5 f5 e5] [d5 ~ ~ ~]
  >
`)
  .s("gm_flute")
  .gain(0.38)
  .lpf(6000)
  .delay(0.15).delaytime(0.125).delayfeedback(0.3)
  .room(0.4)

// Bridge: quieter, meandering, builds tension before chorus
const melodyBridge = note(`
  <
    [~ ~ c5 d5] [e5 ~ d5 ~] [c5 d5 e5 f5] [e5 ~ ~ ~]
  >
`)
  .s("gm_flute")
  .gain(0.28)
  .lpf(4000)
  .room(0.5)
  .pan(0.55)

// Chorus melody: higher, more triumphant
const melodyChorus = note(`
  <
    [d6 c6 b5 a5] [g5 ~ a5 b5] [c6 ~ b5 a5] [g5 ~ ~ ~]
    [a5 b5 c6 d6] [e6 ~ d6 ~]  [c6 b5 a5 g5] [a5 ~ d6 ~]
  >
`)
  .s("gm_flute")
  .gain(0.42)
  .lpf(sine.range(4000, 8000).slow(8))  // Opens up through chorus
  .delay(0.2).delaytime(0.25).delayfeedback(0.35)
  .room(0.4)

// ─────────────────────────────────────────────
// COUNTER MELODY — fiddle / violin pizzicato
// ─────────────────────────────────────────────

const fiddle = arrange(
  [4, silence],
  [8, silence],
  [4, silence],
  [8, note(`
    <
      [a4 ~ f4 ~] [g4 ~ e4 ~] [f4 e4 d4 c4] [d4 ~ ~ ~]
      [f4 ~ g4 ~] [a4 ~ b4 ~] [c5 ~ b4 a4] [a4 ~ ~ ~]
    >
  `).s("gm_violin")
    .gain(0.28).lpf(5000).room(0.35).pan(0.6)]
)

// ─────────────────────────────────────────────
// FULL ARRANGEMENT
// ─────────────────────────────────────────────

stack(
  // Drums: intro has just stomp, full kit from verse
  arrange(
    [2, stomp],
    [2, stack(stomp, tambourine)],
    [8, stack(stomp, tambourine, clap)],
    [4, stack(stomp, tambourine)],
    [8, stack(stomp, tambourine, clap)]
  ),
  // Bass: enters in verse
  arrange(
    [4, silence],
    [8, bassVerse],
    [4, bassVerse.slow(2)],
    [8, bassChorus]
  ),
  // Chords
  arrange(
    [4, silence],
    [8, chordsVerse],
    [4, silence],
    [8, chordsChorus]
  ),
  // Main melody
  arrange(
    [4, silence],
    [8, melodyVerse],
    [4, melodyBridge],
    [8, melodyChorus]
  ),
  // Fiddle counter melody (chorus only)
  fiddle
).cpm(95 / 4)
