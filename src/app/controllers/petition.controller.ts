import {Request, Response} from "express";
import Logger from '../../config/logger';
import { validate } from "../validator";
import * as schemas from '../resources/schemas.json';
import * as Petition from '../models/petition.model';
import { hasUniqueTitles } from "./petition.support_tier.controller";
import { insertSupportTier } from "../models/supportTier.model";

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(schemas.petition_search, req.query);
        if (validation !== true) {
            res.status(400).send("Bad Request. Invalid information");
            return;
        }
        if (req.query.hasOwnProperty("startIndex")) {
            req.query.startIndex = parseInt(req.query.startIndex as string, 10) as any;
         }
        if (req.query.hasOwnProperty("count")) {
            req.query.count = parseInt(req.query.count as string, 10) as any;
        }
        if (req.query.hasOwnProperty("supportingCost")) {
            req.query.supportingCost = parseInt(req.query.supportingCost as string, 10) as any;
        }
        if (req.query.hasOwnProperty("ownerId")) {
            req.query.ownerId = parseInt(req.query.ownerId as string, 10) as any;
        }
        if (req.query.hasOwnProperty("supporterId")) {
            req.query.supporterId = parseInt(req.query.supporterId as string, 10) as any;
        }
        if (req.query.hasOwnProperty("categoryIds")) {
            const validCategories = await Petition.getCategoryIds();
            if (Array.isArray(req.query.categoryIds)) {
                req.query.categoryIds = (req.query.categoryIds as string[] ).map((x: string) => parseInt(x, 10)) as any;
            } else {
                req.query.categoryIds = [parseInt(req.query.categoryIds as string, 10)] as any;
            }
            if (!(req.query.categoryIds as any as string[]).every(id => validCategories.includes(id))) {
                res.status(400).send("Bad Request. Invalid information");
                return;
            }
        }
        let search: petitionSearchQuery = {
            startIndex: 0,
            count: -1,
            q: '',
            categoryIds: [],
            supportingCost: -1,
            ownerId: -1,
            supporterId: -1,
            sortBy: 'CREATED_ASC'
        };
        search = {...search, ...req.query};
        const petitions = await Petition.viewAll(search);
        res.status(200).send(petitions);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const getPetition = async (req: Request, res: Response): Promise<void> => {
    if (req.params.id) {
        if (isNaN(parseInt(req.params.id, 10)) === true) {
            res.status(400).send("Bad Request. Invalid information");
            return;
        }
    }
    const id = req.params.id;
    const validation = await validate(schemas.petition_search, req.query);
    const validPetitions = await Petition.getPetitionIds();
    if (validation !== true) {
        res.status(400).send("Bad Request. Invalid information");
        return;
    }
    if (!validPetitions.includes(id)) {
        res.status(404).send("Not Found. No petition with id");
        return;
    }
    try{
        const petition = await Petition.getOne(id);
        res.status(200).send(petition);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(schemas.petition_post, req.body);
        if (validation !== true) {
            res.status(400).send("Bad Request. Invalid information");
            return;
        }

        const validCategories = await Petition.getCategoryIds();
        if (!validCategories.includes(req.body.categoryId)) {
            res.status(400).send("Bad Request. Invalid information");
            return;
        }

        const existingPetitionTitles = await Petition.getPetitionTitles();
        if (existingPetitionTitles.includes(req.body.title)) {
            res.status(403).send("Petition title already exists");
            return;
        }

        const supportTiers: supportTier[] = req.body.supportTiers;
        if (supportTiers.length > 3 || !hasUniqueTitles(supportTiers)) {
            res.status(400).send("Bad Request. Invalid information");
            return;
        }

        const title = req.body.title;
        const categoryId = req.body.categoryId;
        const ownerId = req.headers.authenticatedUserId;
        const desciption = req.body.description;
        const d = new Date();
        const date = `${d.getFullYear()}-${d.getMonth()}-${d.getDay()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;

        const result = await Petition.addPetition(title, desciption, date, ownerId.toString(), categoryId);
        const petitionId = result.insertId;
        if (result) {
            for (const s of supportTiers) {
                const supportTierResult = await insertSupportTier(petitionId, s.title, s.description, s.cost);
            }
            res.status(201).send({"petitionId": petitionId});
            return;
        } else {
            Logger.warn("Petition fail to add to database");
            res.status(500).send("Internal Server Error");
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editPetition = async (req: Request, res: Response): Promise<void> => {
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
        let title;
        let description;
        let categoryId;

        if (ownerId === null) {
            Logger.warn("Petition does not have an owner");
            res.status(500).send("Internal Server Error");
            return;
        }
        const authId = req.headers.authenticatedUserId;
        if (authId !== ownerId.toString()) {
            res.status(403).send("Only the owner of a petition may change it");
            return;
        }
        const validation = await validate(schemas.petition_patch, req.body);
        if (validation !== true) {
            res.status(400).send("Bad Request. Invalid information");
            return;
        }

        if (req.body.hasOwnProperty("categoryId")) {
            const validCategories = await Petition.getCategoryIds();
            if (!validCategories.includes(categoryId)) {
                res.status(400).send("Bad Request. Invalid information");
                return;
            }
            categoryId = req.body.categoryId;
        } else {
            categoryId = petition.categoryId;
        }

        if (req.body.hasOwnProperty("title")) {
            const existingPetitionTitles = await Petition.getPetitionTitles();
            if (existingPetitionTitles.includes(title)) {
                res.status(403).send("Petition title already exists");
                return;
            }
            title = req.body.title;
        } else {
            title = petition.title;
        }

        if (req.body.hasOwnProperty("description")) {
            description = req.body.description;
        } else {
            description = petition.description;
        }

        const result = await Petition.editPetition(petitionId, title, description, categoryId);
        if (result) {
            res.status(200).send("OK");
            return;
        } else {
            Logger.warn("Petition not updated");
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

const deletePetition = async (req: Request, res: Response): Promise<void> => {
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
            res.status(403).send("Only the owner of a petition may change it");
            return;
        }

        if (petition.numberOfSupporters > 0) {
            res.status(403).send("Can not delete a petition with one or more suppoters");
            return;
        }

        const result = await Petition.deletePetition(petitionId);
        if (result) {
            res.status(200).send("OK");
            return;
        } else {
            Logger.warn("Petition not deleted");
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

const getCategories = async(req: Request, res: Response): Promise<void> => {
    try{
        const categories = await Petition.getCategories();
        if (categories) {
            res.status(200).send(categories);
            return;
        } else {
            res.status(500).send("Could not retrieve categories");
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};

