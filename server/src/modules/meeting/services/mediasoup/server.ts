import express from 'express';
import { Consumer, MediaKind, Producer, RtpCapabilities, WebRtcTransport } from 'mediasoup/node/lib/types';
import { io } from '../../../../shared/infra/http/app';
import { meetingRepo } from '../../repos';
import { config } from './config';
import { createRoom, rooms, RoomState, runMediasoupWorkers } from './rooms';
import { logger } from "../../../../logger"

export const signalingRouter = express.Router();

// For each peer that connects, we keep a table of peers and what
// tracks are being sent and received. we also need to know the last
// time we saw the peer, so that we can disconnect clients that have
// network issues.
//
// for this simple demo, each client polls the server at 1hz, and we
// just send this roomState.peers data structure as our answer to each
// poll request.
//
// [peerId] : {
//   joinTs: <ms timestamp>
//   lastSeenTs: <ms timestamp>
//   media: {
//     [mediaTag] : {
//       paused: <bool>
//       encodings: []
//     }
//   },
//   stats: {
//     producers: {
//       [producerId]: {
//         ...(selected producer stats)
//       }
//     consumers: {
//       [consumerId]: { ...(selected consumer stats) }
//     }
//   }
//   consumerLayers: {
//     [consumerId]:
//         currentLayer,
//         clientSelectedLayer,
//       }
//     }
//   }
// }
//
// we also send information about the active speaker, as tracked by
// our audioLevelObserver.
//
// internally, we keep lists of transports, producers, and
// consumers. whenever we create a transport, producer, or consumer,
// we save the remote peerId in the object's `appData`. for producers
// and consumers we also keep track of the client-side "media tag", to
// correlate tracks.
//

//
// our http server needs to send 'index.html' and 'client-bundle.js'.
// might as well just send everything in this directory ...
//

//
// main() -- our execution entry point
//

async function main() {
    // start mediasoup
    logger.info('starting mediasoup');
    try {
        await runMediasoupWorkers();
    } catch (error) {
        logger.error({ error: error }, 'unable to start mediasoup workers ...');
        logger.info('unable to start mediasoup workers ... [exiting]');
        // process.exit(1);
    }
}

main();

signalingRouter.use('/', async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    if (req.body.roomId) {
        let room = rooms.get(req.body.roomId);
        if (!room) {
            const meetingFound = await meetingRepo.getMeetingByMeetingId(req.body.roomId);
            if (meetingFound == null) {
                res.status(404).send('Meeting not found');
                return;
            }
            room = await createRoom(req.body.roomId);
        }
        req.body.room = room;
        next();
        return;
    } else {
        res.status(400).json({
            message: 'roomId is required',
        });
        return;
    }
});

// --> /sync
//
// client polling endpoint. send back our 'peers' data structure and
// 'activeSpeaker' info
//
signalingRouter.post('/sync', async (req, res) => {
    const { peerId, room } = req.body as { peerId: string; room: RoomState };
    try {
        // make sure this peer is connected. if we've disconnected the
        // peer because of a network outage we want the peer to know that
        // happened, when/if it returns
        if (!room.peers[peerId]) {
            throw new Error('not connected');
        }

        // update our most-recently-seem timestamp -- we're not stale!
        room.peers[peerId].lastSeenTs = Date.now();

        res.send({
            peers: room.peers,
            activeSpeaker: room.activeSpeaker,
        });
    } catch (e) {
        if (e instanceof Error) {
            res.send({ error: e instanceof Error ? e.message : 'Unknown error' });
        } else {
            logger.error('Unknown error');
        }
        res.send({ error: e instanceof Error ? e.message : 'Unknown error' });
    }
});

