import { fs } from "mz";
import {getImageMimetype} from "../services/imageTools";
import Logger from '../../config/logger';
import { generate } from "rand-token";

const filepath = './storage/images/';

const readImage = async (fileName: string): Promise<[Buffer, string]> => {
    const image = await fs.readFile(filepath + fileName);
    const mimeType = getImageMimetype(fileName);
    return [image, mimeType];
}

const saveImage = async (image:any, fileExt: string): Promise<string> => {
    const filename = generate(32) + fileExt;

    try {
        await fs.writeFile(filepath + filename, image);
        return filename;
    } catch (err) {
        Logger.error(err);
        fs.unlink(filepath + filename).catch(err => Logger.error(err));
        throw err;
    }
}

const removeImage = async (filename: string): Promise<void> => {
    if(filename) {
        if (await fs.exists(filepath + filename)) {
            await fs.unlink(filepath + filename);
        }
    }
}

export {readImage, removeImage, saveImage};
