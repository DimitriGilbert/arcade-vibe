# PRD Chunk 4: UI Components & Pages

**Source**: `prd-refined.md` lines 826-975 (Diff/Genealogy), 78-98 (System Architecture UI), 2184-2194 (Admin UI)

---

## Visual Prompt Diff Tool (Lines 826-881)

### Component Implementation

```typescript
import { useMemo } from "react";
import { diffWords } from "diff";

interface PromptDiffProps {
  leftContent: string;
  rightContent: string;
  leftVersion: number;
  rightVersion: number;
}

export function PromptDiff({ leftContent, rightContent, leftVersion, rightVersion }: PromptDiffProps) {
  const diff = useMemo(() => {
    return diffWords(leftContent, rightContent);
  }, [leftContent, rightContent]);

  const renderDiff = (d: diff.Change[]) => {
    return d.map((part, index) => {
      const style = part.added
        ? "bg-green-200 text-green-900"
        : part.removed
        ? "bg-red-200 text-red-900 line-through"
        : "text-gray-900";

      return (
        <span key={index} className={style}>
          {part.value}
        </span>
      );
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="border-r pr-4">
        <h3 className="font-bold mb-2">Version {leftVersion}</h3>
        <div className="whitespace-pre-wrap text-sm font-mono">
          {renderDiff(diff.filter((d) => !d.added))}
        </div>
      </div>
      <div className="pl-4">
        <h3 className="font-bold mb-2">Version {rightVersion}</h3>
        <div className="whitespace-pre-wrap text-sm font-mono">
          {renderDiff(diff.filter((d) => !d.removed))}
        </div>
      </div>
    </div>
  );
}
```

---

## Prompts Router for Versioning (Lines 886-920)

```typescript
export const promptsRouter = router({
  getVersion: publicProcedure
    .input(z.object({
      promptId: z.string().uuid(),
      version: z.number().int().min(1),
    }))
    .query(async ({ input }) => {
      return db.query.prompts.findFirst({
        where: and(
          eq(prompts.id, input.promptId),
          eq(prompts.version, input.version),
        ),
        columns: { content: true, createdAt: true, version: true },
      });
    }),

  listVersions: publicProcedure
    .input(z.object({ promptId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db.query.prompts.findMany({
        where: eq(prompts.id, input.promptId),
        orderBy: [asc(prompts.version)],
        columns: {
          id: true,
          version: true,
          createdAt: true,
          contentHash: true,
          tokenCount: true,
        },
      });
    }),
});
```

---

## Genealogy Tree with Diff (Lines 922-975)

```typescript
export function PromptGenealogyTree({ promptId }: { promptId: string }) {
  const versions = trpc.prompts.listVersions.useQuery({ promptId });
  const [selectedVersions, setSelectedVersions] = useState<[number, number]>([1, 2]);

  const leftVersion = trpc.prompts.getVersion.useQuery(
    { promptId, version: selectedVersions[0] },
    { enabled: !!versions.data }
  );
  const rightVersion = trpc.prompts.getVersion.useQuery(
    { promptId, version: selectedVersions[1] },
    { enabled: !!versions.data }
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select
          value={selectedVersions[0]}
          onChange={(e) => setSelectedVersions([parseInt(e.target.value), selectedVersions[1]])}
        >
          {versions.data?.map((v) => (
            <option key={v.id} value={v.version}>
              Version {v.version} ({new Date(v.createdAt).toLocaleDateString()})
            </option>
          ))}
        </select>
        <select
          value={selectedVersions[1]}
          onChange={(e) => setSelectedVersions([selectedVersions[0], parseInt(e.target.value)])}
        >
          {versions.data?.map((v) => (
            <option key={v.id} value={v.version}>
              Version {v.version} ({new Date(v.createdAt).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {leftVersion.data && rightVersion.data && (
        <PromptDiff
          leftContent={leftVersion.data.content}
          rightContent={rightVersion.data.content}
          leftVersion={selectedVersions[0]}
          rightVersion={selectedVersions[1]}
        />
      )}
    </div>
  );
}
```

---

## Scoring Algorithm (Lines 978-1070)

