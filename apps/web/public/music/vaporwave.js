// VAPORWAVE - "Midnight Neon Rush"
// 85 BPM | Dark Neon Midnight | A(8, full) → B(8, stripped loneliness) loop

// --- DRUMS (masked out during B section using arrange) ---
const kick = arrange(
  [8, s("<[bd ~ ~ [sd,cp]]!7 [bd bd ~ [sd,cp*2]]>").bank("RolandTR808").shape(0.4).gain(1.2)],
  [8, s("[~ ~ ~ ~]!8").gain(0)] // complete drum drop in B
)

const hihat = arrange(
  [8, s("<[hh*4]!7 [hh*8]>").bank("RolandTR808").gain(0.4).room(0.5)],
  [8, s("hh(1,8)").bank("RolandTR808").gain(0.2).room(0.9)] // just a ghost hat in B
)

// --- SUB-BASS (persists through both, gets sparser in B) ---
const bass = arrange(
  [8, note("<a1 ~ f1 ~ a1 ~ e1 ~ a1 ~ f1 ~ d1 e1 f1 g1>").s("sawtooth")
    .lpf(900).lpq(2).sustain(0.85).room(0.3)],
  [8, note("<a1 ~ ~ ~ f1 ~ ~ ~ a1 ~ ~ ~ e1 ~ ~ ~>").s("sawtooth") // way sparser in B
    .lpf(600).lpq(3).sustain(0.9).room(0.5)]
)

// --- WARPED CHORDS (more motion in A, haunting in B) ---
const chordsA = arrange([8,
  note("<[a2,c3,e3,g3] [f2,a2,c3,e3] [d2,f2,a2,c3] [e2,g2,b2,d3] [a2,c3,e3,g3] [f2,a2,c3,e3] [d2,f2,a2,c3] [e2,g2,b2,d3,f3]>")
    .s("supersaw").lpf(1300).room(0.75).size(0.75).gain(0.6).jux(rev).vib("4:0.35").slow(2)
])

const chordsB = arrange([8,
  note("<[a2,c3,e3,g3] [f2,a2,c3,e3] [d2,f2,a2,c3] [e2,g2,b2,d3] [a2,c3,e3,g3] [f2,a2,c3,e3] [d2,f2,a2,c3] [e2,g2,b2,d3,f3]>")
    .s("supersaw")
    .lpf(sine.range(600, 1800).slow(8)) // filter slowly opens as B builds back up
    .room(0.95).size(0.9).gain(0.7).jux(rev).vib("3:0.5").slow(2) // wider, more warped
])

// --- LEAD MELODY ---
const melodyA = arrange([8,
  note("<[e4 ~ c4 ~] [~ ~ ~ ~] [d4 ~ a3 ~] [~ b3 c4 ~] [e4 ~ c4 ~] [f4 ~ ~ ~] [d4 ~ b3 ~] [a3 ~ ~ ~]>")
    .s("square").lpf(2200).delay(0.65).delayt(0.34).room(0.8).gain(0.42)
])

const melodyB = arrange([8, // even sparser, lonelier — just a few notes floating in space
  note("<[e5 ~ ~ ~] [~ ~ ~ ~] [~ ~ c5 ~] [~ ~ ~ ~] [d5 ~ ~ ~] [~ b4 ~ ~] [~ ~ a4 ~] [~ ~ ~ ~]>")
    .s("square").lpf(1800).delay(0.75).delayt(0.5).room(0.95).size(0.9).gain(0.38)
])

stack(
  kick, hihat, bass,
  arrange([8, chordsA], [8, chordsB]),
  arrange([8, melodyA], [8, melodyB])
).cpm(85/4)
