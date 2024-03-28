import {getPool} from "../../config/db";
import Logger from '../../config/logger';
import { ResultSetHeader } from "mysql2";

const insertSupportTier = async (petitionId: string, title: string, description: string, cost: number): Promise<ResultSetHeader> => {
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

const getNumOfSupporter = async (supportTierId: string): Promise<number> => {
    const query = `SELECT COUNT(*) as numOfSupporter FROM supporter WHERE support_tier_id = ${supportTierId}`;
    const [result] = await getPool().query(query);
    return result[0].numOfSupporter;
}

const getValidSupportTierIds = async (petitionId: string): Promise<string[]> => {
    const query = `SELECT id FROM support_tier WHERE petition_id = ${petitionId}`;
    const rows = await getPool().query(query);
    const data = rows[0];
    const ids: string[] = data.map((obj: { id: string; }) => String(obj.id));
    return ids;
}

const editSupportTier = async (title: string, description: string, cost: number, supportTierId: string): Promise<boolean> => {
    const query = `UPDATE support_tier SET title = ?, description = ?, cost = ? WHERE id = ?`;
    const [result] = await getPool().query(query, [title, description, cost, supportTierId]);
    return result && result.affectedRows === 1;
}

const getSupportTierById = async (supportTierId: string): Promise<supportTier> => {
    const query = `SELECT title, description, cost  FROM support_tier WHERE id = ?`;
    const [rows] = await getPool().query(query, supportTierId);
    return rows[0];

}

const deleteSupportTier = async (supportTierId: string): Promise<boolean> => {
    const query = `DELETE FROM support_tier WHERE id = ?`;
    const [result] = await getPool().query(query, supportTierId);
    return result && result.affectedRows === 1;
}

export {getExistingTitles, insertSupportTier, getNumOfSupporter, editSupportTier, getValidSupportTierIds, getSupportTierById, deleteSupportTier};