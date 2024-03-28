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
            res.statusMessage = "Bad Request. Invalid information";
            res.status(400).send();
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
                res.statusMessage = "Bad Request. Invalid information";
                res.status(400).send();
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
        res.statusMessage = "OK";
        res.status(200).json(petitions);
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
            res.statusMessage = "Bad Request. Invalid information";
            res.status(400).send();
            return;
        }
    }
    try{
        const id = req.params.id;

        const validPetitions = await Petition.getPetitionIds();
        if (!validPetitions.includes(id)) {
            res.statusMessage = "Not Found. No petition with id";
            res.status(404).send();
            return;
        }

        const validation = await validate(schemas.petition_search, req.query);
        if (validation !== true) {
            res.statusMessage = "Bad Request. Invalid information";
            res.status(400).send();
            return;
        }

        const petition = await Petition.getOne(id);
        res.statusMessage = "OK";
        res.status(200).json(petition);
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
            res.statusMessage = "Bad Request. Invalid information";
            res.status(400).send();
            return;
        }

        const validCategories = await Petition.getCategoryIds();
        if (!validCategories.includes(req.body.categoryId)) {
            res.status(400).send("Bad Request. Invalid information");
            return;
        }

        const existingPetitionTitles = await Petition.getPetitionTitles();
        if (existingPetitionTitles.includes(req.body.title)) {
            res.statusMessage = "Petition title already exists";
            res.status(403).send();
            return;
        }

        const supportTiers: supportTier[] = req.body.supportTiers;
        if (supportTiers.length > 3 || !hasUniqueTitles(supportTiers)) {
            res.statusMessage = "Bad Request. Invalid information";
            res.status(400).send();
            return;
        }

        const title = req.body.title;
        const categoryId = req.body.categoryId;
        const ownerId = req.headers.authenticatedUserId;
        const description = req.body.description;
        const d = new Date();
        const date = `${d.getFullYear()}-${d.getMonth()}-${d.getDay()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;

        const result = await Petition.addPetition(title, description, date, ownerId.toString(), categoryId);
        const petitionId = result.insertId;
        if (result) {
            for (const s of supportTiers) {
                const supportTierResult = await insertSupportTier(petitionId.toString(), s.title, s.description, s.cost);
            }
            res.statusMessage = "Created";
            res.status(201).json({"petitionId": petitionId});
            return;
        } else {
            Logger.warn("Petition fail to add to database");
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
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
        res.statusMessage = "Bad Request. Invalid information";
        res.status(400).send();
        return;
    }
    try{
        const validPetitions = await Petition.getPetitionIds();
        const petitionId = req.params.id;

        if (!validPetitions.includes(petitionId)) {
            res.statusMessage = "Not Found. No petition with id";
            res.status(404).send();
            return;
        }

        const petition = await Petition.getOne(petitionId);

        const ownerId = petition.ownerId;
        let title;
        let description;
        let categoryId;

        if (ownerId === null) {
            Logger.warn("Petition does not have an owner");
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
        const authId = req.headers.authenticatedUserId;
        if (authId !== ownerId.toString()) {
            res.statusMessage = "Only the owner of a petition may change it";
            res.status(403).send();
            return;
        }

        if (req.body.hasOwnProperty("categoryId")) {
            categoryId = req.body.categoryId;
            const validCategories = await Petition.getCategoryIds();
            if (!validCategories.includes(categoryId)) {
                res.statusMessage = "Bad Request. Invalid information";
                res.status(400).send();
                return;
            }
        } else {
            categoryId = petition.categoryId;
        }

        if (req.body.hasOwnProperty("title")) {
            const existingPetitionTitles = await Petition.getPetitionTitles();
            title = req.body.title;
            if (existingPetitionTitles.includes(title)) {
                res.statusMessage = "Petition title already exists";
                res.status(403).send();
                return;
            }
        } else {
            title = petition.title;
        }

        if (req.body.hasOwnProperty("description")) {
            description = req.body.description;
        } else {
            description = petition.description;
        }

        const editBody = {
            title,
            description,
            categoryId
        }
        const validation = await validate(schemas.petition_patch, editBody);
        if (validation !== true) {
            res.statusMessage = "Bad Request. Invalid information";
            res.status(400).send();
            return;
        }

        const result = await Petition.editPetition(petitionId, title, description, categoryId);
        if (result) {
            res.statusMessage = "OK";
            res.status(200).send();
            return;
        } else {
            Logger.warn("Petition not updated");
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
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
        res.statusMessage = "Bad Request. Invalid information";
        res.status(400).send();
        return;
    }
    try{
        const validPetitions = await Petition.getPetitionIds();
        const petitionId = req.params.id;

        if (!validPetitions.includes(petitionId)) {
            res.statusMessage = "Not Found. No petition with id";
            res.status(404).send();
            return;
        }

        const petition = await Petition.getOne(petitionId);
        const ownerId = petition.ownerId;

        if (ownerId === null) {
            Logger.warn("Petition does not have an owner");
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }

        const authId = req.headers.authenticatedUserId;
        if (authId !== ownerId.toString()) {
            res.statusMessage = "Only the owner of a petition may change it";
            res.status(403).send();
            return;
        }

        if (petition.numberOfSupporters > 0) {
            res.statusMessage = "Can not delete a petition with one or more suppoters";
            res.status(403).send();
            return;
        }

        const result = await Petition.deletePetition(petitionId);
        if (result) {
            res.statusMessage = "OK";
            res.status(200).send();
            return;
        } else {
            Logger.warn("Petition not deleted");
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
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
            res.statusMessage = "OK";
            res.status(200).json(categories);
            return;
        } else {
            res.statusMessage = "Could not retrieve categories";
            res.status(500).send();
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

