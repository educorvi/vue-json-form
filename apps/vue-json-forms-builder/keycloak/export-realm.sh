#!/usr/bin/env bash
set -euo pipefail

# Export a Keycloak realm from a running Docker Compose Keycloak instance.
#
# Usage:
#   ./export-realm.sh keycloak
#   ./export-realm.sh external-keycloak
#
# The docker-compose.yml is expected to be in the parent directory.
#
# Output:
#   keycloak           -> ../dev/config/keycloak/export/
#   external-keycloak  -> ../external/config/keycloak/export/

cd "$(dirname "$0")"

SERVICE="${1:-}"

case "$SERVICE" in
    keycloak)
        TARGET_DIR="./dev"
        ;;
    external-keycloak)
        TARGET_DIR="./external"
        ;;
    *)
        echo "Usage: $0 {keycloak|external-keycloak}" >&2
        exit 1
        ;;
esac

COMPOSE_FILE="../docker-compose.yaml"
REALMS=(dev)
WORK="data/keycloak-export-tmp"

if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo "Error: docker-compose.yaml not found at $COMPOSE_FILE" >&2
    exit 1
fi

# Resolve the actual container belonging to the Compose service.
CONTAINER=$(
    docker compose -f "$COMPOSE_FILE" ps -q "$SERVICE" | head -n 1
)

if [[ -z "$CONTAINER" ]]; then
    echo "Error: service '$SERVICE' is not running." >&2
    exit 1
fi

IMAGE=$(docker inspect --format '{{.Config.Image}}' "$CONTAINER")

rm -rf "$WORK"
mkdir -p "$WORK/out"
trap 'rm -rf "$WORK"' EXIT

echo "Exporting Keycloak service: $SERVICE"
echo "Container: $CONTAINER"
echo "Image:     $IMAGE"
echo "Target:    $TARGET_DIR"

# Keycloak cannot export while the running instance has the H2 database open.
# Copy the H2 database and perform the export in a temporary container.
docker cp "$CONTAINER":/opt/keycloak/data/h2 "$WORK/h2"

docker run --rm \
    -v "$(pwd)/$WORK/out:/export" \
    -v "$(pwd)/$WORK/h2:/opt/keycloak/data/h2" \
    "$IMAGE" \
    export --dir /export --users realm_file

# Make sure the target directory exists.
mkdir -p "$TARGET_DIR"

# Only take over the realms we track.
for realm in "${REALMS[@]}"; do
    SOURCE="$WORK/out/${realm}-realm.json"
    TARGET="$TARGET_DIR/${realm}-realm.json"

    if [[ ! -f "$SOURCE" ]]; then
        echo "Error: expected export not found: $SOURCE" >&2
        exit 1
    fi

    cp "$SOURCE" "$TARGET"
    echo "Exported: $TARGET"
done

echo
echo "Export completed successfully."
echo "Service: $SERVICE"
echo "Realm(s): ${REALMS[*]}"
echo "Target: $TARGET_DIR/"
echo "Review with 'git diff' and commit to share."
