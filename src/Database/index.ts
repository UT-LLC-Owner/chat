import {MessagePayload} from "../interfaces";

export const PutMessage = (payload: MessagePayload) => {
    payload.read = false
    //TODO Add payload to Messages Collection
}