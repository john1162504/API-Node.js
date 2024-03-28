import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as ST from "../models/supportTier.model";
import * as Petition from "../models/petition.model"
import * as schemas from '../resources/schemas.json';
import { validate } from "../validator";


const addSupportTier = async (req: Request, res: Response): Promise<void> => {
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

        const petition = await Petition.getOne(petitionId);
        const ownerId = petition.ownerId;

        if (ownerId === null) {
            Logger.warn("Petition does not have an owner");
            res.status(500).send("Internal Server Error");
            return;
        }
        const authId = req.headers.authenticatedUserId;
        if (authId !== ownerId.toString()) {
            res.status(403).send("Only the owner of a petition may modify it");
            return;
        }

        const existingTitles = await ST.getExistingTitles(petitionId);
        if (existingTitles.length >= 3) {
            res.status(403).send("Can't add a support tier if 3 already exist");
            return;
        }

        if (existingTitles.includes(req.body.title)) {
            res.status(403).send("Support title not unique within petition");
            return;
        }

        const title = req.body.title;
        const description = req.body.description;
        const cost = req.body.cost;

        const Tier = {
            title,
            description,
            cost
        }

        const validation = await validate(schemas.support_tier_post, Tier);
        if (validation !== true) {
            res.status(400).send("Bad Request. Invalid information");
            return;
        }

        const result = await ST.insertSupportTier(petitionId, title, description, cost);

        if (result) {
            res.status(201).send("OK");
            return;
        } else {
            Logger.warn("Support tier could not be add");
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

const editSupportTier = async (req: Request, res: Response): Promise<void> => {
    if (isNaN(parseInt(req.params.id, 10))|| isNaN(parseInt(req.params.tierId, 10))) {
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

        const tierId = req.params.tierId;
        const validateTiers = await ST.getValidSupportTierIds(petitionId);
        if (!validateTiers.includes(tierId)) {
            res.status(404).send("Not Found. No support tier with id");
            return;
        }

        const petition = await Petition.getOne(petitionId);
        const tier = await ST.getSupportTierById(tierId);
        const ownerId = petition.ownerId;

        if (ownerId === null) {
            Logger.warn("Petition does not have an owner");
            res.status(500).send("Internal Server Error");
            return;
        }
        const authId = req.headers.authenticatedUserId;
        if (authId !== ownerId.toString()) {
            res.status(403).send("Only the owner of a petition may modify it");
            return;
        }

        const existingTitles = await ST.getExistingTitles(petitionId);
        if (existingTitles.includes(req.body.title)) {
            res.status(403).send("Support title not unique within petition");
            return;
        }

        const title = req.body.hasOwnProperty("title") ? req.body.title : tier.title;
        const description = req.body.hasOwnProperty("description") ? req.body.description : tier.description;
        const cost = req.body.hasOwnProperty("cost") ? req.body.cost : tier.cost;

        const numOfSupporter = await ST.getNumOfSupporter(tierId);
        if (numOfSupporter > 0) {
            res.status(403).send("Can not edit a supporter tier if a supporter already exists for it");
            return;
        }

        const Tier = {
            title,
            description,
            cost
        }

        const validation = await validate(schemas.support_tier_post, Tier);
        if (validation !== true) {
            res.status(400).send("Bad Request. Invalid information");
            return;
        }

        const result = ST.editSupportTier(title, description, cost, tierId);
        if (result) {
            res.status(200).send("OK");
            return;
        } else {
            Logger.warn("Support tier could not be edit");
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

const deleteSupportTier = async (req: Request, res: Response): Promise<void> => {
    if (isNaN(parseInt(req.params.id, 10)) || isNaN(parseInt(req.params.tierId, 10))) {
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

        const tierId = req.params.tierId;
        const validateTiers = await ST.getValidSupportTierIds(petitionId);
        if (!validateTiers.includes(tierId)) {
            res.status(404).send("Not Found. No support tier with id");
            return;
        }

        const petition = await Petition.getOne(petitionId);
        const tier = await ST.getSupportTierById(tierId);
        const ownerId = petition.ownerId;


        if (ownerId === null) {
            Logger.warn("Petition does not have an owner");
            res.status(500).send("Internal Server Error");
            return;
        }
        const authId = req.headers.authenticatedUserId;
        if (authId !== ownerId.toString()) {
            res.status(403).send("Only the owner of a petition may delete it");
            return;
        }

        const numOfSupporter = await ST.getNumOfSupporter(tierId);
        if (numOfSupporter > 0) {
            res.status(403).send("Can not delete a supporter tier if a supporter already exists for it");
            return;
        }

        const existingTitles = await ST.getExistingTitles(petitionId);
        if (existingTitles.length === 1) {
            res.status(403).send("Can not remove a support tier if it is the only one for a petition");
            return;
        }

        const result = await ST.deleteSupportTier(tierId);
        if (result) {
            res.status(200).send("OK");
            return;
        } else {
            Logger.warn("Support tier could not be delete");
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

const checkTitleValidation = async (petitionId: string, newTitle: string): Promise<boolean> => {
    const titles = await ST.getExistingTitles(petitionId);
    return titles.length < 3 && !titles.includes(newTitle);
}

function hasUniqueTitles(supportTiers: supportTier[]): boolean {
    const titlesSet = new Set<string>();
    for (const tier of supportTiers) {
        if (titlesSet.has(tier.title)) {
            return false; // Duplicate title found
        }
        titlesSet.add(tier.title);
    }
    return true; // All titles are unique
}


export {addSupportTier, editSupportTier, deleteSupportTier, checkTitleValidation, hasUniqueTitles};