// --> /join-as-new-peer
//
// adds the peer to the roomState data structure and creates a
// transport that the peer will use for receiving media. returns
// router rtpCapabilities for mediasoup-client device initialization
//
signalingRouter.post('/join-as-new-peer', async (req, res) => {
    try {
        const { peerId, room, name } = req.body as { peerId: string; name: string; room: RoomState };
        const now = Date.now();
        logger.info({ peerId: peerId }, 'join-as-new-peer', peerId);

        const sendTransport = await createWebRtcTransport({
            peerId,
            direction: 'send',
            room,
        });
        room.transports[sendTransport.id] = sendTransport;

        const sendTransportOptions = {
            id: sendTransport.id,
            iceParameters: sendTransport.iceParameters,
            iceCandidates: sendTransport.iceCandidates,
            dtlsParameters: sendTransport.dtlsParameters,
        };
        const recvTransport = await createWebRtcTransport({
            peerId,
            direction: 'recv',
            room,
        });
        room.transports[recvTransport.id] = recvTransport;

        const recvTransportOptions = {
            id: recvTransport.id,
            iceParameters: recvTransport.iceParameters,
            iceCandidates: recvTransport.iceCandidates,
            dtlsParameters: recvTransport.dtlsParameters,
        };

        room.peers[peerId] = {
            id: peerId,
            name,
            joinTs: now,
            lastSeenTs: now,
            media: {},
            consumerLayers: {},
            stats: {},
        };

        io.to(room.id).emit('newPeer', {
            peerId,
            name,
        });

        res.send({
            routerRtpCapabilities: room.router!.rtpCapabilities,
            sendTransportOptions,
            recvTransportOptions,
        });
    } catch (e) {
        logger.error({ error: e }, 'error in /join-as-new-peer');
        res.send({ error: e });
    }
});

// --> /init-consumers
//
// inits the consumers for a new peer
//
signalingRouter.post('/init-consumers', async (req, res) => {
    try {
        const { peerId, room } = req.body as { peerId: string; room: RoomState };
        logger.info({ peerId: peerId }, 'init-consumers');

        for (const producer of room.producers) {
            if (producer.appData.peerId === peerId) {
                await createConsumer({
                    producer,
                    mediaPeerId: producer.appData.peerId,
                    mediaTag: producer.appData.mediaTag as string,
                    peerId,
                    room,
                    rtpCapabilities: room.router!.rtpCapabilities,
                });
            }
        }

        res.send({});
    } catch (e) {
        logger.error({ error: e }, 'error in /init-consumers');
        res.send({ error: e instanceof Error ? e.message : 'Unknown error' });
    }
});

// --> /leave
//
// removes the peer from the roomState data structure and and closes
// all associated mediasoup objects
//
signalingRouter.post('/leave', async (req, res) => {
    try {
        const { peerId, room } = req.body as { peerId: string; room: RoomState };
        logger.info({ peerId: peerId }, 'leave');

        closePeer(peerId, room);
        res.send({ left: true });
    } catch (e) {
        logger.error({ error: e }, 'error in /leave');
        res.send({ error: e });
    }
});

// Close Peer and related transports, producers, and consumers
export async function closePeer(peerId: string, room: RoomState) {
    logger.info({ peerId: peerId }, 'closing peer %s', peerId);

    // Close all transports associated with this peer
    for (const [id, transport] of Object.entries(room.transports)) {
        if (transport.appData.peerId === peerId) {
            await closeTransport(transport, room);
        }
    }

    // Remove peer from room
    delete room.peers[peerId];

    io.to(room.id).emit('peerClosed', { peerId });

    // Clean up room if no peers are left
    if (Object.values(room.peers).length === 0) {
        logger.info('removing room as all peers have left');
        room.router.close();
        room.audioLevelObserver.close();
        rooms.delete(room.id);
    }
}

// Close Transport for a peer
async function closeTransport(transport: WebRtcTransport, room: RoomState) {
    try {
        logger.info({ transportId: transport.id, transportAppData: transport.appData }, 'closing transport', transport.id, transport.appData);

        // Close transport and remove it from room
        transport.close();
        delete room.transports[transport.id];
    } catch (e) {
        logger.error({ error: e }, "error closing transport");
    }
}

