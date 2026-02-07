#!/bin/bash
# @parseArger-begin
# @parseArger-help "Arcade Vibe - Orchestrated Implementation with multi-harness support" --option "help" --short-option "h"
# @parseArger-version "2.0.0" --option "version" --short-option "v"
# @parseArger-verbose --option "verbose" --level "0" --quiet-option "quiet"
_has_colors=0
if [ -t 1 ]; then # Check if stdout is a terminal
	ncolors=$(tput colors 2>/dev/null)
	if [ -n "$ncolors" ] && [ "$ncolors" -ge 8 ]; then
		_has_colors=1
	fi
fi
# @parseArger-declarations
# @parseArger opt start-chunk "Chunk number to start from (1-4)" --short s --default-value "1"
# @parseArger opt end-chunk "Chunk number to end at (1-4)" --short e --default-value "4"
# @parseArger opt harness "AI harness to use" --short H --default-value "opencode" --one-of "opencode" --one-of "claude" --one-of "gemini" --one-of "codex" --one-of "kilo"
# @parseArger opt model "Model to use (depends on harness)" --short m
# @parseArger opt project-root "Project root directory" --default-value "/home/didi/workspace/Code/arcade-vibe"
# @parseArger flag dry-run "Show commands without executing" --short n
# @parseArger flag skip-commit "Skip automatic commits between phases"
# @parseArger flag skip-push "Skip automatic push after commits"
# @parseArger-declarations-end

# @parseArger-utils
_helpHasBeenPrinted=1;
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)";
# @parseArger-utils-end

# @parseArger-parsing

__cli_arg_count=$#;

die()
{
	local _ret=1
    if [[ -n "$2" ]] && [[ "$2" =~ ^[0-9]+$ ]]; then
   	_ret="$2"
    fi
	test "${_PRINT_HELP:-no}" = yes && print_help >&2
	log "$1" -3 >&2
	exit "${_ret}"
}


begins_with_short_option()
{
	local first_option all_short_options=''
	first_option="${1:0:1}"
	test "$all_short_options" = "${all_short_options/$first_option/}" && return 1 || return 0
}

# POSITIONALS ARGUMENTS
_positionals=();
_optional_positionals=();
# OPTIONALS ARGUMENTS
_arg_start_chunk="1"
_arg_end_chunk="4"
_arg_harness="opencode"
_one_of_arg_harness=("opencode" "claude" "gemini" "codex" "kilo" );
_arg_model=
_arg_project_root="/home/didi/workspace/Code/arcade-vibe"
# FLAGS
_arg_dry_run="off"
_arg_skip_commit="off"
_arg_skip_push="off"
# NESTED
_verbose_level="0";



print_help()
{
	_triggerSCHelp=1;

	if [[ "$_helpHasBeenPrinted" == "1" ]]; then
		_helpHasBeenPrinted=0;
		echo -e "Arcade Vibe - Orchestrated Implementation with multi-harness support:"
	echo -e "	-s, --start-chunk <start-chunk>: Chunk number to start from (1-4) [default: ' 1 ']"
	echo -e "	-e, --end-chunk <end-chunk>: Chunk number to end at (1-4) [default: ' 4 ']"
	echo -e "	-H, --harness <harness>: AI harness to use [default: ' opencode '] [one of 'opencode' 'claude' 'gemini' 'codex' 'kilo']"
	echo -e "	-m, --model <model>: Model to use (depends on harness)"
	echo -e "	--project-root <project-root>: Project root directory [default: ' /home/didi/workspace/Code/arcade-vibe ']"
	echo -e "	-n|--dry-run|--no-dry-run: Show commands without executing"
	echo -e "	--skip-commit|--no-skip-commit: Skip automatic commits between phases"
	echo -e "	--skip-push|--no-skip-push: Skip automatic push after commits"
	echo -e "Usage :
	$0 [--start-chunk <value>] [--end-chunk <value>] [--harness <value>] [--model <value>] [--project-root <value>] [--[no-]dry-run] [--[no-]skip-commit] [--[no-]skip-push]";
	fi

}

