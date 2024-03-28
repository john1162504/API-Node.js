import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as users from "../models/user.model";
import {readImage, removeImage, saveImage} from "../models/image.model";
import {getImageExtension} from "../services/imageTools";


const getImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET user's image`);
    if (isNaN(parseInt(req.params.id, 10)) === true) {
        res.statusMessage = "Bad Request. Invalid information";
        res.status(400).send();
        return;
    }
    try{
        const result = await users.findUserByColAttribute(req.params.id, "id");
        if (result.length === 0) {
            res.statusMessage = "Not Found. No user with specified ID, or user has no image";
            res.status(404).send();
            return;
        }
        const user = result[0];
        const imageName = user.image_filename;
        if (imageName === null) {
            res.statusMessage = "Not Found. No user with specified ID, or user has no image";
            res.status(404).send();
            return;
        }
        const [image, mimeType] = await readImage(imageName);
        if(image === null || mimeType === null) {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        } else {
            res.status(200).contentType(mimeType).send(image)
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    if (isNaN(parseInt(req.params.id, 10)) === true) {
        res.statusMessage = "Bad Request. Invalid information";
        res.status(400).send();
        return;
    }
    try{
        const id = req.params.id;
        const authId =req.headers.authenticatedUserId;
        const result = await users.findUserByColAttribute(id, "id");
        if (result.length === 0) {
            res.statusMessage = "Not Found. No such user with ID given";
            res.status(404).send();
            return;
        }
        if (id !== authId) {
            res.statusMessage = "Can not change another user's profile photo";
            res.status(403).send();
            return;
        }
        const mimeType = req.headers["content-type"];
        const image = req.body;
        const fileExt = getImageExtension(mimeType);
        if (fileExt === null) {
            res.statusMessage = 'Bad Request: Invalid image supplied (possibly incorrect file type';
            res.status(400).send();
            return;
        }
        const user = result[0];
        if (user.image_filename === null) {
            const imageName = await saveImage(image, fileExt);
            users.updateUserByColAttribute(imageName, "image_filename", id);
            res.statusMessage = "Created. New image created";
            res.status(201).send();
            return;
        } else {
            const imageName = await saveImage(image, fileExt);
            users.updateUserByColAttribute(imageName, "image_filename", id);
            res.statusMessage = "OK. Image updated";
            res.status(201).send();
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const authId =req.headers.authenticatedUserId;
        const result = await users.findUserByColAttribute(id, "id");
        if (isNaN(parseInt(req.params.id, 10)) === true || result.length === 0) {
            res.statusMessage = "Not Found. No such user with ID given";
            res.status(404).send();
            return;
        }
        if (id !== authId) {
            res.statusMessage = "Can not delete another user's profile photo";
            res.status(403).send();
            return;
        }
        const user = result[0];
        const imgName = user.image_filename
        if (imgName === null) {
            res.statusMessage = "Not Found. No image with given user";
            res.status(404).send();
            return;
        }
        await users.updateUserByColAttribute(null, "image_filename", user.id.toString());
        await removeImage(imgName);
        res.statusMessage = "OK";
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getImage, setImage, deleteImage}