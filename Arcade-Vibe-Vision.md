# Arcade Vibe - Vision Document

## Mission
Create a competitive prompt engineering platform disguised as a retro arcade, where the game IS the meta-game: crafting the perfect one-shot prompt to generate playable games.

## Core Philosophy
**"One prompt. One shot. One month to prove you're the best prompt engineer."**

This isn't about who can code the best game - it's about who can make AI code the best game. Every month is a fresh challenge, a new theme, and a clean leaderboard. The community doesn't just play games; they dissect prompts, fork strategies, and push the boundaries of what single-shot generation can achieve.

## The Experience

### For Participants (Prompt Engineers)
You receive a monthly theme with core requirements that never changes (scoring system, lives, levels, responsive, iframe compatibility). You craft a single-message prompt with zero context, zero history - pure instruction. You choose your weapon: GPT-5.3|Opus-4.6 (Cheater), GLM-4.7|Kimi-k2.5 (normal) Deepseek-3.2|GPT-5.1-mini|Haiku-4.5 (hard mode), or go full masochist with a tiny model rated "Impossible" with tiny models

You iterate, creating versions and forks. Each attempt is preserved - your evolution as a prompt engineer is documented. When you're ready, you publish. The community plays your game, rates it.
you can run your prompt on multiple models at a time to compare the results of each

Your prompts can either be private, public at the end of the month or full public from their run

Your score isn't just about ratings. It's a formula that rewards:
- High average ratings (quality)
- Difficult model selection (handicap multiplier)
- Prompt brevity (efficiency, anti-cheating)
- Actual playtime average (engagement)
- Vote volume (popularity)

### For Players (The Community)
You browse the monthly arcade. Each game shows its difficulty badge. You play, you rate, you see the leaderboard shift. If a prompt is public, you can view its entire evolution - every fork, every refinement. You can even run that prompt yourself on a different model with your own API key, contributing to the meta-analysis of prompt portability.

Your profile tracks both your creations and your "prompt runs" - games you generated using others' prompts.

### Monthly Lifecycle
1. **Week 1**: Theme announcement. Chaos. Everyone experimenting.
2. **Week 2-3**: Refinement. Leaders emerge. Community testing intensifies.
3. **Week 4**: Final push. Leaderboard solidifies.
4. **Month End**: Rankings freeze. Games become permanent gallery pieces with locked rankings. New theme drops.

## Technical Architecture

### Stack
this is strict and the whole app is bootstraped
- **Frontend**: Next.js 16 (App Router)
- **API Layer**: tRPC v11 (type-safe, no REST overhead)
- **Database**: Drizzle ORM on PostgreSQL 18
- **Auth**: Better Auth (modern, secure)
- **Styling**: Tailwind v4 + shadcn/ui components
- **AI Integration**: Vercel AI SDK v6 + AI SDK-React for streaming/generation
- **Validation**: Zod 4 (schema validation across stack)

## What Makes This Different

This isn't another "build games with AI" tool. It's a **competitive sport for prompt engineers** with:
- **Zero hand-holding**: One shot means one shot. No iteration mid-generation.
- **Difficulty as strategy**: Smaller models = higher multipliers. Risk/reward.
- **Radical transparency**: Public prompts become community learning resources.
- **Anti-gaming**: Brevity scoring prevents prompt dumping from other AIs.
- **Persistent legacy**: Every month's games live forever with frozen rankings.

## Success Metrics (North Stars)

- **Engagement**: Average session length per game
- **Quality**: % of entries rated ≥4 stars
- **Virality**: Prompt runs (using others' prompts) vs original submissions ratio
- **Retention**: % of participants returning for Month 2
- **Innovation**: Diversity of model choices (not everyone using Opus)

## Future Considerations (Post-Launch)

- **Team competitions**: Collaborative prompt engineering
- **Live events**: 24-hour prompt jams
- **Prompt marketplace**: Sell your winning prompts as templates
- **Model leaderboards**: Which AI is best at game generation?
- **Categories/tags**: When we hit scale, segment by game genre

---

**This is the arena. The prompt is your weapon. The model is your handicap. The leaderboard is immortal. Welcome to Arcade Vibe.**
