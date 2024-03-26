import {getPool} from "../../config/db";
import Logger from '../../config/logger';
import { ResultSetHeader } from "mysql2";

const viewAll = async (searchQuery: petitionSearchQuery): Promise<petitionReturn> => {
    let query =
    `SELECT
        P.id AS petitionId,
        P.title AS title,
        P.category_id AS categoryId,
        U.id AS ownerId,
        U.first_name AS ownerFirstName,
        U.last_name AS ownerLastName,
        COALESCE(S.supporters_count, 0) AS numberOfSupporters,
        P.creation_date AS creationDate,
        min_cost.supportTierCost AS supportingCost
        FROM
            petition P
        INNER JOIN
            user U ON P.owner_id = U.id
        LEFT JOIN
            (SELECT petition_id, COUNT(*) AS supporters_count FROM supporter GROUP BY petition_id) S ON P.id = S.petition_id
        `;
    let countQuery =
    `SELECT
        COUNT(P.id)
    FROM
        petition P
    JOIN
        user U on P.owner_id = U.id
    `;

    const whereConditions = [];
    const values = [];

    if (searchQuery.supportingCost === -1) {
        const  costClause = `
        LEFT JOIN
            (SELECT petition_id, MIN(cost) AS supportTierCost FROM support_tier GROUP BY petition_id) min_cost ON P.id = min_cost.petition_id
        WHERE
            supportTierCost IS NOT NULL
        `;
        query += costClause;
        countQuery += costClause;
    } else {
        const costClause = `
        LEFT JOIN
            (SELECT petition_id, MIN(cost) AS supportTierCost FROM support_tier WHERE cost <= ${searchQuery.supportingCost} GROUP BY petition_id) min_cost ON P.id = min_cost.petition_id
        WHERE
            supportTierCost IS NOT NULL
        `;
        query += costClause;
        countQuery += costClause;
    }

    if (searchQuery.categoryIds && searchQuery.categoryIds.length) {
        whereConditions.push('category_id in (?)');
        values.push(searchQuery.categoryIds);
    }

    if (searchQuery.ownerId !== -1) {
        whereConditions.push('owner_id = ?');
        values.push(searchQuery.ownerId);
    }

    if (searchQuery.supporterId !== -1) {
        whereConditions.push('P.id IN (SELECT petition_id FROM supporter WHERE user_id = ?)');
        values.push(searchQuery.supporterId);
    }

    if(searchQuery.q !== '') {
        whereConditions.push(`(title LIKE ? OR description LIKE ?)`);
        values.push(`%${searchQuery.q}%`);
        values.push(`%${searchQuery.q}%`);

    }

    if (whereConditions.length) {
        query += `AND\n${whereConditions.join('\nAND\n')}\n`;
        countQuery += `AND\n${whereConditions.join('\nAND\n')}`;
    }

    const countValues = [...values];

    const searchSwitch = (sort: string) => ({
        'ALPHABETICAL_ASC': `ORDER BY title ASC, petitionId ASC\n`,
        'ALPHABETICAL_DESC': `ORDER BY title DESC, petitionId ASC\n`,
        'COST_ASC': `ORDER BY supportingCost ASC, petitionId ASC\n`,
        'COST_DESC': `ORDER BY supportingCost DESC, petitionId ASC\n`,
        'CREATED_ASC': `ORDER BY creationDate ASC, petitionId ASC\n`,
        'CREATED_DESC': `ORDER BY creationDate DESC, petitionId ASC\n`
    })[sort];

    query += searchSwitch(searchQuery.sortBy);

    if (searchQuery.count !== -1) {
        query += 'LIMIT ?\n';
        values.push(searchQuery.count);
    }

    if (searchQuery.startIndex !== 0) {
        query += 'OFFSET ?\n';
        values.push(searchQuery.startIndex);
    }

    const rows = await getPool().query(query, values);
    const petitions = rows[0];
    const countRows = await getPool().query(countQuery, countValues);
    const count = Object.values(JSON.parse(JSON.stringify(countRows[0][0])))[0];

    return {petitions,count} as petitionReturn;
}

