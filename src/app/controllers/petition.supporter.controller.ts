import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as Petition from "../models/petition.model"
import * as Supporter from "../models/supporter.model"
import * as ST from "../models/supportTier.model";
import * as schemas from '../resources/schemas.json';
import { validate } from "../validator";
import { timeStamp } from "console";


const getAllSupportersForPetition = async (req: Request, res: Response): Promise<void> => {
    if (isNaN(parseInt(req.params.id, 10)) === true) {
        res.status(400).send("Bad Request. Invalid information");
        return;
    }
    try{
        const validPetitions = await Petition.getPetitionIds();
        const petitionId = req.params.id;
        if (!validPetitions.includes(petitionId)) {
            res.status(404).send("Not Found. No petition with id");
            return;
        }

        const result = await Supporter.getSupportTierByPetitionId(petitionId);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addSupporter = async (req: Request, res: Response): Promise<void> => {
    if (isNaN(parseInt(req.params.id, 10)) === true) {
        res.status(400).send("Bad Request. Invalid information");
        return;
    }
    try{
        const validPetitions = await Petition.getPetitionIds();
        const petitionId = req.params.id;
        const petition = await Petition.getOne(petitionId);

        if (!validPetitions.includes(petitionId)) {
            res.status(404).send("Not Found. No petition with id");
            return;
        }

        const validTiers = await ST.getValidSupportTierIds(petitionId);
        const tierId =  req.body.supportTierId;
        if (!validTiers.includes(tierId)) {
            res.status(404).send("Not Found. Support does not exist");
            return;
        }

        const ownerId = petition.ownerId;
        const authId = req.headers.authenticatedUserId;

        if (authId === ownerId.toString()) {
            res.status(403).send("Forbidden. Cannot support your own petition");
            return;
        }

        const supportingTiers = await Supporter.getSupportingTiers(authId.toString());
        if (supportingTiers.includes(tierId)) {
            res.status(403).send("Forbidden. Already supoorted at this tier");
            return;
        }

        const validation = await validate(schemas.support_post, req.body);
        if (validation !== true) {
            res.status(400).send("Bad Request. Invalid information");
            return;
        }

        const message = req.body.message;
        const d = new Date();
        const timeStamp = `${d.getFullYear()}-${d.getMonth()}-${d.getDay()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;

        const result = await Supporter.addSupporter(petitionId, tierId, authId.toString(), message, timeStamp);
        if (result) {
            res.status(201).send("Created");
            return;
        } else {
            Logger.warn("Supporter could not be added");
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

export {getAllSupportersForPetition, addSupporter}