// Close Producer for a peer
async function closeProducer(producer: Producer, room: RoomState) {
    logger.info({ producerId: producer.id, producerAppData: producer.appData }, 'closing producer', producer.id, producer.appData);
    try {
        producer.close();

        // Remove producer from room
        room.producers = room.producers.filter((p) => p.id !== producer.id);

        // Remove media tag info from room state
        if (room.peers[producer.appData.peerId as string]) {
            delete room.peers[producer.appData.peerId as string].media[producer.appData.mediaTag as string];
        }
    } catch (e) {
        logger.error({ error: e }, "error closing producer");
    }
}

// Close Consumer for a peer
async function closeConsumer(consumer: Consumer, room: RoomState) {
    logger.info({ consumerId: consumer.id, consumerAppData: consumer.appData }, 'closing consumer', consumer.id, consumer.appData);
    consumer.close();

    // Remove consumer from room
    room.consumers = room.consumers.filter((c) => c.id !== consumer.id);

    // Remove consumer layer info
    if (room.peers[consumer.appData.peerId as string]) {
        delete room.peers[consumer.appData.peerId as string].consumerLayers[consumer.id];
    }
}

// Create Transport (WebRTC transport)
signalingRouter.post('/create-transport', async (req, res) => {
    try {
        const { peerId, direction, room } = req.body as { peerId: string; direction: string; room: RoomState };
        logger.info({ peerId: peerId, direction: direction }, 'create-transport', peerId, direction);

        const transport = await createWebRtcTransport({ peerId, direction, room });
        room.transports[transport.id] = transport;

        const { id, iceParameters, iceCandidates, dtlsParameters } = transport;
        res.send({
            transportOptions: { id, iceParameters, iceCandidates, dtlsParameters },
        });
    } catch (e) {
        logger.error({ error: e }, 'error in /create-transport', e);
        res.send({ error: e });
    }
});

// Function to create WebRTC transport
async function createWebRtcTransport({ peerId, direction, room }: { peerId: string; direction: string; room: RoomState }): Promise<WebRtcTransport> {
    const { listenIps, initialAvailableOutgoingBitrate } = config.mediasoup.webRtcTransport;

    const transport = await room.router.createWebRtcTransport({
        listenIps: listenIps,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: initialAvailableOutgoingBitrate,
        appData: { peerId, clientDirection: direction },
    });

    return transport;
}

// Connect Transport for a peer
signalingRouter.post('/connect-transport', async (req, res) => {
    try {
        const { peerId, transportId, dtlsParameters, room } = req.body;
        const transport = room.transports[transportId];

        if (!transport) {
            logger.error(`connect-transport: server-side transport ${transportId} not found`);
            res.send({ error: `server-side transport ${transportId} not found` });
            return;
        }

        logger.info({ peerId: peerId, transportAppData: transport.appData }, 'connect-transport', peerId, transport.appData);

        await transport.connect({ dtlsParameters });
        res.send({ connected: true });
    } catch (e) {
        logger.error({ error: e }, 'error in /connect-transport', e);
        res.send({ error: e });
    }
});

// Close Transport (client stops sending media)
signalingRouter.post('/close-transport', async (req, res) => {
    try {
        const { peerId, transportId, room } = req.body;
        const transport = room.transports[transportId];

        if (!transport) {
            logger.error(`close-transport: server-side transport ${transportId} not found`);
            res.send({ error: `server-side transport ${transportId} not found` });
            return;
        }

        logger.info({ peerId: peerId, transportAppData: transport.appData }, 'close-transport', peerId, transport.appData);

        await closeTransport(transport, room);
        res.send({ closed: true });
    } catch (e) {
        logger.error({ error: e }, 'error in /close-transport', e);
        res.send({ error: e instanceof Error ? e.message : 'Unknown error' });
    }
});

// Close Producer (client stops sending a track)
signalingRouter.post('/close-producer', async (req, res) => {
    try {
        const { peerId, producerId, room } = req.body as { peerId: string; producerId: string; room: RoomState };
        const producer = room.producers.find((p) => p.id === producerId);

        if (!producer) {
            logger.error(`close-producer: server-side producer ${producerId} not found`);
            res.send({ error: `server-side producer ${producerId} not found` });
            return;
        }

        logger.info({ peerId: peerId, producerAppData: producer.appData }, 'close-producer', peerId, producer.appData);

        await closeProducer(producer, room);
        res.send({ closed: true });
    } catch (e) {
        logger.error({ error: e }, "error in /close-producer");
        res.send({ error: e instanceof Error ? e.message : 'Unknown error' });
    }
});

