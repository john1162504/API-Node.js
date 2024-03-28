import { ResultSetHeader } from "mysql2";
import {getPool} from "../../config/db";
import Logger from '../../config/logger';

async function checkEmailExist(email: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
        const conn = await getPool().getConnection();
        const query = 'SELECT COUNT(*) AS count FROM user WHERE email = ?';
        const [ result ] = await conn.query(query, [ email ]);
        const count = result[0].count;
        await conn.release();
        resolve(parseInt(count, 10) > 0);
    })
}

const insert = async (firstName: string, lastName: string, email: string, password: string): Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = `INSERT INTO user (first_name, last_name, email, password)
                    VALUES( ?, ?, ?, ? )`;
    const [ result ] = await conn.query(query, [ firstName, lastName, email, password]);
    await conn.release();
    return result;
}

const insertToken = async (token: string, id: number): Promise<ResultSetHeader> => {
    Logger.info(`Inserting token to user: ${id}`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET auth_token = ? WHERE id = ?'
    const [ result ] = await conn.query(query, [token, id]);
    await conn.release();
    return result;
}

const findUserByColAttribute = async (param: string, col: string): Promise<User[]> => {
    Logger.info(`Getting user with ${col}: ${param}`);
    const conn = await getPool().getConnection();
    const query = `SELECT * FROM user WHERE ${col} = ?`;
    const [ result ] = await conn.query(query, [ param ]);
    await conn.release();
    return result;
}

const updateUserByColAttribute = async (param: string, col: string, id: string): Promise<void> => {
    Logger.info(`Updating user: ${id} with ${col}: ${param}`);
    const conn = await getPool().getConnection();
    const query = `UPDATE user SET ${col} = ? WHERE id = ?`;
    const [ result ] = await conn.query(query, [ param, id ]);
    await conn.release();
    return result;
}

export { checkEmailExist, insert, findUserByColAttribute, insertToken, updateUserByColAttribute };