import express from 'express';
import { Socket } from 'socket.io';
import { middleware } from '../../../../../shared/infra/http';
import { io } from '../../../../../shared/infra/http/app';
import { sendChatMessageController } from '../../../../chat/useCases/sendChatMessage';
import { onPeerJoinedMeeting } from '../../../services/mediasoup';
import { createCanvasController } from '../../../useCases/createCanvas';
import { createDemoMeetingController } from '../../../useCases/createDemoMeeting';
import { createMeetingController } from '../../../useCases/createMeeting';
import { createResourceController } from '../../../useCases/createResource';
import { deleteMeetingController } from '../../../useCases/deleteMeeting';
import { deleteResourceController } from '../../../useCases/deleteResource';
import { getCanvasController } from '../../../useCases/getCanvas';
import { getMeetingController } from '../../../useCases/getMeeting';
import { setActiveCanvasController } from '../../../useCases/setActiveCanvas';
import { setCanvasDataController } from '../../../useCases/setCanvasData';
import { updateMeetingController } from '../../../useCases/updateMeeting';
import { logger } from '../../../../../logger';

const meetingRouter = express.Router();

meetingRouter.post('/', middleware.ensureAccountAdmin(), (req, res) => {
    logger.info({ body: req.body }, '[POST /] Creating a meeting');
    createMeetingController.execute(req, res);
});

meetingRouter.post('/demo', (req, res) => {
    logger.info({ body: req.body }, '[POST /demo] Creating a demo meeting');
    createDemoMeetingController.execute(req, res);
});

meetingRouter.get('/:meetingId', (req, res) => {
    logger.info({ params: req.params }, '[GET /:meetingId] Fetching meeting');
    getMeetingController.execute(req, res);
});

meetingRouter.put('/:meetingId', middleware.ensureAccountAdmin(), (req, res) => {
    logger.info({ params: req.params, body: req.body }, '[PUT /:meetingId] Updating meeting');
    updateMeetingController.execute(req, res);
});

meetingRouter.delete('/:meetingId', middleware.ensureAccountAdmin(), (req, res) => {
    logger.info({ params: req.params }, '[DELETE /:meetingId] Deleting meeting');
    deleteMeetingController.execute(req, res);
});

meetingRouter.post('/:meetingId/canvas', (req, res) => {
    logger.info({ params: req.params, body: req.body }, '[POST /:meetingId/canvas] Creating canvas');
    createCanvasController.execute(req, res);
});

meetingRouter.post('/:meetingId/resource', (req, res) => {
    logger.info({ params: req.params, body: req.body }, '[POST /:meetingId/resource] Creating resource');
    createResourceController.execute(req, res);
});

meetingRouter.delete('/:meetingId/resource/:resourceId', (req, res) => {
    logger.info({ params: req.params }, '[DELETE /:meetingId/resource/:resourceId] Deleting resource');
    deleteResourceController.execute(req, res);
});

meetingRouter.get('/canvas/:canvasId', (req, res) => {
    logger.info({ params: req.params }, '[GET /canvas/:canvasId] Fetching canvas');
    getCanvasController.execute(req, res);
});

const meetingSocketHandler = (socket: Socket) => {
    socket.on('join-room', async (meetingId) => {
        logger.info({ socketId: socket.id, meetingId }, '[join-room] User joined room');
        socket.join(meetingId);

        logger.info({ meetingId, socketId: socket.id }, '[join-room] Broadcasting user-connected');
        socket.broadcast.to(meetingId).emit('user-connected', socket.id);

        logger.info({ socketId: socket.id, meetingId }, '[join-room] Handling peer join');
        onPeerJoinedMeeting(socket, meetingId);

        socket.on('canvas-update', (canvasId, event) => {
            logger.info({ socketId: socket.id, canvasId, event }, '[canvas-update] Canvas update event');
            setCanvasDataController.executeImpl(socket, {
                canvasId,
                meetingId,
                event,
            });
        });

        socket.on('active-canvas-change', (canvasId) => {
            logger.info({ socketId: socket.id, canvasId, meetingId }, '[active-canvas-change] Active canvas change event');
            setActiveCanvasController.executeImpl(socket, {
                canvasId,
                meetingId,
            });
        });

        socket.on('chat-message', (chatId, event) => {
            logger.info({ socketId: socket.id, chatId, meetingId, content: event.content }, '[chat-message] Chat message event');
            sendChatMessageController.executeImpl(socket, {
                meetingId,
                chatId,
                content: event.content,
            });
        });

        socket.on('new-resource', (data) => {
            logger.info({ socketId: socket.id, meetingId, data }, '[new-resource] New resource event');
            io.to(meetingId).emit('new-resource', data);
        });
    });
};

export { meetingRouter, meetingSocketHandler };
