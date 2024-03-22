import {Request, Response, NextFunction} from "express";
import {findUserByToken} from '../models/user.models';

const loginRequired = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.get("X-Authorization");
    try {
        const result = await findUserByToken(token);
        if (result.length === 0) {
            res.statusMessage = 'Unauthorised';
            res.status(401).send();
        } else {
            const user = result[0];
            req.headers.authenticatedUserId = user.id.toString();
            next();
        }
    } catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {loginRequired};