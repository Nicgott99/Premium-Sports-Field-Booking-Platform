/**
 * Development startup script.
 * Launches an in-memory MongoDB instance (no local MongoDB install needed),
 * then starts the main Express server. dotenv.config() will not overwrite
 * MONGODB_URI because process.env is set before server.js is imported.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri();

// Set BEFORE server.js / dotenv runs so dotenv won't overwrite (dotenv
// skips keys that already exist in process.env when override is not set).
process.env.MONGODB_URI = uri;
process.env.REDIS_URL = 'disabled'; // skip Redis in dev (no Redis server required)
console.log(`[dev] In-memory MongoDB: ${uri}`);

await import('./server.js');

const stop = async () => {
  await mongod.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
