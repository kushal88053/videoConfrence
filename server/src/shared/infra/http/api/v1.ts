import express, { Request, Response } from 'express'; // Explicitly import types
import { Socket } from 'socket.io';
import { docsRouter } from '../../../../docs/spec';
import { chatRouter } from '../../../../modules/chat/infra/http/routes';
import { accountRouter } from '../../../../modules/account/infra/http/routes';
import { meetingRouter, meetingSocketHandler } from '../../../../modules/meeting/infra/http/routes';
import { signalingRouter } from '../../../../modules/meeting/services/mediasoup';
import { userRouter } from '../../../../modules/user/infra/http/routes';
import { logger } from "../../../../logger";

// Create the router for API version 1
const v1Router = express.Router();

// Root endpoint for the API
v1Router.get("/", (req: Request, res: Response) => {
    logger.info('Received a request to the root endpoint');
    res.send("Welcome to the Node.js + TypeScript API!");
});

// Define routes for various modules
v1Router.use('/account', (req: Request, res: Response, next) => {
    logger.info('Account route accessed');
    next();
}, accountRouter);

v1Router.use('/meeting', (req: Request, res: Response, next) => {
    logger.info('Meeting route accessed');
    next();
}, meetingRouter);

v1Router.use('/chat', (req: Request, res: Response, next) => {
    logger.info('Chat route accessed');
    next();
}, chatRouter);

v1Router.use('/user', (req: Request, res: Response, next) => {
    logger.info('User route accessed');
    next();
}, userRouter);

v1Router.use('/signaling', (req: Request, res: Response, next) => {
    logger.info('Signaling route accessed');
    next();
}, signalingRouter);

v1Router.use('/docs', (req: Request, res: Response, next) => {
    logger.info('Docs route accessed');
    next();
}, docsRouter);

// WebSocket handler for managing connections and events
const v1SocketHandler = (socket: Socket) => {
    // Log the socket ID when a user connects
    logger.info({ socketId: socket.id }, 'User connected: ' + socket.id);

    // Call the meeting socket handler to manage meeting-specific socket events
    meetingSocketHandler(socket);

    // Listen for the 'disconnect' event and broadcast when a user disconnects
    socket.on('disconnect', () => {
        // Log the disconnection event
        logger.info({ socketId: socket.id }, 'User disconnected: ' + socket.id);

        // Emit to other clients that a user has disconnected
        logger.info({ socketId: socket.id }, 'Emitting user-disconnected event to other clients');
        socket.broadcast.emit('user-disconnected', socket.id);
    });

    // Log when a message is received from the client
    socket.on('message', (msg) => {
        logger.info({ socketId: socket.id, message: msg }, 'Received message from client');
    });

    // Log any other events that might be emitted by the client
    socket.on('custom-event', (data) => {
        logger.info({ socketId: socket.id, eventData: data }, 'Received custom event from client');
    });
};

// Export the API router and socket handler for use in other parts of the application
export { v1Router, v1SocketHandler };
