import {NextFunction, Request, Response, Router} from "express";
import {FindUsers, GetConversation, GetConversationData, GetUserByID} from "../../Database";

const router = Router()

const SearchUsers = async (req: Request, res: Response, next: NextFunction) => {
    const { search } = req.query
    const users = await FindUsers({search})
    res.status(200).json(users)
}

const GetConversationHandler = async (req: Request, res: Response, next: NextFunction) => {
    let page = (req.query.page) ? parseInt(req.query.page) : 1
    let items = (req.query.items) ? parseInt(req.query.items) : 10
    const { id } = req.params
    const config = {
        _id: id,
        page,
        items
    }
    const messages = await GetConversation(config)
    res.status(200).json(messages)
}

const GetConversationDataHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const data = await GetConversationData(id)
    res.status(200).json(data)
}



router.get("/conversations/:id", GetConversationHandler)

router.get("/conversations/:id/data", GetConversationDataHandler)

router.get("/", SearchUsers)

export default router