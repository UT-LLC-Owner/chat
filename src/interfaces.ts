export interface MessagePayload {
    sender_id: string;
    recipient_id: string;
    msg: string;
    read: boolean;
}
