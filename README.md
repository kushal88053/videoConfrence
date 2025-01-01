# videoConfrence

i am learing to make how google and zoom make the meeting and delever real time stream

<div align="center">
<img width="400" src="docs/logo.png" alt="logo">
</div>

## Overview

`Video Confressing` is an open-source video conference web application designed for interactive online tutoring. Some of the features included are:

- **Audio and video**: Real-time sharing of audio and video.
- **Shared whiteboard**: Collaborate with students on a shared whiteboard.
- **Screen sharing**: Go to presenting mode by sharing your screen.
- **Chat**: Send simple messages to other participants of the meeting.
- **File sharing**: Upload relevant files to the meeting.
- **Graph plotter**: Insert mathematical graphs to the whiteboard.

<br />
<div align="center">
<img src="docs/app.png" alt=""/>
</div>
<br />

## Live demo

<!-- [Live demo](https://meet.nettubooking.com) -->

## Run it locally

- Run the Node.js server application in a terminal:

```bash
$ cd server
# Copy .env.template secrets file and adjust them if needed
$ cp integrations/.env.template integrations/.env
# Using docker compose to spin up redis and mongodb
$ npm run infra
# Installing server dependencies
$ npm i
# Starting server
$ npm start
```

- In a different terminal, run the browser application:

```bash
$ cd frontend
$ npm i
$ npm start
```

## Backend Overview

### Redis

Redis is used as the socket adapter for scaling and managing the real-time communication between users. It plays a critical role in:

- **State management for users**: It keeps track of user sessions, their active status, and the ongoing meetings. Redis stores the `userId`, `socketId`, and `active` status, allowing for efficient real-time updates and user management across multiple instances.
- **Scaling Socket.IO**: Redis facilitates horizontal scaling by distributing the messages across multiple Node.js instances via the Redis adapter, ensuring a scalable chat experience even with a large number of active users.

### MongoDB

MongoDB is used as the primary database for the application. It is particularly useful for handling **unstructured data** such as chat messages and user interactions. Key aspects of MongoDB include:

- **User management**: MongoDB stores user profiles, including information such as user roles (admin or not), email, and other relevant data.
- **Chat messages**: MongoDB stores chat history and messages sent during meetings.
- **File uploads**: While MongoDB handles user information and messaging, file uploads (e.g., documents, images) are stored on an S3 bucket.

### File Upload (S3 Bucket)

All uploaded files during meetings are stored in an **S3 bucket** for efficient file handling and retrieval. This ensures that large files are stored securely and can be accessed by users whenever needed.

### SMTP for Mailing

Emails for notifications, password resets, or invitations are sent using **Nodemailer** via SMTP. The SMTP service ensures that communication remains smooth, allowing users to receive timely updates for meetings and other actions.

### Scaling and User Management

- **Meeting Creation**: The backend supports dynamic meeting creation, where users can create meetings, and the system generates unique URLs for joining.
- **User Roles**: The system checks if a user is an **admin** or regular participant based on their credentials stored in the database.
- **Live Meetings**: Redis is used to manage live meetings, tracking the number of users in a meeting and ensuring real-time updates are synchronized across all clients.

## References

1. [Nettu Meet Repository](https://github.com/fmeringdal/nettu-meet)
2. [Mediasoup Demo](https://github.com/versatica/mediasoup-demo)
