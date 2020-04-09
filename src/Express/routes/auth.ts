import {NextFunction, Request, Response, Router} from "express";
import {GetMessages, GetUserByFirstName} from "../../Database";

const router = Router()

const Login = async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body
    const user = await GetUserByFirstName(name)

    if(user){
        const NewMessages = await GetMessages(user._id)
        const result = {
            ...user,
            messages: NewMessages
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