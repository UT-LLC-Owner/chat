import {ObjectId} from 'bson'

export interface MessagePayload {
    sender_id: ObjectId | string;
    recipient_id: ObjectId | string;
    msg: string;
}

export interface MessageDocument extends MessagePayload{
    conversation_id: ObjectId
    read: boolean;
    _id: ObjectId;
    timestamp: Date;
}

export interface FindUsersPayload {
    search?: string;
}

export interface GetUserPayload {
    _id: string;
    firstName: string;
}

export interface GetConversationConfig {
    _id: string;
    page: number;
    items: number;
}