log() {
	local _arg_msg="${1}";
	local _arg_level="${2:-0}";
	if [ "${_arg_level}" -le "${_verbose_level}" ]; then
		case "$_arg_level" in
			-3)
				_arg_COLOR="[0;31m";
				;;
			-2)
				_arg_COLOR="[0;33m";
				;;
			-1)
				_arg_COLOR="[1;33m";
				;;
			1)
				_arg_COLOR="[0;32m";
				;;
			2)
				_arg_COLOR="[1;36m";
				;;
			3)
				_arg_COLOR="[0;36m";
				;;
			*)
				_arg_COLOR="[0m";
				;;
		esac
		if [ "${_has_colors}" == "1" ]; then
			echo -e "${_arg_COLOR}${_arg_msg}[0m";
		else
			echo "${_arg_msg}";
		fi
	fi
}

parse_commandline()
{
	_positionals_count=0
	while test $# -gt 0
	do
		_key="$1"
		case "$_key" in
			-s|--start-chunk)
				test $# -lt 2 && die "Missing value for the option: '$_key'" 1
				_arg_start_chunk="$2"
				shift
				;;
			--start-chunk=*)
				_arg_start_chunk="${_key##--start-chunk=}"
				;;
			-s*)
				_arg_start_chunk="${_key##-s}"
				;;
			
			-e|--end-chunk)
				test $# -lt 2 && die "Missing value for the option: '$_key'" 1
				_arg_end_chunk="$2"
				shift
				;;
			--end-chunk=*)
				_arg_end_chunk="${_key##--end-chunk=}"
				;;
			-e*)
				_arg_end_chunk="${_key##-e}"
				;;
			
			-H|--harness)
				test $# -lt 2 && die "Missing value for the option: '$_key'" 1
				_arg_harness="$2"
				if [[ "${#_one_of_arg_harness[@]}" -gt 0 ]];then [[ "${_one_of_arg_harness[*]}" =~ (^|[[:space:]])"$_arg_harness"($|[[:space:]]) ]] || die "harness must be one of: opencode claude gemini codex kilo";fi
				shift
				;;
			--harness=*)
				_arg_harness="${_key##--harness=}"
				if [[ "${#_one_of_arg_harness[@]}" -gt 0 ]];then [[ "${_one_of_arg_harness[*]}" =~ (^|[[:space:]])"$_arg_harness"($|[[:space:]]) ]] || die "harness must be one of: opencode claude gemini codex kilo";fi
				;;
			-H*)
				_arg_harness="${_key##-H}"
				if [[ "${#_one_of_arg_harness[@]}" -gt 0 ]];then [[ "${_one_of_arg_harness[*]}" =~ (^|[[:space:]])"$_arg_harness"($|[[:space:]]) ]] || die "harness must be one of: opencode claude gemini codex kilo";fi
				;;
			
			-m|--model)
				test $# -lt 2 && die "Missing value for the option: '$_key'" 1
				_arg_model="$2"
				shift
				;;
			--model=*)
				_arg_model="${_key##--model=}"
				;;
			-m*)
				_arg_model="${_key##-m}"
				;;
			
			--project-root)
				test $# -lt 2 && die "Missing value for the option: '$_key'" 1
				_arg_project_root="$2"
				shift
				;;
			--project-root=*)
				_arg_project_root="${_key##--project-root=}"
				;;
			
			-n|--dry-run)
				_arg_dry_run="on"
				;;
			--no-dry-run)
				_arg_dry_run="off"
				;;
			--skip-commit)
				_arg_skip_commit="on"
				;;
			--no-skip-commit)
				_arg_skip_commit="off"
				;;
			--skip-push)
				_arg_skip_push="on"
				;;
			--no-skip-push)
				_arg_skip_push="off"
				;;
			-h|--help)
				print_help;
				exit 0;
				;;
			-h*)
				print_help;
				exit 0;
				;;
			-v|--version)
				print_version;
				exit 0;
				;;
			-v*)
				print_version;
				exit 0;
				;;
			--verbose)
				if [ $# -lt 2 ];then
					_verbose_level="$((_verbose_level + 1))";
				else
					_verbose_level="$2";
					shift;
				fi
				;;
			--quiet)
				if [ $# -lt 2 ];then
					_verbose_level="$((_verbose_level - 1))";
				else
					_verbose_level="-$2";
					shift;
				fi
				;;
			
				*)
				_last_positional="$1"
				_positionals+=("$_last_positional")
				_positionals_count=$((_positionals_count + 1))
				;;
		esac
		shift
	done
}


