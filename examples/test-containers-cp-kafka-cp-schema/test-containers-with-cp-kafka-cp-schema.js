import { KafkaContainer } from "@testcontainers/kafka";
import testBroker from "../../helpers/test-broker.js";
import { GenericContainer } from "testcontainers";
import { Network } from "testcontainers";
import testSchemaRegistry from "../../helpers/test-schema-registry.js";

const network = await new Network().start();

const kafkaContainer = await new KafkaContainer("confluentinc/cp-kafka:8.1.0")
  .withKraft()
  .withNetwork(network)
  .withNetworkAliases("broker")
  .withLogConsumer((stream) => {
    stream.on("data", (line) => console.log(line.toString()));
  })
  .withEnvironment({
    KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true",
  })
  .start();

const schemaRegistryContainer = await new GenericContainer(
  "confluentinc/cp-schema-registry:8.1.0",
)
  .withNetwork(network)
  .withNetworkAliases("schema-registry")
  .withLogConsumer((stream) => {
    stream.on("data", (line) => console.log(line.toString()));
  })
  .withExposedPorts(8081)
  .withEnvironment({
    SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS: "PLAINTEXT://broker:9092",
    SCHEMA_REGISTRY_HOST_NAME: "schema-registry",
    SCHEMA_REGISTRY_LISTENERS: "http://0.0.0.0:8081",
  })
  .start();

await testBroker([
  `${kafkaContainer.getHost()}:${kafkaContainer.getMappedPort(9093)}`,
]);

await testSchemaRegistry(
  `http://${schemaRegistryContainer.getHost()}:${schemaRegistryContainer.getMappedPort(
    8081,
  )}`,
);
