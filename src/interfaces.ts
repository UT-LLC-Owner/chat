export interface MessagePayload {
    sender_id: string;
    recipient_id: string;
    msg: string;
    read: boolean;
}

export interface FindUsersPayload {
    search?: string;
}

export interface GetUserPayload {
    _id: string;
    firstName: string;
}