handle_passed_args_count()
{
	local _required_args_string=""
	if [ "${_positionals_count}" -gt 0 ] && [ "$_helpHasBeenPrinted" == "1" ];then
		_PRINT_HELP=yes die "FATAL ERROR: There were spurious positional arguments --- we expect at most 0 (namely: $_required_args_string), but got ${_positionals_count} (the last one was: '${_last_positional}').
	${_positionals[*]}" 1
	fi
	if [ "${_positionals_count}" -lt 0 ] && [ "$_helpHasBeenPrinted" == "1" ];then
		_PRINT_HELP=yes die "FATAL ERROR: Not enough positional arguments - we require at least 0 (namely: $_required_args_string), but got only ${_positionals_count}.
	${_positionals[*]}" 1;
	fi
}


assign_positional_args()
{
	local _positional_name _shift_for=$1;
	_positional_names="";
	shift "$_shift_for"
	for _positional_name in ${_positional_names};do
		test $# -gt 0 || break;
		eval "if [ \"\$_one_of${_positional_name}\" != \"\" ];then [[ \"\${_one_of${_positional_name}[*]}\" =~ \"\${1}\" ]];fi" || die "${_positional_name} must be one of: $(eval "echo \"\${_one_of${_positional_name}[*]}\"")" 1;
		local _match_var="_match${_positional_name}";
		local _regex="${!_match_var}";
		if [ -n "$_regex" ]; then
			[[ "${1}" =~ $_regex ]] || die "${_positional_name} does not match pattern: $_regex"
		fi
		eval "$_positional_name=\${1}" || die "Error during argument parsing, possibly an ParseArger bug." 1;
		shift;
	done
}

print_debug()
{
	print_help
	# shellcheck disable=SC2145
	echo "DEBUG: $0 $@";
	
	echo -e "	start-chunk: ${_arg_start_chunk}";
	echo -e "	end-chunk: ${_arg_end_chunk}";
	echo -e "	harness: ${_arg_harness}";
	echo -e "	model: ${_arg_model}";
	echo -e "	project-root: ${_arg_project_root}";
	echo -e "	dry-run: ${_arg_dry_run}";
	echo -e "	skip-commit: ${_arg_skip_commit}";
	echo -e "	skip-push: ${_arg_skip_push}";

}


print_version()
{
	echo "2.0.0";
}


on_interrupt() {
	die Process aborted! 130;
}


parse_commandline "$@";
handle_passed_args_count;
assign_positional_args 1 "${_positionals[@]}";
trap on_interrupt INT;




# @parseArger-parsing-end
# print_debug "$@"
# @parseArger-end

# ============================================================================
# CONFIGURATION
# ============================================================================

set -euo pipefail

PROJECT_ROOT="${_arg_project_root}"
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

# ============================================================================
# HARNESS CONFIGURATION
# ============================================================================

# Default models per harness (empty = use harness default)
declare -A DEFAULT_MODELS=(
  ["opencode"]=""
  ["claude"]="sonnet"
  ["gemini"]=""
  ["codex"]=""
  ["kilo"]=""
)

# ============================================================================
# COMMAND BUILDING (using arrays for safety)
# ============================================================================

