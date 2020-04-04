import {FindUsersPayload, GetUserPayload, MessagePayload} from "../interfaces";
import {ObjectId, Collection, MongoClient, Db} from "mongodb";
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


export const PutMessage = async (payload: MessagePayload) => {
    payload.read = false

    try {
        const Messages = db.collection('Messages')
        const response = await Messages.insertOne(payload)
        console.log(response.result)
    } catch (e) {
        console.log(e)
    }
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