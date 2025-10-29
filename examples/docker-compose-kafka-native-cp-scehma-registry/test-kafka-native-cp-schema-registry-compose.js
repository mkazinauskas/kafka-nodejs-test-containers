import testBroker from "../../helpers/test-broker.js";
import testSchemaRegistry from "../../helpers/test-schema-registry.js";

await testBroker(["localhost:29092"]);
await testSchemaRegistry("http://localhost:8081");