// Send Track (client sends a media track)
signalingRouter.post('/send-track', async (req, res) => {
    try {
        const {
            peerId,
            transportId,
            kind,
            rtpParameters,
            paused = false,
            appData,
            room,
        } = req.body as {
            peerId: string;
            transportId: string;
            kind: MediaKind;
            rtpParameters: any;
            paused: boolean;
            appData: any;
            room: RoomState;
        };

        const transport = room.transports[transportId];

        if (!transport) {
            logger.error(`send-track: server-side transport ${transportId} not found`);
            res.send({ error: `server-side transport ${transportId} not found` });
            return;
        }

        const producer = await transport.produce({
            kind,
            rtpParameters,
            paused,
            appData: { ...appData, peerId, transportId },
        });

        // Monitor producer and handle transport closure
        producer.on('transportclose', () => {
            logger.info({ producerId: producer.id }, "producer's transport closed", producer.id);
            const r = rooms.get(room.id);
            if (r) {
                closeProducer(producer, r);
            }
        });

        // Monitor audio level
        if (producer.kind === 'audio') {
            room.audioLevelObserver?.addProducer({ producerId: producer.id });
        }

        room.producers.push(producer);
        room.peers[peerId].media[appData.mediaTag] = { paused, encodings: rtpParameters.encodings };

        res.send({ id: producer.id });

        // Create consumers for all other peers
        for (const peer of Object.values(room.peers)) {
            if (peer.id === peerId) continue;
            await createConsumer({
                producer,
                mediaPeerId: peerId,
                peerId: peer.id,
                mediaTag: producer.appData.mediaTag,
                room,
                rtpCapabilities: room.router.rtpCapabilities,
            });
        }
    } catch (e) {
        logger.error({ error: e }, "error in /send-track");
        res.send({ error: e instanceof Error ? e.message : 'Unknown error' });
    }
});

interface ConsumerProps {
    producer: Producer;
    rtpCapabilities: RtpCapabilities;
    mediaPeerId: string;
    mediaTag: string;
    peerId: string;
    room: RoomState;
}

// Always start consumers paused. client will request media to resume when the connection completes
const createConsumer = async ({ producer, rtpCapabilities, room, mediaTag, mediaPeerId, peerId }: ConsumerProps) => {
    if (
        !room.router.canConsume({
            producerId: producer.id,
            rtpCapabilities,
        })
    ) {
        const msg = `client cannot consume ${mediaPeerId}:${mediaTag}`;
        logger.error({ peerId: peerId }, `recv-track: ${peerId} ${msg}`);
        return;
    }

    const transport = Object.values(room.transports).find(
        (t) => t.appData.peerId === peerId && t.appData.clientDirection === 'recv',
    );

    if (!transport) {
        const msg = `server-side recv transport for ${peerId} not found`;
        logger.error('recv-track: ' + msg);
        return;
    }

    const consumer = await transport.consume({
        producerId: producer.id,
        rtpCapabilities,
        paused: true, // see note above about always starting paused
        appData: { peerId, mediaPeerId, mediaTag },
    });

    // need both 'transportclose' and 'producerclose' event handlers,
    // to make sure we close and clean up consumers in all
    // circumstances
    consumer.on('transportclose', () => {
        logger.info({ consumerId: consumer.id }, `consumer's transport closed`, consumer.id);
        closeConsumer(consumer, room);
    });
    consumer.on('producerclose', () => {
        logger.info({ consumerId: consumer.id }, `consumer's producer closed`, consumer.id);
        closeConsumer(consumer, room);
        io.to(room.id).emit('consumerClosed', { consumerId: consumer.id });
    });
    consumer.on('producerpause', () => {
        io.to(room.id).emit('consumerPaused', { consumerId: consumer.id });
    });
    consumer.on('producerresume', () => {
        io.to(room.id).emit('consumerResumed', { consumerId: consumer.id });
    });
    // update above data structure when layer changes.
    consumer.on('layerschange', (layers) => {
        logger.info({ mediaTag: mediaTag, layers: layers }, `consumer layerschange ${mediaPeerId}->${peerId}`, mediaTag, layers);
        if (room.peers[peerId] && room.peers[peerId].consumerLayers[consumer.id]) {
            room.peers[peerId].consumerLayers[consumer.id].currentLayer = layers && layers.spatialLayer;
        }
    });

    // stick this consumer in our list of consumers to keep track of,
    // and create a data structure to track the client-relevant state
    // of this consumer
    room.consumers.push(consumer);
    room.peers[peerId].consumerLayers[consumer.id] = {
        currentLayer: undefined,
        clientSelectedLayer: undefined,
    };

    io.to(peerId).emit('newConsumer', {
        peerId: mediaPeerId,
        producerId: producer.id,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        appData: producer.appData,
        producerPaused: consumer.producerPaused,
    });

    return {
        producerId: producer.id,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
    };
};

