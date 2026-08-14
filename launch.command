#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
python3 scripts/launch_server.py --open
