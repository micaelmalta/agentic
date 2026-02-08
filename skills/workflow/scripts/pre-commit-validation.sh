#!/bin/bash
#
# Pre-commit Validation Hook for Workflow Enforcement
#
# This hook ensures that Phase 5 validation (code review + security review)
# has been completed before allowing commits.
#
# Installation:
#   cp skills/workflow/scripts/pre-commit-validation.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# To bypass (USE ONLY FOR EMERGENCIES):
#   git commit --no-verify
#

set -e

# Ensure we run from the repository root
cd "$(git rev-parse --show-toplevel)"

echo ""
echo "========================================"
echo "Workflow Phase 5 Validation Gate"
echo "========================================"
echo ""

# Allow bypass when workflow has already completed Phase 5 validation
# (set by autonomous workflow agents after code review + security review)
if [ "$WORKFLOW_VALIDATED" = "1" ]; then
    echo "✓ WORKFLOW_VALIDATED=1 - Phase 5 validation completed by workflow agent"
    echo ""
    exit 0
fi

# Check if this is an AI-assisted workflow commit
# (Detects if context/plans/ or context/summaries/ exist with recent activity)
if [ -d "context/plans" ] || [ -d "context/summaries" ]; then
    echo "✓ PARA workflow detected - enforcing validation gate"
    echo ""
    
    # Run the validation script
    if command -v python3 &> /dev/null; then
        if [ -f "skills/workflow/scripts/validate_phase.py" ]; then
            echo "Running Phase 5 validation check..."
            echo ""
            
            # Check if running in a non-interactive environment (CI, script)
            # Use --non-interactive flag if a specific env var is set, or let it fail safely
            NON_INTERACTIVE_FLAG=""
            if [ -n "$CI" ] || [ ! -t 0 ]; then
                NON_INTERACTIVE_FLAG="--non-interactive"
                echo "⚠️  Non-interactive environment detected"
            fi
            
            if python3 skills/workflow/scripts/validate_phase.py --phase 5 ${NON_INTERACTIVE_FLAG:+"$NON_INTERACTIVE_FLAG"}; then
                echo ""
                echo "✅ Phase 5 validation complete - commit allowed"
                echo ""
                exit 0
            else
                echo ""
                echo "⛔ Phase 5 validation FAILED"
                echo ""
                echo "Required actions before commit:"
                echo "  1. Launch code-reviewer subagent"
                echo "  2. Launch security-reviewer subagent"
                echo "  3. Address all findings"
                echo "  4. Re-run validation"
                echo ""
                echo "To bypass (NOT RECOMMENDED):"
                echo "  git commit --no-verify"
                echo ""
                exit 1
            fi
        else
            echo "⚠️  Validation script not found at skills/workflow/scripts/validate_phase.py"
            echo "   Validation gate cannot be enforced without the script."
            echo "   Proceeding with warning - ensure Phase 5 was completed manually."
            echo ""
        fi
    else
        echo "⚠️  Python3 not found - cannot run validation"
        echo "   Install Python3 or manually verify Phase 5 completion"
        echo ""
    fi
fi

echo "✓ Validation gate check complete"
echo ""
exit 0
