import {NextFunction, Request, Response, Router} from "express";
import {GetUserByFirstName} from "../../Database";

const router = Router()

const Login = async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body
    const user = await GetUserByFirstName(name)

    if(user){
        res.status(200).json(user)
    } else {
        res.status(400).json({
            message: "Unauthorized"
        })
    }
}

router.post("/login", Login)

export default router