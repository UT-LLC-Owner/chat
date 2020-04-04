import {Socket, Server} from "socket.io";
import config from "./config";
import {Express} from "express";
import {Http2Server} from "http2";

const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const redis = require('socket.io-redis')
const bodyParser = require('body-parser')

import Auth from "./routes/auth";

const PrepareApp = (app: Express): void => {
    app.use(bodyParser.json())
    app.use(express.static(`${__dirname}/public`))
    app.use('/auth', Auth)
}

const PrepareServer = (server: Http2Server): void => {
    server.listen(config.port)

    server.on('listening', () => {
        console.log(`\n\nListening on port ${config.port}\n`)
        console.log("Config:\t")
        console.log(config)
    })
}

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

PrepareApp(app)
PrepareServer(server)
PrepareIO(io)




