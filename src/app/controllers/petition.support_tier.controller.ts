import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as ST from "../models/supportTier.model";

const addSupportTier = async (req: Request, res: Response): Promise<void> => {
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

const editSupportTier = async (req: Request, res: Response): Promise<void> => {
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

const deleteSupportTier = async (req: Request, res: Response): Promise<void> => {
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