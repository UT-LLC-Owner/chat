import {Server, Socket} from "socket.io";
import config from "../config";
import server from "../Express";
const redis = require('socket.io-redis')

const SocketIO = require('socket.io')
const io = SocketIO(server)

const PrepareIO = (io: Server): void => {
    io.adapter(redis(config.redis))

    io.on('connection', (socket: Socket) => {
        /**TODO
         * The strategy is upon connection you will join your own room based on your ID
         * When a users emits a message event, the data shall include a toId that will tell who to send the message to
         * The message will be emitted to the room and will be saved in a database or if no one is in the room, message will be queued
         * When a user first connects a call for queued messages will be made, if there are queued messages they will be emitted to user
         * Once a user reads a queued message a 'message read' event will be made to signal the message can be deleted
         */
        const options: {friendId: string, myId: string} = JSON.parse(socket.handshake.headers["x-unsuccessful"])
        const {myId} = options

        socket.join(myId)

        socket.on('message', (data: any) => {
            const {toId} = data
            socket.to(toId).emit('message', data)
        })
    })
}




export default function () {
    PrepareIO(io)
}