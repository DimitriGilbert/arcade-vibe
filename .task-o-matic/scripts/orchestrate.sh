#!/usr/bin/env bash
# Arcade Vibe - Orchestrated Implementation Script
# Loops through plan chunks and executes them via opencode

set -euo pipefail

# Configuration
PROJECT_ROOT="/home/didi/workspace/Code/arcade-vibe"
PLANS_DIR="$PROJECT_ROOT/.task-o-matic/plans/chunks"
PRD_DIR="$PROJECT_ROOT/.task-o-matic/prd/chunks"
VISION_DOC="$PROJECT_ROOT/.task-o-matic/prd/prd-refined.md"
LOG_DIR="$PROJECT_ROOT/.task-o-matic/logs"

# Create log directory
mkdir -p "$LOG_DIR"

# Chunk definitions (plan file -> prd file)
declare -A CHUNKS=(
  ["01-database-core-routers.md"]="01-database-schema.md"
  ["02-ai-game-system.md"]="02-ai-game-system.md"
  ["03-moderation-integration.md"]="03-moderation-admin.md"
  ["04-components-pages.md"]="04-ui-components.md"
)

# Ordered chunk list
CHUNK_ORDER=(
  "01-database-core-routers.md"
  "02-ai-game-system.md"
  "03-moderation-integration.md"
  "04-components-pages.md"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Generate the orchestrator prompt for a chunk
generate_prompt() {
  local plan_file="$1"
  local prd_file="$2"
  local chunk_num="$3"
  local total_chunks="$4"
  
  cat <<EOF
# Arcade Vibe Implementation - Chunk ${chunk_num} of ${total_chunks}

## FIRST: Load the orchestration skill
\`\`\`
/skill subagent-orchestration
\`\`\`

## Vision Alignment Reminder

You are implementing **Arcade Vibe** - a competitive prompt engineering platform disguised as a retro arcade.

**Core Philosophy** (from vision document):
> "One prompt. One shot. One month to prove you're the best prompt engineer."

Key differentiators to maintain:
- Zero hand-holding: One shot means one shot
- Real-time streaming with Shiki syntax highlighting
- Per-game leaderboards with verified playtime/scores
- Secure SDK with token-authenticated score reporting
- Difficulty as strategy (smaller models = higher multipliers)
- Radical transparency with public prompts
- BYOK (Bring Your Own Key) support

## Critical Implementation Rules

**REMIND ALL IMPLEMENTER SUBAGENTS:**

1. **FULL TYPE SAFETY** - The use of \`any\` is **STRICTLY PROHIBITED** per AGENTS.md
2. **PRD LINE REFERENCES** - Every implementation MUST cite specific PRD line numbers
3. **Zod Validation** - All inputs validated with Zod 4 schemas
4. **Drizzle ORM** - Type-safe queries only
5. **tRPC v11** - Follow existing patterns
6. **Load Skills** - Load appropriate skills before implementation:
   - \`trpc\` for routers
   - \`formedible\` for forms
   - \`vercel/ai@ai-sdk\` for AI features
   - \`frontend-design\` for UI components

## Your Task

Execute the plan in this chunk following the subagent-orchestration workflow:

1. **Read the plan file**: \`${PLANS_DIR}/${plan_file}\`
2. **Read the PRD reference**: \`${PRD_DIR}/${prd_file}\`
3. **Execute each phase** using the implementer → validator → fixer pattern
4. **Validate after each phase** with \`pnpm run check-types\` and \`pnpm run build\`
5. **Report completion** when all phases in this chunk pass

## Files to Read

- Plan: \`${PLANS_DIR}/${plan_file}\`
- PRD: \`${PRD_DIR}/${prd_file}\`
- Vision (for context): \`${VISION_DOC}\` (lines 1-60 for mission/philosophy)

## Execution

Begin by reading the plan file and presenting it for approval. Once approved, execute all phases automatically without further user interaction until completion or failure.

**DO NOT WRITE CODE YOURSELF** - dispatch implementer subagents with complete requirements.
**VALIDATORS MUST READ CODE** - not just run commands.

Start now.
EOF
}

# Run a single chunk
run_chunk() {
  local chunk_num="$1"
  local plan_file="${CHUNK_ORDER[$((chunk_num - 1))]}"
  local prd_file="${CHUNKS[$plan_file]}"
  local total_chunks="${#CHUNK_ORDER[@]}"
  local timestamp=$(date +"%Y%m%d_%H%M%S")
  local log_file="$LOG_DIR/chunk_${chunk_num}_${timestamp}.log"
  
  log_info "Starting Chunk ${chunk_num}/${total_chunks}: ${plan_file}"
  log_info "PRD Reference: ${prd_file}"
  log_info "Log file: ${log_file}"
  
  # Generate prompt
  local prompt=$(generate_prompt "$plan_file" "$prd_file" "$chunk_num" "$total_chunks")
  
  # Save prompt to temp file for opencode
  local prompt_file=$(mktemp)
  echo "$prompt" > "$prompt_file"
  
  # Run opencode with the prompt
  # Using --yes to auto-approve, pipe prompt via stdin
  log_info "Launching opencode..."
  
  if opencode --yes < "$prompt_file" 2>&1 | tee "$log_file"; then
    log_success "Chunk ${chunk_num} completed successfully"
    rm "$prompt_file"
    return 0
  else
    log_error "Chunk ${chunk_num} failed. Check log: ${log_file}"
    rm "$prompt_file"
    return 1
  fi
}

# Verify prerequisites before running
verify_prerequisites() {
  log_info "Verifying prerequisites..."
  
  # Check opencode is available
  if ! command -v opencode &> /dev/null; then
    log_error "opencode not found in PATH"
    exit 1
  fi
  
  # Check plan files exist
  for plan_file in "${CHUNK_ORDER[@]}"; do
    if [[ ! -f "$PLANS_DIR/$plan_file" ]]; then
      log_error "Plan file not found: $PLANS_DIR/$plan_file"
      exit 1
    fi
  done
  
  # Check PRD files exist
  for prd_file in "${CHUNKS[@]}"; do
    if [[ ! -f "$PRD_DIR/$prd_file" ]]; then
      log_error "PRD file not found: $PRD_DIR/$prd_file"
      exit 1
    fi
  done
  
  # Check vision document exists
  if [[ ! -f "$VISION_DOC" ]]; then
    log_error "Vision document not found: $VISION_DOC"
    exit 1
  fi
  
  log_success "All prerequisites verified"
}

# Run validation between chunks
run_validation() {
  log_info "Running validation..."
  
  cd "$PROJECT_ROOT"
  
  if pnpm run check-types && pnpm run build; then
    log_success "Validation passed"
    return 0
  else
    log_error "Validation failed"
    return 1
  fi
}

# Main execution
main() {
  local start_chunk="${1:-1}"
  local end_chunk="${2:-${#CHUNK_ORDER[@]}}"
  
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║          Arcade Vibe - Orchestrated Implementation           ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║  Chunks: ${start_chunk} to ${end_chunk} of ${#CHUNK_ORDER[@]}                                          ║"
  echo "║  Project: ${PROJECT_ROOT}  ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  
  verify_prerequisites
  
  for ((i = start_chunk; i <= end_chunk; i++)); do
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "                      CHUNK ${i} OF ${#CHUNK_ORDER[@]}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    if ! run_chunk "$i"; then
      log_error "Chunk ${i} failed. Stopping execution."
      log_warning "To resume from this chunk, run: $0 ${i}"
      exit 1
    fi
    
    # Run validation after each chunk
    if ! run_validation; then
      log_error "Validation failed after chunk ${i}. Stopping execution."
      log_warning "Fix issues and resume with: $0 ${i}"
      exit 1
    fi
    
    log_success "Chunk ${i} complete and validated"
  done
  
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║                    ALL CHUNKS COMPLETE                       ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  
  log_success "Arcade Vibe implementation complete!"
}

# Help message
show_help() {
  cat <<EOF
Arcade Vibe - Orchestrated Implementation Script

Usage: $0 [start_chunk] [end_chunk]

Arguments:
  start_chunk  Chunk number to start from (1-4, default: 1)
  end_chunk    Chunk number to end at (1-4, default: 4)

Examples:
  $0              # Run all chunks (1-4)
  $0 2            # Run chunks 2-4
  $0 2 2          # Run only chunk 2
  $0 3 4          # Run chunks 3 and 4

Chunks:
  1. Database Schema & Core Routers (Phases 1-9)
  2. AI Integration & Game System (Phases 10-18)
  3. Moderation & Admin + Integration (Phases 19-22)
  4. Components & Pages (Phases 23-31)

Logs are saved to: ${LOG_DIR}/
EOF
}

# Parse arguments
case "${1:-}" in
  -h|--help|help)
    show_help
    exit 0
    ;;
  *)
    main "${1:-1}" "${2:-${#CHUNK_ORDER[@]}}"
    ;;
esac
