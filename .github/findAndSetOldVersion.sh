#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

NAME=$(jq -r .name package.json)

TAG=$(git tag --list "$NAME-v*.*.*" --sort=-v:refname | head -n 1)

VERSION=${TAG//$NAME-v/''}

echo "Setting $NAME to $VERSION"
"$SCRIPT_DIR/setOldVersion.sh" "$VERSION"


