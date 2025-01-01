import * as os from 'os';
import { createWorker } from 'mediasoup';
import {
    AudioLevelObserver,
    Consumer,
    ConsumerStat,
    Producer,
    ProducerStat,
    Router,
    RtpEncodingParameters,
    WebRtcTransport,
    Worker,
    WorkerLogLevel,
    WorkerLogTag,
    RtpCodecCapability,
    MediaKind
} from 'mediasoup/node/lib/types';
import { config } from './config';
import { logger } from "../../../../logger";

// Array to hold mediasoup workers
const mediasoupWorkers: Worker[] = [];
const numWorkers = os.cpus().length;

// Index for round-robin worker selection
let workerIdx = 0;

// Helper to round-robin through workers
const getNextWorker = (): Worker => {
    const worker = mediasoupWorkers[workerIdx];
    workerIdx = (workerIdx + 1) % numWorkers;
    return worker;
};

/**
 * Launch mediasoup Workers based on the configuration.
 */
export async function runMediasoupWorkers(): Promise<void> {
    for (let i = 0; i < numWorkers; ++i) {
        const worker = await createWorker({
            logLevel: config.mediasoup.worker.logLevel as WorkerLogLevel,
            logTags: config.mediasoup.worker.logTags as WorkerLogTag[],
            rtcMinPort: config.mediasoup.worker.rtcMinPort,
            rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
        });

        // Handle worker crashes
        worker.on('died', () => {
            logger.error({ workerId: worker.pid }, 'Mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
            setTimeout(() => process.exit(1), 2000);
        });

        mediasoupWorkers.push(worker);
    }
}

// Store rooms by roomId
export const rooms = new Map<string, RoomState>();

// Peer media information
interface PeerMedia {
    paused: boolean;
    encodings: RtpEncodingParameters[];
}

// Peer consumer layer information
interface PeerConsumerLayer {
    currentLayer?: number;
    clientSelectedLayer?: number;
}

// Peer data structure
interface Peer {
    id: string;
    name: string;
    joinTs: number;
    lastSeenTs: number;
    media: Record<string, PeerMedia>;
    consumerLayers: Record<string, PeerConsumerLayer>;
    stats: Record<string, ProducerStat[] | ConsumerStat[]>;
}

// Room state definition
export interface RoomState {
    // External
    id: string;
    peers: Record<string, Peer>;
    activeSpeaker: { producerId: string | null; volume: number | null; peerId: string | null };
    // Internal
    transports: Record<string, WebRtcTransport>;
    producers: Producer[];
    consumers: Consumer[];
    worker: Worker;
    router: Router;
    audioLevelObserver: AudioLevelObserver;
}

/**
 * Create a room or return the existing one.
 */
export const createRoom = async (roomId: string): Promise<RoomState> => {
    // Check if the room already exists
    const existingRoom = rooms.get(roomId);
    if (existingRoom) {
        return existingRoom;
    }

    logger.info({ roomId }, 'Creating room: ' + roomId);

    // Map codecs to correct types
    const mediaCodecs: RtpCodecCapability[] = config.mediasoup.router.mediaCodecs.map(codec => ({
        ...codec,
        kind: codec.kind as MediaKind
    }));

    // Get the next worker in the round-robin
    const worker = getNextWorker();
    const router = await worker.createRouter({ mediaCodecs });

    // Create AudioLevelObserver to detect active speakers
    const audioLevelObserver = await router.createAudioLevelObserver({
        interval: 800,
    });

    // Handling audio level events
    audioLevelObserver.on('volumes', (volumes) => {
        const { producer, volume } = volumes[0];
        logger.info({ peerId: producer.appData.peerId, volume }, 'Audio level volumes event');
        const room = rooms.get(roomId);
        if (!room) return;
        room.activeSpeaker.producerId = producer.id;
        room.activeSpeaker.volume = volume;
        room.activeSpeaker.peerId = producer.appData.peerId as string;
    });

    // Handling silence event (no active speaker)
    audioLevelObserver.on('silence', () => {
        logger.info('Audio level silence event');
        const room = rooms.get(roomId);
        if (!room) return;
        room.activeSpeaker.producerId = null;
        room.activeSpeaker.volume = null;
        room.activeSpeaker.peerId = null;
    });

    // Initialize the new room
    const room: RoomState = {
        id: roomId,
        peers: {},
        activeSpeaker: {
            producerId: null,
            volume: null,
            peerId: null,
        },
        transports: {},
        producers: [],
        consumers: [],
        worker,
        router,
        audioLevelObserver,
    };

    // Store the room
    rooms.set(roomId, room);
    return room;
};
