import e, {Request, Response} from "express";
import Logger from '../../config/logger';
import * as schemas from '../resources/schemas.json';
import { validate } from '../validator';
import * as users from '../models/user.models'
import * as encrypter from '../services/passwords'

const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST create an user with first name: ${req.body.firstName}\n
                                          last name: ${req.body.lastName}\n
                                          email: ${req.body.email}\n
                                          password: ${req.body.password}`);
    const validation = await validate(
        schemas.user_register, req.body
    );
    if (!validation) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = await encrypter.hash(req.body.password);
    try{
        // Your code goes here
        if (await users.checkEmailExist(email)) {
            res.statusMessage = 'Email already in use'
            res.status(403).send();
            return;
        }
        const result = await users.insert(firstName, lastName, email, password)
        res.status( 201 ).send({"userId": result.insertId} );
    } catch (err) {
        res.status( 500 ).send( `ERROR creating user ${firstName}: ${ err }` );
        return;
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {register, login, logout, view, update}