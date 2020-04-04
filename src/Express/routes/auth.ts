const {users} = require('../../../test/data')

import {NextFunction, Request, Response, Router} from "express";

const router = Router()

const Login = (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body
    const user = GetUser(name)

    if(user){
        res.status(200).json(user)
    } else {
        res.status(400).json({
            message: "Unauthorized"
        })
    }
}

const GetUser = (name: string) : Object|null => {
    let result: Object | null = null
    for (let i = 0; i < users.length; i++) {
        let user = users[i]
        const {name: dbName} = user
        if (name.toLowerCase() === <string>dbName.toLowerCase()) {
            result = user
            break
        }
    }
    return result
}

router.post("/login", Login)

export default router