#!/usr/bin/env python3
"""
Workflow Phase Validation Script

Validates that all mandatory phases have been completed before proceeding.
Use this script to enforce phase gates in the workflow.

Usage:
    python3 skills/workflow/scripts/validate_phase.py --phase 5
    python3 skills/workflow/scripts/validate_phase.py --phase 6
"""

import argparse
import sys
from pathlib import Path


class PhaseValidator:
    """Validates workflow phase completion."""

    PHASE_5_REQUIREMENTS = {
        "formatter": "Formatter execution and code formatted",
        "linter": "Linter execution and pass",
        "build": "Build execution and pass",
        "tests": "Test execution and pass",
        "code_review": "Code review subagent execution",
        "security_review": "Security review subagent execution",
    }

    PHASE_6_REQUIREMENTS = {
        "phase_5_complete": "Phase 5 fully complete",
        "all_reviews_addressed": "All review findings addressed",
    }

    def __init__(self, verbose=False):
        self.verbose = verbose
        self.errors = []
        self.warnings = []

    def log(self, message, level="INFO"):
        """Log message with level."""
        if self.verbose or level in ["ERROR", "WARNING"]:
            print(f"[{level}] {message}")

    def validate_phase_5(self, context_file=None, non_interactive=False):
        """
        Validate Phase 5 (Validation) completion.
        
        Args:
            context_file: Path to context file (unused currently)
            non_interactive: If True, skips interactive prompts and fails if not verifiable.
                             (Currently Phase 5 is manual, so non-interactive mode will fail 
                             unless we implement automatic verification)
        """
        self.log("Validating Phase 5 (Validation) completion...")

        if non_interactive:
             print("⚠️  Non-interactive mode: Cannot manually verify Phase 5 checklist.")
             print("   Assuming validation failed for safety in automated environments.")
             print("   To fix: Run this script interactively or implement automated checks.")
             return False

        # Interactive checklist
        print("\n" + "=" * 60)
        print("PHASE 5 VALIDATION CHECKLIST")
        print("=" * 60)
        print("\nVerify that ALL of the following were completed:\n")

        all_complete = True
        for key, description in self.PHASE_5_REQUIREMENTS.items():
            if non_interactive:
                # In non-interactive mode, we can't ask. 
                # Ideally we would check a state file here.
                # For now, we rely on the check at the start of the method.
                pass
            else:
                response = input(f"✓ {description}? (y/n): ").strip().lower()
                if response != "y":
                    self.errors.append(f"MISSING: {description}")
                    all_complete = False
                    print(f"  ❌ FAILED: {description}\n")
                else:
                    print(f"  ✅ PASSED: {description}\n")

        print("=" * 60)

        if not all_complete:
            print("\n⛔ PHASE 5 INCOMPLETE - Cannot proceed to Phase 6")
            print("\nMissing requirements:")
            for error in self.errors:
                print(f"  • {error}")
            print("\n🔄 Action Required:")
            print("  1. Complete all missing validations")
            print("  2. Launch code-reviewer and security-reviewer subagents")
            print("  3. Address all findings")
            print("  4. Re-run this validation")
            return False

        print("\n✅ PHASE 5 COMPLETE - Cleared to proceed to Phase 6")
        return True

    def validate_phase_6(self, non_interactive=False):
        """
        Validate Phase 6 (Commit & Push) readiness.

        Checks:
        - Phase 5 is complete
        - All review findings addressed

        Args:
            non_interactive: If True, forwards to Phase 5 validation in non-interactive mode.
        """
        self.log("Validating Phase 6 (Commit & Push) readiness...")

        # First, validate Phase 5
        if not self.validate_phase_5(non_interactive=non_interactive):
            self.errors.append("Phase 5 is not complete")
            return False

        print("\n" + "=" * 60)
        print("PHASE 6 GATE CHECK")
        print("=" * 60)

        response = (
            input(
                "\n✓ All findings from code review and security review addressed? (y/n): "
            )
            .strip()
            .lower()
        )

        if response != "y":
            print("\n⛔ CANNOT COMMIT - Review findings not addressed")
            print("\n🔄 Action Required:")
            print("  1. Address all code review feedback")
            print("  2. Fix all security vulnerabilities")
            print("  3. Re-run validations")
            print("  4. Re-run this gate check")
            return False

        print("\n✅ PHASE 6 CLEARED - Safe to commit and push")
        return True

    def print_summary(self):
        """Print validation summary."""
        print("\n" + "=" * 60)
        print("VALIDATION SUMMARY")
        print("=" * 60)

        if self.errors:
            print(f"\n❌ FAILED - {len(self.errors)} error(s):")
            for error in self.errors:
                print(f"  • {error}")

        if self.warnings:
            print(f"\n⚠️  {len(self.warnings)} warning(s):")
            for warning in self.warnings:
                print(f"  • {warning}")

        if not self.errors and not self.warnings:
            print("\n✅ All validations passed!")

        print("=" * 60)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Validate workflow phase completion before proceeding"
    )
    parser.add_argument(
        "--phase",
        type=int,
        required=True,
        choices=[5, 6],
        help="Phase number to validate (5=Validation, 6=Commit)",
    )
    parser.add_argument(
        "--context",
        type=str,
        help="Path to context.md file (optional)",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable verbose logging",
    )

    parser.add_argument(
        "--non-interactive",
        action="store_true",
        help="Run in non-interactive mode (fail if manual verification needed)",
    )

    args = parser.parse_args()

    validator = PhaseValidator(verbose=args.verbose)

    if args.phase == 5:
        success = validator.validate_phase_5(args.context, non_interactive=args.non_interactive)
    elif args.phase == 6:
        success = validator.validate_phase_6(non_interactive=args.non_interactive)
    else:
        print(f"Error: Invalid phase {args.phase}")
        sys.exit(1)

    validator.print_summary()

    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
