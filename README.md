# Kafka Node.js Test Containers

Lightweight Node.js utilities for validating different Kafka distributions locally. The repository includes Docker Compose stacks and Testcontainers-based smoke tests for:

- Apache Kafka native images
- Confluent Platform Kafka with Confluent Schema Registry
- Apache Kafka native images paired with Karapace Schema Registry

Each scenario produces a simple broker round-trip using KafkaJS and can optionally register an Avro schema via Karapace or Confluent’s Schema Registry APIs.

## Prerequisites

- **Node.js** – The project targets Node 24 (see `.mise.toml`). `mise install` or your preferred version manager will align the toolchain.
- **pnpm** – Corepack manages the workspace (`package.json` declares `pnpm@9.6.0`).
- **Docker** – Required for both Docker Compose flows and Testcontainers.

Install the dependencies with:

```bash
pnpm install
```

## Repository Layout

- `helpers/test-broker.js` – KafkaJS helper that publishes and consumes a test message.
- `helpers/test-schema-registry.js` – Avro schema registration helper with readiness polling and cleanup.
- `examples/docker-compose-kafka-native/*` – Apache Kafka (KRaft) compose stack + smoke test.
- `examples/docker-compose-kafka-native-cp-scehma-registry/*` – Kafka + Confluent Schema Registry stack.
- `examples/docker-compose-cp-kafka-cp-schema-registry/*` – Confluent Platform Kafka + Schema Registry stack.
- `examples/test-containers-*/*` – Programmatic Testcontainers variants for Kafka-only and Kafka+Schema Registry.

## Docker Compose Scenarios

| Script | What it does | Notes |
| --- | --- | --- |
| `pnpm kafka-native-compose` | Spins up `examples/docker-compose-kafka-native/kafka-native-compose.yml`, runs the smoke test, and always tears the stack down. | Broker exposed on `localhost:9092`. |
| `pnpm kafka-native-schema-registry-compose` | Runs `examples/docker-compose-kafka-native-cp-scehma-registry/kafka-native-cp-schema-registry.yml` and validates broker + Confluent Schema Registry. | Broker on `localhost:29092`, Schema Registry on `localhost:8081`. |
| `docker compose --profile kafka -f examples/docker-compose-cp-kafka-cp-schema-registry/cp-kafka-cp-schema-registry-compose.yml up` | Confluent Platform Kafka + Schema Registry with built-in health checks. | Use `--profile kafka` or remove the profile keys. Pair with `node examples/docker-compose-cp-kafka-cp-schema-registry/test-cp-kafka-cp-schema-registry-compose.js`. |

> **Heads-up:** The compose commands only tear down the stack when the Node.js smoke test fails. After a successful run, clean up manually:
>
> ```bash
> docker compose -f <compose-file>.yml down
> ```

## Testcontainers Scenarios

When you prefer ephemeral containers managed directly from Node:

- `node examples/test-containers-cp-kafka/test-containers-with-cp-kafka.js`
- `node examples/test-containers-cp-kafka-cp-schema/test-containers-with-cp-kafka-cp-schema.js`

These scripts rely on `@testcontainers/kafka` and `testcontainers` (installed via `pnpm`). The native variant demonstrates the new `await using` disposal syntax, so keep Node 22+ (Node 24 via mise) to avoid syntax errors.

## Troubleshooting

- **Schema registry timeouts** – Ensure the registry container can resolve the broker host (`broker` inside the compose network). Use `docker compose … logs schema-registry` to verify Karapace or Confluent can reach Kafka.
- **Port conflicts** – All scenarios expose ports `9092`, `29092`, and `8081`. Stop other services or adjust the compose files before running.
- **Unterminated compose stacks** – Run `docker compose -f <file> down -v` to remove leftover containers and volumes.

## Continuous Integration

Pull requests and pushes to `main` trigger the `CI` GitHub Actions workflow (`.github/workflows/ci.yml`). The workflow:

- Provisions Node 24 with pnpm 9.6.0.
- Runs each pnpm script (`kafka-native-compose`, `kafka-native-schema-registry-compose`, `test-containers-with-cp-kafka`, `test-containers-with-cp-kafka-cp-schema`) in parallel matrix jobs.
- Executes every job inside Docker on Ubuntu runners, adjusting kernel limits for Kafka and disabling Testcontainers’ Ryuk/health checks for consistency.

## Next Steps

- Extend the helpers with additional assertions (e.g., compatibility settings, tombstone handling).
- Integrate the scripts into CI with `pnpm exec`.
- Add language bindings other than KafkaJS if you need multi-runtime coverage.

Happy testing!