const getOne = async (id: string): Promise<petition> => {
    const petitionQuery =
    `SELECT
        P.id AS petitionId,
        P.title AS title,
        P.category_id AS categoryId,
        U.id AS ownerId,
        U.first_name AS ownerFirstName,
        U.last_name AS ownerLastName,
        P.creation_date as creationDate,
        P.description as description
    FROM
        petition P
    INNER JOIN
        user U ON P.owner_id = U.id
    WHERE
    P.id = ${id}`;
    const [rows] = await getPool().query(petitionQuery);
    const petition = rows[0];

    const moneyRasiedQuery =
    `SELECT
	    SUM(ST.cost) as moneyRasied
    FROM
        supporter S
    JOIN
        support_tier ST ON S.support_tier_id = ST.id
    JOIN
        petition P ON ST.petition_id = P.id
    WHERE
        S.petition_id = ${id}`;
    const [moneyRows] = await getPool().query(moneyRasiedQuery);
    const moneyRasied = moneyRows[0].moneyRasied;

    const supportTierQuery =
    `SELECT
        ST.title as title,
        ST.description as description,
        ST.cost as cost,
        ST.id as supportTierId
    FROM
        support_tier ST
    JOIN
        petition P ON ST.petition_id = P.id
    WHERE
        ST.petition_id = ${id}
        `
    const [tiersRows] = await getPool().query(supportTierQuery);
    const supportTier = tiersRows;
    petition.moneyRasied = moneyRasied;
    petition.support_tier = supportTier;
    return petition;
}

const getCategoryIds = async (): Promise<string[]> => {
    const query = 'SELECT id FROM category'
    const rows = await getPool().query(query);
    const data = rows[0];
    const validCategories: string[] = data.map((obj: { id: string; }) => obj.id);
    return validCategories;
}

const getPetitionIds = async (): Promise<string[]> => {
    const query = 'SELECT id FROM petition'
    const rows = await getPool().query(query);
    const data = rows[0];
    const validPetitions: string[] = data.map((obj: { id: string; }) => String(obj.id));
    return validPetitions;
}

const getPetitionTitles = async (): Promise<string[]> => {
    const query = 'SELECT title FROM petition'
    const rows = await getPool().query(query);
    const data = rows[0];
    const titles: string[] = data.map((obj: { title: string; }) => obj.title);
    return titles;
}

const addPetition = async (title: string, description: string, date: string, owner: string, category: number): Promise<ResultSetHeader> => {
    const query = `INSERT INTO petition (title, description, creation_date, owner_id, category_id) VALUES(?,?,?,?,?)`;
    const [result] = await getPool().query(query, [title, description, date, owner, category]);
    return result;
}

const getPetitionOwnerId = async (petitionId: string): Promise<number> => {
    const query = `SELECT owner_id FROM petition WHERE id = ${petitionId}`;
    const rows = await getPool().query(query);
    return rows[0].length === 0 ? null : rows[0][0].owner_id;
}

const editPetition = async (petitionId: string, title: string, description: string, categoryId: number): Promise<boolean> => {
    const query = `UPDATE petition SET title = ?, description = ?, category_id = ? WHERE id = ?`;
    const [result] = await getPool().query(query, [title, description, categoryId, petitionId]);
    return result && result.affectedRows === 1;
}

const deletePetition = async (petitionId: string): Promise<boolean> => {
    const query = `DELETE FROM petition WHERE id = ?`;
    const [result] = await getPool().query(query, petitionId);
    return result && result.affectedRows === 1;
}

const getCategories = async(): Promise<category[]> => {
    const query = `SELECT id as categoryId, name FROM category`;
    const rows = await getPool().query(query);
    const categories = rows[0];
    return categories;
}

export {viewAll, getOne, getCategoryIds, getPetitionIds, getPetitionTitles, addPetition, getPetitionOwnerId, editPetition, deletePetition, getCategories}