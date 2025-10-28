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
- `kafka-native-compose.yml` – Single Apache Kafka (KRaft) broker.
- `kafka-native-cp-schema-registry.yml` – Kafka broker + Confluent Schema Registry.
- `kafka-native-aivenoy-karapace.yml` – Kafka broker + Karapace Schema Registry.
- `test-*.js` – ESM scripts that exercise the helpers against the corresponding environment.
- `test-containers-with-*.js` – Programmatic Testcontainers variants for native Kafka and Confluent images.

## Docker Compose Scenarios

| Script | What it does | Notes |
| --- | --- | --- |
| `pnpm kafka-native-compose` | Starts `kafka-native-compose.yml` then runs `test-kafka-native-compose.js`. | Broker exposed on `localhost:9092`. |
| `pnpm kafka-native-schema-registry-compose` | Starts `kafka-native-cp-schema-registry.yml` then runs `test-kafka-native-cp-schema-registry-compose.js`. | Broker on `localhost:29092`, Schema Registry on `localhost:8081`. |
| `pnpm kafka-native-karapace-compose` | Starts `kafka-native-aivenoy-karapace.yml` then runs `test-kafka-native-karapace.js`. | Same ports as above using Karapace. |

> **Heads-up:** The compose commands only tear down the stack when the Node.js smoke test fails. After a successful run, clean up manually:
>
> ```bash
> docker compose -f <compose-file>.yml down
> ```

### Manual Execution

For more control, run the steps yourself. Example for Karapace:

```bash
docker compose -f kafka-native-aivenoy-karapace.yml up -d
node test-kafka-native-karapace.js
docker compose -f kafka-native-aivenoy-karapace.yml down
```

Monitor service readiness with:

```bash
docker compose -f kafka-native-aivenoy-karapace.yml logs -f schema-registry
```

The schema registry helper retries for up to 60 seconds; if it still fails, inspect the container logs for bootstrap errors.

## Testcontainers Scenarios

When you prefer ephemeral containers managed directly from Node:

- `node test-containers-with-kafka-native.js`
- `node test-containers-with-cp-kafka.js`
- `node test-containers-with-cp-kafka-cp-schema.js`

These scripts rely on `@testcontainers/kafka` and `testcontainers` (installed via `pnpm`). The native variant demonstrates the new `await using` disposal syntax, so keep Node 22+ (Node 24 via mise) to avoid syntax errors.

## Troubleshooting

- **Schema registry timeouts** – Ensure the registry container can resolve the broker host (`broker` inside the compose network). Use `docker compose … logs schema-registry` to verify Karapace or Confluent can reach Kafka.
- **Port conflicts** – All scenarios expose ports `9092`, `29092`, and `8081`. Stop other services or adjust the compose files before running.
- **Unterminated compose stacks** – Run `docker compose -f <file> down -v` to remove leftover containers and volumes.

## Next Steps

- Extend the helpers with additional assertions (e.g., compatibility settings, tombstone handling).
- Integrate the scripts into CI with `pnpm exec`.
- Add language bindings other than KafkaJS if you need multi-runtime coverage.

Happy testing!
