import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as Petition from '../models/petition.model';
import {readImage, removeImage, saveImage} from "../models/image.model";
import {getImageExtension} from "../services/imageTools";

const getImage = async (req: Request, res: Response): Promise<void> => {
    if (isNaN(parseInt(req.params.id, 10)) === true) {
        res.status(400).send("Bad Request. Invalid information");
        return;
    }
    try{
        const id = req.params.id;
        const validPetitions = await Petition.getPetitionIds();
        if (!validPetitions.includes(id)) {
            res.status(404).send("Not Found. No petition with id");
            return;
        }

        const imageName = await Petition.getPetitionImageName(id);
        if (imageName === null) {
            res.status(404).send("Petition has no image");
            return;
        }
        const [image, mimeType] = await readImage(imageName);
        if(image === null || mimeType === null) {
            res.status(500).send("Internal Server Error");
            return;
        }
        res.status(200).contentType(mimeType).send(image)
        return;
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
        const validPetitions = await Petition.getPetitionIds();
        if (!validPetitions.includes(id)) {
            res.status(404).send("Not Found. No petition with id");
            return;
        }

        if (id !== authId) {
            res.status(403).send("Forbidden. Only the owner of a petition can change the hero image");
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

        const imageName = await Petition.getPetitionImageName(id);
        if (imageName === null) {
            const newImageName = await saveImage(img, fileExt);
            const result = await Petition.updatePetitionImage(newImageName, id);
            if (result) {
                res.status(201).send("OK. Image added");
                return;
            } else {
                res.status(500).send("Internal Server Error");
                return;
            }
        } else {
            const newImageName = await saveImage(img, fileExt);
            const result = await Petition.updatePetitionImage(newImageName, id);
            if (result) {
                res.status(201).send("OK. Image updated");
                return;
            } else {
                res.status(500).send("Internal Server Error");
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


export {getImage, setImage};