```typescript
async function calculateScore(gameId: string) {
  const game = await db.query.games.findFirst({
    where: eq(games.id, gameId),
    with: { ratings: true, prompt: true },
  });

  // Fetch dynamic platform stats
  const globalAvgRatingStat = await db.query.platformStats.findFirst({
    where: eq(platformStats.statKey, 'global_avg_rating'),
  });
  const minVotesStat = await db.query.platformStats.findFirst({
    where: eq(platformStats.statKey, 'min_votes_bayesian'),
  });

  const globalAvgRating = Number(globalAvgRatingStat?.statValue) || 3.5;
  const minVotes = Number(minVotesStat?.statValue) || 5;

  // 1. Quality Score (40%) - Bayesian Average Rating
  const avgRating = game.ratings.length > 0
    ? game.ratings.reduce((sum, r) => sum + r.overallScore, 0) / game.ratings.length
    : 0;
  const bayesianRating = (avgRating * game.ratings.length + globalAvgRating * minVotes) / (game.ratings.length + minVotes);
  const qualityScore = bayesianRating * 20;

  // 2. Difficulty Score (25%) - Model Tier Multiplier
  const tierMultipliers = {
    cheater: 0.8,
    easy: 0.9,
    normal: 1.0,
    hard: 1.25,
    impossible: 2.5,
  };
  const difficultyScore = (tierMultipliers[game.modelTier] || 1.0) * 20;

  // 3. Efficiency Score (20%) - Brevity Bonus
  const tokenCount = game.prompt.tokenCount;
  const brevityBonus = tokenCount <= 500
    ? 1.0
    : Math.max(0, 1.0 - Math.log10(tokenCount / 500) / 2);
  const efficiencyScore = brevityBonus * 20;

  // 4. Engagement Score (10%) - Average Playtime
  const avgPlaytimeSeconds = game.ratings.length > 0
    ? game.ratings.reduce((sum, r) => sum + r.playtimeSeconds, 0) / game.ratings.length
    : 0;
  const engagementNormalized = Math.min(avgPlaytimeSeconds / 300, 1.0);
  const engagementScore = engagementNormalized * 20;

  // 5. Popularity Score (5%) - Vote Volume
  const voteCount = game.ratings.length;
  const popularityNormalized = Math.min(voteCount / 100, 1.0);
  const popularityScore = popularityNormalized * 20;

  // Final Score
  const finalScore =
    qualityScore * 0.4 +
    difficultyScore * 0.25 +
    efficiencyScore * 0.2 +
    engagementScore * 0.1 +
    popularityScore * 0.05;

  await db.insert(scores).values({
    gameId,
    bayesianRating,
    difficultyMultiplier: tierMultipliers[game.modelTier],
    brevityScore: brevityBonus,
    engagementScore: engagementNormalized,
    popularityScore: popularityNormalized,
    finalScore,
    calculatedAt: new Date(),
    version: 1,
  });

  await redis.xadd(
    `leaderboard:${game.themeId}`,
    '*',
    { gameId, finalScore: finalScore.toString() }
  );
}
```

---

## Client Components (Lines 78-98)

### UI Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Client Layer (Next.js 16)                 │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │   Prompt     │  │     Game     │  │   Leaderboard    │  │
│   │   Editor     │  │    Player    │  │   & Profile      │  │
│   │  (Monaco)    │  │  (iframe)    │  │  (WebSocket)     │  │
│   └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │   Streaming  │  │   Version    │  │   Genealogy      │  │
│   │   Code View  │  │    Control   │  │    Tree          │  │
│   │  (Shiki)     │  │  (Diff View) │  │  (react-flow)    │  │
│   └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │   Admin      │  │   Game       │  │   Moderation     │  │
│   │  Dashboard   │  │  Leaderboard │  │     Queue        │  │
│   │  (Reports)   │  │  (Per-Game)  │  │   ( Appeals )    │  │
│   └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Required Pages

### 1. Prompt Editor (`/editor`)
- Monaco editor for prompt writing
- Model selector with tier badges (Cheater/Easy/Normal/Hard/Impossible)
- Credit cost display (updates based on selected model)
- Generate button with streaming output
- Version history sidebar
- Diff viewer for comparing versions
- Fork button for public prompts

### 2. Arcade Browse (`/arcade`)
- Theme selector (current + archived)
- Game grid with difficulty badges
- Sorting: Score, Popularity, Recent
- Search/filter by creator
- Click to play

### 3. Game Play (`/game/[id]`)
- Full-screen game iframe with sandbox
- Leaderboard sidebar (real-time updates)
- Rating form (enabled after 60s playtime)
- Share button
- View prompt button (if public)
- Report button

### 4. Profile (`/profile/[username]`)
- User stats: games created, total ratings, reputation
- List of user's prompts with versions
- List of user's games with rankings
- Prompt runs history
- Credit balance (own profile only)

### 5. Settings (`/settings`)
- Profile settings
- API key management (BYOK)
- Subscription management
- Credit purchase

### 6. Admin Dashboard (`/admin`)
- Plan management
- Model management
- Moderation queue
- User management
- Audit log
- Theme management

---

## Component Requirements

### Streaming Code Viewer
- Uses Shiki for syntax highlighting
- Displays code as it streams
- Theme toggle (github-dark, github-light)
- Shows generation progress
- Copy button

### Game Player (Iframe)
- Sandbox attributes: `allow-scripts allow-same-origin`
- `referrerpolicy="no-referrer"`
- Loading state with spinner
- Error boundary for broken games
- Session token injection

### Rating Form
- 1-5 star overall rating (required)
- Optional sub-ratings: gameplay, visuals, creativity, technical
- Optional review text
- Disabled until 60s playtime reached
- One rating per user per game

### Leaderboard Sidebar
- Real-time updates via tRPC subscription
- Top 50 scores
- User's own rank highlighted
- Score, username, playtime displayed

### Model Selector
- Grouped by tier
- Tier multiplier displayed
- Credit cost per model
- Active/inactive status
- BYOK option

### Admin Tables
- Sortable columns
- Pagination
- Bulk actions where appropriate
- Confirmation dialogs for destructive actions
- Audit trail links