// // --> /recv-track
// //
// // create a mediasoup consumer object, hook it up to a producer here
// // on the server side, and send back info needed to create a consumer
// // object on the client side. always start consumers paused. client
// // will request media to resume when the connection completes
// //
// signalingRouter.post('/recv-track', async (req, res) => {
//     try {
//         const { peerId, mediaPeerId, mediaTag, rtpCapabilities, roomId } = req.body;

//         const producer = roomState.producers.find(
//             (p) => p.appData.mediaTag === mediaTag &&
//                 p.appData.peerId === mediaPeerId
//         );

//         if (!producer) {
//             let msg = 'server-side producer for ' +
//                 `${mediaPeerId}:${mediaTag} not found`;
//             console.error('recv-track: ' + msg);
//             res.send({ error: msg });
//             return;
//         }

//         const consumerRes = await createConsumer({
//             mediaPeerId,
//             mediaTag,
//             peerId,
//             producer,
//             roomId,
//             rtpCapabilities
//         });

//         res.send({
//             ...consumerRes
//         });
//     } catch (e) {
//         console.error('error in /recv-track', e);
//         res.send({ error: e });
//     }
// });

// --> /pause-consumer
//
// called to pause receiving a track for a specific client
//
signalingRouter.post('/pause-consumer', async (req, res) => {
    try {
        const { consumerId, room } = req.body as {
            consumerId: string;
            room: RoomState;
        };
        const consumer = room.consumers.find((c) => c.id === consumerId);

        if (!consumer) {
            logger.error({ consumerId: consumerId }, `pause-consumer: server-side consumer ${consumerId} not found`);
            res.send({ error: `server-side producer ${consumerId} not found` });
            return;
        }

        logger.info({ consumerAppData: consumer.appData }, 'pause-consumer', consumer.appData);

        await consumer.pause();

        res.send({ paused: true });
    } catch (e) {
        logger.error({ error: e }, 'error in /pause-consumer', e);
        res.send({ error: e });
    }
});

// --> /resume-consumer
//
// called to resume receiving a track for a specific client
//
signalingRouter.post('/resume-consumer', async (req, res) => {
    try {
        const { consumerId, room } = req.body as {
            consumerId: string;
            room: RoomState;
        };
        const consumer = room.consumers.find((c) => c.id === consumerId);

        if (!consumer) {
            logger.error({ consumerId: consumerId }, `pause-consumer: server-side consumer ${consumerId} not found`);
            res.send({ error: `server-side consumer ${consumerId} not found` });
            return;
        }

        logger.info({ consumerAppData: consumer.appData }, 'resume-consumer', consumer.appData);
        logger.info({ consumerPaused: consumer.paused }, 'resume-consumer-paused', consumer.paused);

        await consumer.resume();

        res.send({ resumed: true });
    } catch (e) {
        logger.error({ error: e }, 'error in /resume-consumer', e);
        res.send({ error: e });
    }
});