# Build harness command array for running a prompt file
# Usage: build_harness_cmd <prompt_file>
# Sets: HARNESS_CMD array
build_harness_cmd() {
  local prompt_file="$1"
  local model="${_arg_model:-${DEFAULT_MODELS[$_arg_harness]}}"
  
  HARNESS_CMD=()
  
  case "$_arg_harness" in
    opencode)
      # opencode run [message..] - message as positional args
      HARNESS_CMD=(opencode run)
      [[ -n "$model" ]] && HARNESS_CMD+=(-m "$model")
      HARNESS_CMD+=("$(<"$prompt_file")")
      ;;
    claude)
      # claude -p "prompt" - print mode (non-interactive)
      HARNESS_CMD=(claude -p)
      [[ -n "$model" ]] && HARNESS_CMD+=(--model "$model")
      HARNESS_CMD+=("$(<"$prompt_file")")
      ;;
    gemini)
      # gemini [query..] - non-interactive headless mode
      HARNESS_CMD=(gemini)
      [[ -n "$model" ]] && HARNESS_CMD+=(-m "$model")
      HARNESS_CMD+=(-y)  # yolo mode for auto-approve
      HARNESS_CMD+=("$(<"$prompt_file")")
      ;;
    codex)
      # codex exec [PROMPT] - non-interactive mode
      HARNESS_CMD=(codex exec)
      [[ -n "$model" ]] && HARNESS_CMD+=(-m "$model")
      HARNESS_CMD+=(--full-auto)
      HARNESS_CMD+=("$(<"$prompt_file")")
      ;;
    kilo)
      # kilo run [message..] - message as positional args
      HARNESS_CMD=(kilo run)
      [[ -n "$model" ]] && HARNESS_CMD+=(-m "$model")
      HARNESS_CMD+=(--auto)
      HARNESS_CMD+=("$(<"$prompt_file")")
      ;;
    *)
      die "Unknown harness: $_arg_harness" 1
      ;;
  esac
}

# Build harness command for running a simple message (for commits)
# Usage: build_harness_msg_cmd <message>
# Sets: HARNESS_MSG_CMD array
build_harness_msg_cmd() {
  local message="$1"
  local model="${_arg_model:-${DEFAULT_MODELS[$_arg_harness]}}"
  
  HARNESS_MSG_CMD=()
  
  case "$_arg_harness" in
    opencode)
      HARNESS_MSG_CMD=(opencode run)
      [[ -n "$model" ]] && HARNESS_MSG_CMD+=(-m "$model")
      HARNESS_MSG_CMD+=("$message")
      ;;
    claude)
      HARNESS_MSG_CMD=(claude -p)
      [[ -n "$model" ]] && HARNESS_MSG_CMD+=(--model "$model")
      HARNESS_MSG_CMD+=("$message")
      ;;
    gemini)
      HARNESS_MSG_CMD=(gemini)
      [[ -n "$model" ]] && HARNESS_MSG_CMD+=(-m "$model")
      HARNESS_MSG_CMD+=(-y -p "$message")
      ;;
    codex)
      HARNESS_MSG_CMD=(codex exec)
      [[ -n "$model" ]] && HARNESS_MSG_CMD+=(-m "$model")
      HARNESS_MSG_CMD+=(--full-auto "$message")
      ;;
    kilo)
      HARNESS_MSG_CMD=(kilo run)
      [[ -n "$model" ]] && HARNESS_MSG_CMD+=(-m "$model")
      HARNESS_MSG_CMD+=(--auto "$message")
      ;;
    *)
      die "Unknown harness: $_arg_harness" 1
      ;;
  esac
}

# Run harness with prompt file
# Usage: run_harness_with_file <prompt_file> <log_file>
run_harness_with_file() {
  local prompt_file="$1"
  local log_file="$2"
  
  build_harness_cmd "$prompt_file"
  
  log "Command: ${HARNESS_CMD[*]}" 2
  
  "${HARNESS_CMD[@]}" 2>&1 | tee "$log_file"
}

