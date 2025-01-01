import * as mediasoup from 'mediasoup';
import { isProduction } from '../../../../config';

export const config = {
    // HTTP server configuration
    httpIp: '0.0.0.0',
    httpPort: isProduction ? 443 : 5000,
    httpPeerStale: 15000,

    // SSL certificates
    sslCrt: 'local.crt',
    sslKey: 'local.key',

    // Mediasoup configuration
    mediasoup: {
        worker: {
            rtcMinPort: 40000,
            rtcMaxPort: 49999,
            logLevel: 'debug',
            logTags: [
                'info',
                'ice',
                'dtls',
                'rtp',
                'srtp',
                'rtcp',
            ],
        },
        router: {
            mediaCodecs: [
                {
                    kind: 'audio',
                    mimeType: 'audio/opus',
                    clockRate: 48000,
                    channels: 2,
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP8',
                    clockRate: 90000,
                    parameters: {},
                },
                {
                    kind: 'video',
                    mimeType: 'video/h264',
                    clockRate: 90000,
                    parameters: {
                        'packetization-mode': 1,
                        'profile-level-id': '4d0032',
                        'level-asymmetry-allowed': 1,
                    },
                },
                {
                    kind: 'video',
                    mimeType: 'video/h264',
                    clockRate: 90000,
                    parameters: {
                        'packetization-mode': 1,
                        'profile-level-id': '42e01f',
                        'level-asymmetry-allowed': 1,
                    },
                },
            ],
        },
        webRtcTransport: {
            listenIps: [
                {
                    ip: process.env.LISTEN_IP || '127.0.0.1', // Default fallback to localhost
                    announcedIp: process.env.ANNOUNCEMENT_IP || undefined, // Optional announced IP
                },
            ],
            initialAvailableOutgoingBitrate: 800000,
        },
    },
};
