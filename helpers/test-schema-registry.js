const SUBJECT = "test-subject";
const SCHEMA = {
  type: "record",
  name: "TestRecord",
  fields: [{ name: "field", type: "string" }],
};
const MAX_ATTEMPTS = 60;
const RETRY_DELAY_MS = 1000;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForSchemaRegistry(baseUrl) {
  const healthUrl = `${baseUrl}/subjects`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(healthUrl, { method: "GET" });
      if (response.ok) {
        await response.json();
        console.log("Scehma Registry is running:", baseUrl);
        return;
      }

      const body = await response.text();
      throw new Error(
        `Schema Registry healthcheck failed: ${response.status} ${response.statusText} - ${body}`,
      );
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        throw new Error(
          `Schema Registry did not become ready after ${MAX_ATTEMPTS} attempts`,
          { cause: error },
        );
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Schema Registry request failed: ${response.status} ${response.statusText} - ${details}`,
    );
  }

  return response.json();
}

export default async function testSchemaRegistry(baseUrl) {
  console.log("Testing Schema Registry:", baseUrl);
  await waitForSchemaRegistry(baseUrl);

  const registerUrl = `${baseUrl}/subjects/${SUBJECT}/versions`;
  const registerPayload = { schema: JSON.stringify(SCHEMA) };

  const { id } = await fetchJson(registerUrl, {
    method: "POST",
    headers: {
      "content-type": "application/vnd.schemaregistry.v1+json",
    },
    body: JSON.stringify(registerPayload),
  });

  if (typeof id !== "number") {
    throw new Error("Schema registration did not return a valid id");
  }

  const latestUrl = `${baseUrl}/subjects/${SUBJECT}/versions/latest`;
  const latest = await fetchJson(latestUrl);
  const parsedSchema = JSON.parse(latest.schema);

  if (JSON.stringify(parsedSchema) !== JSON.stringify(SCHEMA)) {
    throw new Error(
      "Schema fetched from registry does not match the registered schema",
    );
  }

  const deleteUrl = `${baseUrl}/subjects/${SUBJECT}`;
  await fetchJson(deleteUrl, { method: "DELETE" });

  const deletePermanentUrl = `${deleteUrl}?permanent=true`;
  try {
    await fetchJson(deletePermanentUrl, { method: "DELETE" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("40405")) {
      // Ignore missing subject on permanent deletion; some registries return 404 once the subject is soft-deleted.
      console.warn(
        "Schema Registry permanent delete returned 404; assuming subject was already removed.",
      );
    } else {
      throw error;
    }
  }

  console.log("Successfully tested Schema Registry:", baseUrl);
}
