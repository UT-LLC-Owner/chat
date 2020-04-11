import {FindUsersPayload, GetConversationConfig, GetUserPayload, MessageDocument, MessagePayload} from "../interfaces";
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

export const MessageDoc = async (payload: MessagePayload): Promise<MessageDocument> => {
    const _id = new ObjectId()
    const { sender_id, recipient_id, msg } = payload
    const conversation_id = await GetConversationID([sender_id as string, recipient_id as string])
    const result: MessageDocument = {
        sender_id,
        recipient_id,
        msg,
        read: false,
        _id,
        timestamp: _id.getTimestamp(),
        conversation_id
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

export const GetConversationID = async (participant_ids: (string)[]): Promise<ObjectId> => {
    const Messages = db.collection('Messages')
    const [ id1, id2 ] = participant_ids
    const _id1 = new ObjectId(id1)
    const _id2 = new ObjectId(id2)
    const query = {
        $or: [
            {
                sender_id: _id1,
                recipient_id: _id2
            },
            {
                sender_id: _id2,
                recipient_id: _id1
            }
        ]
    }
    const response = await Messages.findOne(query, {fields:{conversation_id: 1}})
    console.log(response)
    const conversation_id = (response && response.conversation_id) ? new ObjectId(response.conversation_id) : new ObjectId()
    return conversation_id
}

export const GetConversation = async (config: GetConversationConfig) => {
    const Messages = db.collection('Messages')
    const {_id, page, items} = config
    const limit = (items < 1) ? 10 : items
    const skip = (page - 1) * limit
    const options = {skip, limit}
    const conversation_id = new ObjectId(_id)
    const query = {conversation_id}

    const messages = await Messages.find(query,options).toArray()
    console.log(messages)
    return messages
}

export const GetConversations = async (_id: string) => {
    const Messages = db.collection('Messages')
    const MyID = new ObjectId(_id)
    const pipeline = [
        {
            $match: { $or: [ {recipient_id: MyID}, {sender_id: MyID}] }
        },
        {
            $sort: { timestamp: 1 }
        },
        {
            $group: {
                _id: "$conversation_id",
                count: { $sum: 1 },
                participant_1: { $first: "$sender_id"},
                participant_2: { $first: "$recipient_id"},
                last_message: { $last: "$msg"}
            }
        },
        {
            $lookup: {
                from: "Users",
                localField: "participant_1",
                foreignField: "_id",
                as: "participant_1_data"
            }
        },
        {
            $lookup: {
                from: "Users",
                localField: "participant_2",
                foreignField: "_id",
                as: "participant_2_data"
            }
        },
        {
            $project: {
                participant_1: 1,
                participant_2: 1,
                last_message: 1,
                participant_1_data: { $arrayElemAt: ["$participant_1_data", 0] },
                participant_2_data: { $arrayElemAt: ["$participant_2_data", 0] }
            }
        }
    ]
    const result = await Messages.aggregate(pipeline).toArray()
    console.log(result)
    return result
}

export const GetConversationData = async (_id: string) => {
    const Messages = db.collection('Messages')
    const conversation_id = new ObjectId(_id)
    const pipeline = [
        {
            $match: {conversation_id}
        },
        {
            $sort: { timestamp: 1 }
        },
        {
            $group: {
                _id: "$conversation_id",
                count: { $sum: 1 },
                participant_1: { $first: "$sender_id"},
                participant_2: { $first: "$recipient_id"},
                last_message: { $last: "$msg"}
            }
        },
        {
            $lookup: {
                from: "Users",
                localField: "participant_1",
                foreignField: "_id",
                as: "participant_1_data"
            }
        },
        {
            $lookup: {
                from: "Users",
                localField: "participant_2",
                foreignField: "_id",
                as: "participant_2_data"
            }
        },
        {
            $project: {
                participant_1: 1,
                participant_2: 1,
                last_message: 1,
                participant_1_data: { $arrayElemAt: ["$participant_1_data", 0] },
                participant_2_data: { $arrayElemAt: ["$participant_2_data", 0] }
            }
        }
    ]
    const result = await Messages.aggregate(pipeline).toArray()
    console.log(result)
    return result[0]
}

export const MessagesRead = async (_ids: string[]) => {
    const Messages = db.collection('Messages')
    const objIds = _ids.map(x => new ObjectId(x))
    const query = { _id: { $in: objIds } }
    const pipeline = [
        {
            $set: { read: "$$NOW" }
        }
    ]

    return await Messages.updateMany(query, pipeline)
}

export const FindUsers = async (payload: FindUsersPayload) => {
    const { search } = payload
    const Users = db.collection('Users')
    const query = {firstName:{$regex: `${search}.+`, $options:"i"}}

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

export const GetUserByID = async (_id: string) => {
    const query = {_id}
    return GetUser(query)
}