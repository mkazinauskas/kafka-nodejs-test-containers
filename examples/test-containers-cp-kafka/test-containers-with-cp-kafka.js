import { KafkaContainer } from "@testcontainers/kafka";
import testBroker from "../../helpers/test-broker.js";

const kafkaContainer = await new KafkaContainer("confluentinc/cp-kafka:8.1.0")
  .withKraft()
  .withLogConsumer((stream) => {
    stream.on("data", (line) => console.log(line.toString()));
  })
  .start();

await testBroker([
  `${kafkaContainer.getHost()}:${kafkaContainer.getMappedPort(9093)}`,
]);