// --> /signalign/close-consumer
//
// called to stop receiving a track for a specific client. close and
// clean up consumer object
//
signalingRouter.post('/close-consumer', async (req, res) => {
    try {
        const { consumerId, room } = req.body as {
            consumerId: string;
            room: RoomState;
        };
        const consumer = room.consumers.find((c) => c.id === consumerId);

        if (!consumer) {
            logger.error({ consumerId: consumerId }, `close-consumer: server-side consumer ${consumerId} not found`);
            res.send({ error: `server-side consumer ${consumerId} not found` });
            return;
        }

        await closeConsumer(consumer, room);

        res.send({ closed: true });
    } catch (e) {
        logger.error({ error: e }, 'error in /close-consumer', e);
        res.send({ error: e });
    }
});

// --> /consumer-set-layers
//
// called to set the largest spatial layer that a specific client
// wants to receive
//
signalingRouter.post('/consumer-set-layers', async (req, res) => {
    try {
        const { consumerId, room, spatialLayer } = req.body as {
            consumerId: string;
            room: RoomState;
            spatialLayer: any;
        };
        const consumer = room.consumers.find((c) => c.id === consumerId);

        if (!consumer) {
            logger.error({ consumerId: consumerId }, `consumer-set-layers: server-side consumer ${consumerId} not found`);
            res.send({ error: `server-side consumer ${consumerId} not found` });
            return;
        }

        logger.info({ spatialLayer: spatialLayer, consumerAppData: consumer.appData }, 'consumer-set-layers', spatialLayer, consumer.appData);

        await consumer.setPreferredLayers({ spatialLayer });

        res.send({ layersSet: true });
    } catch (e) {
        logger.error({ error: e }, 'error in /consumer-set-layers', e);
        res.send({ error: e });
    }
});

// --> /pause-producer
//
// called to stop sending a track from a specific client
//
signalingRouter.post('/pause-producer', async (req, res) => {
    try {
        const { peerId, producerId, room } = req.body as {
            peerId: string;
            producerId: string;
            room: RoomState;
        };
        const producer = room.producers.find((p) => p.id === producerId);

        if (!producer) {
            logger.error({ producerId: producerId }, `pause-producer: server-side producer ${producerId} not found`);
            res.send({ error: `server-side producer ${producerId} not found` });
            return;
        }

        room.peers[peerId].media[producer.appData.mediaTag as string].paused = true;

        await producer.pause();

        room.peers[peerId].media[producer.appData.mediaTag as string].paused = true;

        res.send({ paused: true });
    } catch (e) {
        logger.error({ error: e }, 'error in /pause-producer', e);
        res.send({ error: e });
    }
});

// --> /resume-producer
//
// called to resume sending a track from a specific client
//
signalingRouter.post('/resume-producer', async (req, res) => {
    try {
        const { peerId, producerId, room } = req.body as {
            peerId: string;
            producerId: string;
            room: RoomState;
        };
        const producer = room.producers.find((p) => p.id === producerId);

        if (!producer) {
            logger.error({ producerId: producerId }, `resume-producer: server-side producer ${producerId} not found`);
            res.send({ error: `server-side producer ${producerId} not found` });
            return;
        }

        room.peers[peerId].media[producer.appData.mediaTag as string].paused = false;

        await producer.resume();

        room.peers[peerId].media[producer.appData.mediaTag as string].paused = false;

        res.send({ resumed: true });
    } catch (e) {
        logger.error({ error: e }, 'error in /resume-producer', e);
        res.send({ error: e });
    }
});
// async function createWebRtcTransport({
//     peerId,
//     direction,
//     room,
// }: {
//     peerId: string;
//     direction: string;
//     room: RoomState;
// }): Promise<WebRtcTransport> {
//     const { listenIps, initialAvailableOutgoingBitrate } = config.mediasoup.webRtcTransport;

//     const transport = await room.router.createWebRtcTransport({
//         listenIps: listenIps,
//         enableUdp: true,
//         enableTcp: true,
//         preferUdp: true,
//         initialAvailableOutgoingBitrate: initialAvailableOutgoingBitrate,
//         appData: { peerId, clientDirection: direction },
//     });

//     return transport;
// }

