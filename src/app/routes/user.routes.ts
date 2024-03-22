import {Express} from "express";
import {rootUrl} from "./base.routes";
import * as user from '../controllers/user.controller';
import * as userImages from '../controllers/user.image.controller';
import {loginRequired} from "../middleware/authenticate";

module.exports = (app: Express) => {
    app.route(rootUrl+'/users/register')
        .post(user.register);

    app.route(rootUrl+'/users/login')
        .post(user.login);

    app.route(rootUrl+'/users/logout')
        .post(loginRequired, user.logout);

    app.route(rootUrl+'/users/:id')
        .get(loginRequired, user.view)
        .patch(loginRequired, user.update);

    app.route(rootUrl+'/users/:id/image')
        .get(loginRequired, userImages.getImage)
        .put(loginRequired,userImages.setImage)
        .delete(loginRequired, userImages.deleteImage)
}