#!/bin/bash
# Wrapper script for running E2E tests without cleanup
# This is equivalent to: ./test-e2e-local.sh --no-cleanup

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$SCRIPT_DIR/test-e2e-local.sh" --no-cleanup "$@"
