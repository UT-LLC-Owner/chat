import {NextFunction, Request, Response, Router} from "express";
import {FindUsers} from "../../Database";

const router = Router()

const SearchUsers = async (req: Request, res: Response, next: NextFunction) => {
    const { search } = req.query
    const users = await FindUsers({search})
    res.status(200).json(users)
}

router.get("/", SearchUsers)

export default router