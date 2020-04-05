import {NextFunction, Request, Response, Router} from "express";
import {GetUnreadMessages, GetUserByFirstName} from "../../Database";

const router = Router()

const Login = async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body
    const user = await GetUserByFirstName(name)

    if(user){
        const NewMessages = await GetUnreadMessages(user._id)
        const result = {
            ...user,
            unread: NewMessages
        }
        res.status(200).json(result)
    } else {
        res.status(400).json({
            message: "Unauthorized"
        })
    }
}

router.post("/login", Login)

export default router