# Run harness with simple message
# Usage: run_harness_with_message <message>
run_harness_with_message() {
  local message="$1"
  
  build_harness_msg_cmd "$message"
  
  log "Command: ${HARNESS_MSG_CMD[*]}" 2
  
  "${HARNESS_MSG_CMD[@]}"
}

# ============================================================================
# GIT OPERATIONS
# ============================================================================

# Commit changes using the harness
commit_changes() {
  local chunk_num="$1"
  local plan_file="$2"
  
  if [[ "$_arg_skip_commit" == "on" ]]; then
    log "Skipping commit (--skip-commit)" 1
    return 0
  fi
  
  local commit_msg="feat(orchestrate): complete chunk ${chunk_num} - ${plan_file%.md}"
  
  log "Committing changes: $commit_msg" 0
  
  cd "$PROJECT_ROOT"
  
  # Check if there are changes to commit
  if git diff --quiet && git diff --staged --quiet; then
    log "No changes to commit" 1
    return 0
  fi
  
  local commit_prompt="Please commit all current changes with this exact message: '${commit_msg}'. Run: git add -A && git commit -m '${commit_msg}'"
  
  if [[ "$_arg_dry_run" == "on" ]]; then
    build_harness_msg_cmd "$commit_prompt"
    log "[DRY-RUN] Would execute: ${HARNESS_MSG_CMD[*]}" 0
    return 0
  fi
  
  log "Executing commit via ${_arg_harness}..." 1
  if run_harness_with_message "$commit_prompt"; then
    log "Commit successful" 1
    return 0
  else
    log "Commit failed, falling back to direct git commit" -1
    git add -A && git commit -m "$commit_msg" || true
    return 0
  fi
}

# Push current branch to origin
push_to_origin() {
  if [[ "$_arg_skip_push" == "on" ]]; then
    log "Skipping push (--skip-push)" 1
    return 0
  fi
  
  cd "$PROJECT_ROOT"
  
  local current_branch
  current_branch=$(git branch --show-current)
  
  log "Pushing branch '$current_branch' to origin..." 0
  
  if [[ "$_arg_dry_run" == "on" ]]; then
    log "[DRY-RUN] Would execute: git push origin $current_branch" 0
    return 0
  fi
  
  if git push origin "$current_branch"; then
    log "Push successful" 1
    return 0
  else
    log "Push failed" -2
    return 1
  fi
}

# ============================================================================
# PROMPT GENERATION
# ============================================================================

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

**THIS IS A NON-INTERACTIVE AUTOMATED RUN. DO NOT ASK FOR APPROVAL.**

The plan is PRE-APPROVED. Execute ALL phases immediately and automatically:
1. Read the plan file
2. Execute each phase using implementer → validator → fixer pattern
3. Continue until ALL phases complete or max retries reached
4. Report final status

**DO NOT WRITE CODE YOURSELF** - dispatch implementer subagents with complete requirements.
**VALIDATORS MUST READ CODE** - not just run commands.
**DO NOT STOP TO ASK QUESTIONS** - execute the entire plan autonomously.

Begin execution NOW.
EOF
}

# ============================================================================
# CHUNK EXECUTION
# ============================================================================

