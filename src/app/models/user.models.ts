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

const insert = async (firstName: string, lastName:
    string, email: string, password: string): Promise<ResultSetHeader> => {
    Logger.info(`inserting user
                first name: ${firstName}
                last name; ${lastName}
                email: ${email}
                password: ${password}`);
    const conn = await getPool().getConnection();
    const query = `INSERT INTO user (first_name, last_name, email, password)
                    VALUES( ?, ?, ?, ? )`;
    const [ result ] = await conn.query(query, [ firstName, lastName, email, password]);
    await conn.release();
    return result;
}

export { checkEmailExist, insert }