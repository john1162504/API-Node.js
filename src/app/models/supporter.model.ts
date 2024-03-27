import {getPool} from "../../config/db";
import Logger from '../../config/logger';
import { ResultSetHeader } from "mysql2";

const getSupportTierByPetitionId = async (petitionId: string): Promise<ResultSetHeader> => {
    const query = `
    SELECT
        S.id AS supportId,
        support_tier_id as supportTierId,
        message,
        user_id AS supporterId,
        U.first_name as supporterFirstName,
        U.last_name as supporterLastName,
        timestamp
    FROM
        supporter S
    JOIN
        user U ON S.user_id = U.id
    JOIN
        support_tier ST ON S.support_tier_id = ST.id
    WHERE
        ST.petition_id = ?
    ORDER BY
        timestamp DSC
    `;
    const [result] = await getPool().query(query, petitionId);
    return result;
}

const getSupportingTiers = async (userId: string): Promise<string[]> => {
    const query = `SELECT support_tier_id FROM supporter where user_id = ?`;
    const rows = await getPool().query(query, userId);
    const data = rows[0];
    const ids: string[] = data.map((obj: { id: string; }) => String(obj.id));
    return ids;
}

const addSupporter = async (petitionId: string, tierId: string, userId: string, message: string, timeStamp: string): Promise<boolean> => {
    const query = `INSERT INTO supporter (petition_id, support_tier_id, user_id, message, timestamp) VALUES(?,?,?,?,?)`;
    const [result] = await getPool().query(query, [petitionId, tierId, userId, message, timeStamp]);
    return result && result.affectedRows === 1;
}

export {getSupportTierByPetitionId, getSupportingTiers, addSupporter}