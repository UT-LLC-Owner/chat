import {Express} from "express";
import config from "../config";
import {Http2Server} from "http2";
import StartDB from "../Database";

const express = require('express')
const bodyParser = require('body-parser')
const Server = require('http').Server


import Auth from './routes/auth'
import Users from './routes/users'
const PrepareApp = (app: Express): Express => {
    app.use(bodyParser.json())
    app.use(express.static(config.public))
    app.use('/auth', Auth)
    app.use('/users', Users)
    return app
}

const PrepareServer = (server: Http2Server): Promise<Http2Server> => {
    return StartDB().then(() => {
        server.listen(config.port)

        server.on('listening', () => {
            console.log(`\n\nListening on port ${config.port}\n`)
            console.log("Config:\t")
            console.log(config)
        })
        return server
    })
}

/** MAIN EXECUTION **/
export default PrepareServer(Server(PrepareApp(express())))

