import crypto from "crypto"


const hash = async (password: string): Promise<string> => {
    // Todo: update this to encrypt the password
    const hasher = crypto.createHash('sha256');
    hasher.update(password);
    return hasher.digest('hex');
}

const compare = async (password: string, comp: string): Promise<boolean> => {
    // Todo: (suggested) update this to compare the encrypted passwords
    const hasher = crypto.createHash('sha256');
    return (hasher.update(password).digest('hex') === comp)
}

export {hash, compare}