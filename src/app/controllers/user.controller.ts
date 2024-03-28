import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as schemas from '../resources/schemas.json';
import {validate} from '../validator';
import * as users from '../models/user.model'
import * as encrypter from '../services/passwords'
import {uid} from 'rand-token';

const register = async (req: Request, res: Response): Promise<void> => {
    const validation = await validate(
        schemas.user_register, req.body
    );
    if (validation !== true) {
        res.status(400).send("Bad Request. Invalid information");
        return;
    }
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = await encrypter.hash(req.body.password);
    try{
        if (await users.checkEmailExist(email)) {
            res.status(403).send("Forbidden. Email already in use");
            return;
        }
        const result = await users.insert(firstName, lastName, email, password)
        res.statusMessage = "OK";
        res.status(201).send({"userId": result.insertId} );
    } catch (err) {
        res.status(500).send("Internal Server Error");
        return;
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    const validation = await validate(schemas.user_login, req.body);
    if (validation !== true) {
        res.status(400).send("Bad Request. Invalid information");
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
                const token = uid(62);
                await users.insertToken(token, user.id);
                req.headers["X-Authorization"] = token;
                res.statusMessage = "OK";
                res.status(200).json({"userId": user.id,
                "token": token});
                return;
            } else {
                res.status(401).send("Incorrect email/password");
                return;
            }
        }
    } catch (err) {
        Logger.error(err);
        res.status(500).send("Internal Server Error");
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    const id = req.headers.authenticatedUserId;
    try{
        const result = await users.findUserByColAttribute(id.toString(), "id");
        if (result.length === 0) {
            res.status(401).send("Unauthorized. Cannot log out if you are not authenticated");
            return;
        } else {
            const user = result[0];
            await users.insertToken(null, user.id);
            req.headers["X-Authorization"] = null;
            res.statusMessage = 'OK'
            res.status(200).send();
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
    if (isNaN(parseInt(req.params.id, 10))) {
        res.status(400).send("Bad Request. Invalid information");
        return;
    }
    const id = req.params.id;
    try{
        const result = await users.findUserByColAttribute(id, "id");
        if (result.length === 0) {
            res.statusMessage = "Not Found. No user with specified ID";
            res.status(404).send();
            return;
        }
        const user = result[0];
        const authed = await users.findUserByColAttribute(req.get("X-Authorization"), "auth_token")
        if (authed.length === 0) {
            res.statusMessage = "OK";
            res.status(200).json({"firstName": user.first_name,
            "lastName": user.last_name
            });
            return;
        }
        const authUser = authed[0];
        if (id === authUser.id.toString()) {
            res.statusMessage = "OK";
            res.status(200).json({"firstName": user.first_name,
            "lastName": user.last_name,
            "email": user.email});
            return;
        } else {
            res.statusMessage = "OK";
            res.status(200).json({"firstName": user.first_name,
            "lastName": user.last_name});
            return;
        }

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    if (isNaN(parseInt(req.params.id, 10)) === true) {
        res.status(400).send("Bad Request. Invalid information");
        return;
    }
    const id = req.params.id;
    const authedId = req.headers.authenticatedUserId;
    if (id !== authedId) {
        res.status(403).send("Can not edit another user's information")
        return;
    }
    const validation = await validate(schemas.user_edit, req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    if (req.body.password === req.body.currentPassword) {
        res.status(403).send("Identical current and new password");
        return;
    }
    try{
        const result = await users.findUserByColAttribute(id, "id");
        if (result.length === 0) {
            res.statusMessage = "Not Found. No user with specified ID";
            res.status(404).send();
            return;
        }
        const user = result[0];
        if (await users.checkEmailExist(req.body.email) === true && req.body.email !== user.email) {
            res.status(403).send("Email already in use");
            return;
        }
        if (await encrypter.compare(req.body.currentPassword, user.password) === true) {
            for (const param in req.body) {
                if (param !== "currentPassword") {
                    if (param === "password") {
                        const hashed = await encrypter.hash(req.body.password);
                        await users.updateUserByColAttribute(hashed, "password", user.id.toString());
                    } else {
                        await users.updateUserByColAttribute(req.body[param], param, user.id.toString());
                    }
                    res.status(200).send("OK");
                    return;
                }
            }
        } else {
            res.status(401).send("Invalid currentPassword");
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {register, login, logout, view, update}