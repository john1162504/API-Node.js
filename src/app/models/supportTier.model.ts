import {getPool} from "../../config/db";
import Logger from '../../config/logger';
import { ResultSetHeader } from "mysql2";

const insertSupportTier = async (petitionId: number, title: string, description: string, cost: number): Promise<ResultSetHeader> => {
    const query = `INSERT INTO support_tier (petition_id, title, description, cost) VALUES(?,?,?,?)`;
    const [result] = await getPool().query(query, [petitionId, title, description, cost]);
    return result;
}

const getExistingTitles = async (petitionId: string): Promise<string[]> => {
    const query = `SELECT title FROM support_tier WHERE petition_id = ${petitionId}`;
    const rows = await getPool().query(query);
    const data = rows[0];
    const titles: string[] = data.map((obj: { title: string; }) => obj.title);
    return titles;
}


export {getExistingTitles, insertSupportTier};