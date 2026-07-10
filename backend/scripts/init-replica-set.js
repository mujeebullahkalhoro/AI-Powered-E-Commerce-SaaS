let initialized = false;

try {
  const status = rs.status();
  if (status.ok === 1) {
    print(`Replica set already initialized: ${status.set}`);
    initialized = true;
  }
} catch (error) {
  // Not initialized yet.
}

if (!initialized) {
  const result = rs.initiate({
    _id: "rs0",
    members: [{ _id: 0, host: "127.0.0.1:27018" }],
  });

  printjson(result);
}
