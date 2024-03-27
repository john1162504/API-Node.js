import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as users from "../models/user.model";
import {readImage, removeImage, saveImage} from "../models/image.model";
import {getImageExtension} from "../services/imageTools";


const getImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET user's image`);
    if (isNaN(parseInt(req.params.id, 10)) === true) {
        res.status(400).send("Bad Request. Invalid information");
        return;
    }
    try{
        const result = await users.findUserByColAttribute(req.params.id, "id");
        if (result.length === 0) {
            res.status(404).send("Not Found. No user with specified ID, or user has no image");
            return;
        }
        const user = result[0];
        const imageName = user.image_filename;
        if (imageName === null) {
            res.status(404).send("Not Found. No user with specified ID, or user has no image");
            return;
        }
        const [image, mimeType] = await readImage(imageName);
        if(image === null || mimeType === null) {
            res.status(500).send("Internal Server Error");
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
        res.status(400).send("Bad Request. Invalid information");
        return;
    }
    try{
        const id = req.params.id;
        const authId =req.headers.authenticatedUserId;
        const result = await users.findUserByColAttribute(id, "id");
        if (result.length === 0) {
            res.status(404).send("Not Found. No such user with ID given");
            return;
        }
        if (id !== authId) {
            res.status(403).send("Can not change another user's profile photo");
            return;
        }
        const mimeType = req.headers["content-type"];
        const img = req.body;
        const fileExt = getImageExtension(mimeType);
        if (fileExt === null) {
            res.statusMessage = 'Bad Request: Invalid image supplied (possibly incorrect file type';
            res.status(400).send();
            return;
        }
        const user = result[0];
        if (user.image_filename === null) {
            const imgName = await saveImage(img, fileExt);
            users.updateUserByColAttribute(imgName, "image_filename", id);
            res.status(201).send("Created. New image created");
            return;
        } else {
            const imgName = await saveImage(img, fileExt);
            users.updateUserByColAttribute(imgName, "image_filename", id);
            res.status(201).send("OK. Image updated");
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
            res.status(404).send("Not Found. No such user with ID given");
            return;
        }
        if (id !== authId) {
            res.status(403).send("Can not delete another user's profile photo");
            return;
        }
        const user = result[0];
        const imgName = user.image_filename
        if (imgName === null) {
            res.status(404).send("Not Found. No image with given user");
            return;
        }
        await users.updateUserByColAttribute(null, "image_filename", user.id.toString());
        await removeImage(imgName);
        res.status(200).send("OK");
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getImage, setImage, deleteImage}