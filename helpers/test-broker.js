import { Kafka, logLevel } from "kafkajs";

const GROUP_ID = "test-group";
const TOPIC_NAME = "test-topic";
const TEST_MESSAGE = "test message";

export default async function testBroker(brokers) {
  console.log("Testing Kafka Brokers:", brokers);

  const kafka = new Kafka({ logLevel: logLevel.NOTHING, brokers });

  const producer = kafka.producer();
  await producer.connect();

  const consumer = kafka.consumer({ groupId: GROUP_ID });
  await consumer.connect();

  await producer.send({ topic: TOPIC_NAME, messages: [{ value: TEST_MESSAGE }] });
  await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });

  const consumedMessage = await new Promise((resolve) =>
    consumer.run({
      eachMessage: async ({ message }) => resolve(message.value?.toString()),
    })
  );

  if (consumedMessage !== TEST_MESSAGE) {
    throw new Error("Consumed message is undefined");
  }

  await consumer.disconnect();
  await producer.disconnect();

  console.log("Successfully tested Kafka Brokers:", brokers);
}
