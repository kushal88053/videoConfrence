import pino from 'pino';
import { elasticsearchURL } from './config';
import ecsFormat from '@elastic/ecs-pino-format';
import pinoElastic from 'pino-elasticsearch';
import { multistream } from 'pino-multi-stream';

// Initialize an array for log streams
const streams = [];

// Add the standard output stream using pino.destination
streams.push({ stream: pino.destination(1) }); // File descriptor 1 refers to stdout

if (elasticsearchURL) {
  try {
    // Validate Elasticsearch URL
    new URL(elasticsearchURL);

    // Set up Elasticsearch stream
    const streamToElastic = pinoElastic({
      index: 'nettu-meet',
      node: elasticsearchURL,
      'es-version': 7, // Adjust for your Elasticsearch version
      'flush-bytes': 1000,
    });

    // Add Elasticsearch stream to streams
    streams.push({ stream: streamToElastic });
  } catch (err: any) {
    if (err instanceof Error) {
      console.error(`Failed to configure Elasticsearch logging: ${err.message}`);
    } else {
      console.error('An unknown error occurred while configuring Elasticsearch logging.');
    }
  }
}

// Create a logger instance using multistream
const logger = pino(
  {
    level: 'info',
    ...ecsFormat(),
  },
  multistream(streams as any) // Use `as any` to bypass strict type checks
);

export { logger };
