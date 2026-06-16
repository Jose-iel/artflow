set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker/docker-compose.prod.yaml}"
DB_SERVICE="${DB_SERVICE:-db}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-artflow_prod}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-database/migrations}"

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

psql_cmd() {
  compose exec -T "$DB_SERVICE" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" "$@"
}

echo "==> Aguardando o banco ficar disponivel..."
for i in $(seq 1 30); do
  if compose exec -T "$DB_SERVICE" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERRO: banco nao ficou disponivel a tempo." >&2
    exit 1
  fi
  sleep 2
done

echo "==> Garantindo tabela schema_migrations..."
psql_cmd -c "CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());"

shopt -s nullglob
migrations=("$MIGRATIONS_DIR"/[0-9]*.sql)
if [ "${#migrations[@]}" -gt 0 ]; then
  IFS=$'\n' migrations=($(sort <<<"${migrations[*]}")); unset IFS
fi

applied_any=0
for file in "${migrations[@]}"; do
  name="$(basename "$file")"
  already="$(psql_cmd -tA -c "SELECT 1 FROM schema_migrations WHERE filename = '${name}';" | tr -d '[:space:]')"
  if [ "$already" = "1" ]; then
    echo "==> [skip] ${name} (ja aplicada)"
    continue
  fi
  echo "==> [apply] ${name}"
  compose exec -T "$DB_SERVICE" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" --single-transaction < "$file"
  psql_cmd -c "INSERT INTO schema_migrations (filename) VALUES ('${name}') ON CONFLICT (filename) DO NOTHING;"
  applied_any=1
done

if [ "$applied_any" -eq 0 ]; then
  echo "==> Nenhuma migration nova para aplicar."
fi
echo "==> Migrations concluidas."
