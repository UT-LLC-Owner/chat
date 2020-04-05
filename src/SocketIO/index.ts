import {Server, Socket} from "socket.io";
import config from "../config";
import server from "../Express";
import {MessageDoc, PutMessage} from "../Database";
import {MessagePayload} from "../interfaces";
const redis = require('socket.io-redis')
const SocketIO = require('socket.io')

const PrepareIO = (io: Server): void => {
    io.adapter(redis(config.redis))

    io.on('connection', (socket: Socket) => {
        const options: {_id: string} = JSON.parse(socket.handshake.headers["x-unsuccessful"])
        const {_id} = options
        console.log(`New Connection from ${_id}`)
        socket.join(_id)

        socket.on('send message', (payload: MessagePayload) => {
            const { recipient_id } = payload
            const ExistingRooms: string[] = Object.keys(io.sockets.adapter.rooms)
            const doc = MessageDoc(payload)
            if(ExistingRooms.includes(recipient_id as string)){
                socket.to(recipient_id as string).emit('receive message', doc)
            }
            PutMessage(doc).catch(e => console.log(e))
        })

        //TODO message read Event
    })
}






export default async function () {
    const Server = await server
    const io = SocketIO(Server)
    PrepareIO(io)
}