run_chunk() {
  local chunk_num="$1"
  local plan_file="${CHUNK_ORDER[$((chunk_num - 1))]}"
  local prd_file="${CHUNKS[$plan_file]}"
  local total_chunks="${#CHUNK_ORDER[@]}"
  local timestamp
  timestamp=$(date +"%Y%m%d_%H%M%S")
  local log_file="$LOG_DIR/chunk_${chunk_num}_${_arg_harness}_${timestamp}.log"
  
  log "Starting Chunk ${chunk_num}/${total_chunks}: ${plan_file}" 0
  log "PRD Reference: ${prd_file}" 1
  log "Harness: ${_arg_harness}${_arg_model:+ (model: $_arg_model)}" 1
  log "Log file: ${log_file}" 1
  
  # Generate prompt
  local prompt
  prompt=$(generate_prompt "$plan_file" "$prd_file" "$chunk_num" "$total_chunks")
  
  # Save prompt to temp file
  local prompt_file
  prompt_file=$(mktemp)
  echo "$prompt" > "$prompt_file"
  
  log "Launching ${_arg_harness}..." 0
  
  if [[ "$_arg_dry_run" == "on" ]]; then
    build_harness_cmd "$prompt_file"
    log "[DRY-RUN] Would execute: ${HARNESS_CMD[*]}" 0
    log "[DRY-RUN] Prompt saved to: $prompt_file" 1
    # Don't remove prompt file in dry run for inspection
    return 0
  fi
  
  # Run the harness - capture exit code but DON'T fail
  # The harness IS the orchestrator - it handles implementer → validator → fixer loops
  # We don't interfere with that process
  local harness_exit_code=0
  run_harness_with_file "$prompt_file" "$log_file" || harness_exit_code=$?
  
  rm -f "$prompt_file"
  
  if [[ $harness_exit_code -eq 0 ]]; then
    log "Chunk ${chunk_num} completed successfully" 1
  else
    log "Chunk ${chunk_num} harness exited with code ${harness_exit_code}" -1
    log "Check log for details: ${log_file}" -1
  fi
  
  # Always return success - harness handles its own validation internally
  return 0
}

# ============================================================================
# PREREQUISITES CHECK
# ============================================================================

# Get the binary name for a harness
get_harness_bin() {
  case "$_arg_harness" in
    opencode) echo "opencode" ;;
    claude) echo "claude" ;;
    gemini) echo "gemini" ;;
    codex) echo "codex" ;;
    kilo) echo "kilo" ;;
  esac
}

verify_prerequisites() {
  log "Verifying prerequisites..." 0
  
  # Check harness is available
  local harness_bin
  harness_bin=$(get_harness_bin)
  
  if ! command -v "$harness_bin" &> /dev/null; then
    die "${_arg_harness} harness not found: $harness_bin not in PATH" 1
  fi
  
  # Check plan files exist
  for plan_file in "${CHUNK_ORDER[@]}"; do
    if [[ ! -f "$PLANS_DIR/$plan_file" ]]; then
      die "Plan file not found: $PLANS_DIR/$plan_file" 1
    fi
  done
  
  # Check PRD files exist
  for prd_file in "${CHUNKS[@]}"; do
    if [[ ! -f "$PRD_DIR/$prd_file" ]]; then
      die "PRD file not found: $PRD_DIR/$prd_file" 1
    fi
  done
  
  # Check vision document exists
  if [[ ! -f "$VISION_DOC" ]]; then
    die "Vision document not found: $VISION_DOC" 1
  fi
  
  log "All prerequisites verified" 1
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
  local start_chunk="${_arg_start_chunk}"
  local end_chunk="${_arg_end_chunk}"
  
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║       Arcade Vibe - Multi-Harness Orchestration v2.0        ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  printf "║  Harness: %-50s ║\n" "${_arg_harness}${_arg_model:+ ($_arg_model)}"
  printf "║  Chunks: %-51s ║\n" "${start_chunk} to ${end_chunk} of ${#CHUNK_ORDER[@]}"
  printf "║  Project: %-50s ║\n" "${PROJECT_ROOT}"
  if [[ "$_arg_dry_run" == "on" ]]; then
  echo "║  Mode: DRY RUN                                               ║"
  fi
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  
  verify_prerequisites
  
  for ((i = start_chunk; i <= end_chunk; i++)); do
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "                      CHUNK ${i} OF ${#CHUNK_ORDER[@]}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Run the chunk - harness handles all validation internally via subagent-orchestration
    run_chunk "$i"
    
    # Commit and push after chunk completes
    local plan_file="${CHUNK_ORDER[$((i - 1))]}"
    commit_changes "$i" "$plan_file"
    push_to_origin
    
    log "Chunk ${i} complete, committed, and pushed" 1
  done
  
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║                    ALL CHUNKS COMPLETE                       ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  
  log "Arcade Vibe implementation complete!" 1
}

# Run main
main
