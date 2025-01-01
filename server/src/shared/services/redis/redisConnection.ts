import { createClient, RedisClientType } from 'redis';
import { authConfig, isProduction } from '../../../config';
import { logger } from "../../../logger";

const port = authConfig.redisServerPort;
const host = authConfig.redisServerHost;


console.log(authConfig);

const redisConnection: RedisClientType = isProduction
    ? createClient({ url: authConfig.redisConnectionString })
    : createClient({ socket: { host, port } });

redisConnection.on('connect', () => {
    logger.info(`[Redis]: Connected to Redis server at ${host}:${port}`);
});

redisConnection.on('error', (err) => {
    logger.error(`[Redis]: Error - ${err.message}`);
});

(async () => {
    try {
        await redisConnection.connect();
        // Perform your Redis operations here
    } catch (err) {
        if (err instanceof Error) {
            logger.error(`[Redis]: Connection failed - ${err.message}`);
        } else {
            logger.error('[Redis]: An unknown error occurred during connection');
        }
    }
})();

export { redisConnection };
