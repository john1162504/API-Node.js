import Ajv from 'ajv';
const ajv = new Ajv({removeAdditional: 'all', strict: false});

ajv.addFormat("email", /^[\w\-\.]+@([\w\-]+\.)+[\w\-]{2,4}$/);
ajv.addFormat('password', /^.{6,}$/);
ajv.addFormat('binary', /.*/);
ajv.addFormat('integer', /^\d+$/)
ajv.addFormat('datetime', /^\d\d\d\d-\d\d?-\d\d? \d\d?:\d\d?:\d\d?$/)


const validate = async (schema: object, data: any) => {
    try {
        const validator = ajv.compile(schema);
        const valid = await validator(data);
        if(!valid)
            return ajv.errorsText(validator.errors);
        return true;
    } catch (err) {
        return err.message;
    }
}


export {validate}