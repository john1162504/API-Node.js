import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as schemas from '../resources/schemas.json';
import {validate} from '../validator';
import * as users from '../models/user.models'
import * as encrypter from '../services/passwords'
import {uid} from 'rand-token';

const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST create an user with first name: ${req.body.firstName}\n
                                          last name: ${req.body.lastName}\n
                                          email: ${req.body.email}\n
                                          password: ${req.body.password}`);
    const validation = await validate(
        schemas.user_register, req.body
    );
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = await encrypter.hash(req.body.password);
    try{
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
    Logger.http(`GET user with email ${req.body.email}`);
    const validation = await validate(
        schemas.user_login, req.body
    );
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    const email = req.body.email;
    const password = req.body.password;
    try{
        const result = await users.findUserByColAttribute(email, "email");
        if (result.length === 0) {
            res.statusMessage = "Invalid information";
            res.status(400).send();
            return;
        } else {
            const user = result[0];
            if (await encrypter.compare(password, user.password) === true) {
                const token = uid(62); //
                await users.insertToken(token, user.id);
                req.headers["X-Authorization"] = token;
                res.json({"userId": user.id,
                        "token": token});
                res.statusMessage = "OK";
                res.status(200).send();
                return;
            } else {
                res.statusMessage = "Incorrect email/password";
                res.status(401).send();
                return;
            }
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    const id = req.headers.authenticatedUserId;
    Logger.info(req.headers.authenticatedUserId);
    try{
        const result = await users.findUserByColAttribute(id.toString(), "id");
        if (result.length === 0) {
            res.statusMessage = "Not Found. No user with specified ID";
            res.status(404).send();
            return;
        } else {
            const user = result[0];
            await users.insertToken(undefined, user.id);
            res.json({"firstName": user.first_name,
                      "lastName": user.last_name,
                      "email": user.email});
            res.status(200).send("OK");
            return;
        }
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