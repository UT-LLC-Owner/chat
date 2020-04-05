import {FindUsersPayload, GetUserPayload, MessageDocument, MessagePayload} from "../interfaces";
import { MongoClient, Db} from "mongodb";
import { ObjectId, Timestamp } from "bson";
import config from "../config";

let db: Db

const StartDB = async () => {
    try {
        const client: MongoClient = await MongoClient.connect(config.mongodb.url, {useUnifiedTopology: true})
        db = await client.db('Chat')
        return db
    } catch (err) {
        console.log(err)
    }
}

export default StartDB

export const MessageDoc = (payload: MessagePayload): MessageDocument => {
    const _id = new ObjectId()
    const result: MessageDocument = {
        ...payload,
        read: false,
        _id,
        timestamp: _id.getTimestamp()
    }
    result.sender_id = new ObjectId(result.sender_id)
    result.recipient_id = new ObjectId(result.recipient_id)
    return result
}

export const PutMessage = async (doc: MessageDocument) => {
    try {
        const Messages = db.collection('Messages')
        const response = await Messages.insertOne(doc)
        return response
    } catch (e) {
        console.log(e)
    }
}

export const GetUnreadMessages = async (_id: string) => {
    const Messages = db.collection('Messages')
    const pipeline = [
        {
            $match: { recipient_id: new ObjectId(_id), read: false}
        },
        {
            $sort: { timestamp: 1 }
        },
        {
            $group: {
                _id: "$sender_id",
                messages: {
                    $addToSet: {
                        msg: "$msg",
                        date: {$dateToString:{date:"$timestamp", format: "%Y-%m-%d"}},
                        time: {$dateToString:{date:"$timestamp", format: "%H:%M"}}
                    }
                }
            }
        }
    ]

    return await Messages.aggregate(pipeline).toArray()
}


export const FindUsers = async (payload: FindUsersPayload) => {
    const { search } = payload
    const Users = db.collection('Users')
    const query = {}

    return await Users.find(query).toArray()
}

const GetUser = async (query: {[propName:string]: any}) => {
    const Users = db.collection('Users')
    return await Users.findOne(query)
}

export const GetUserByFirstName = async (firstName: string) => {
    const query = {firstName}
    return GetUser(query)
}