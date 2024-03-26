import {Express} from "express";
import {rootUrl} from "./base.routes";
import * as petition from '../controllers/petition.controller'
import * as petitionImage from '../controllers/petition.image.controller'
import * as supportTiers from "../controllers/petition.support_tier.controller";
import * as supporter from "../controllers/petition.supporter.controller";
import {loginRequired} from "../middleware/authenticate";


module.exports = (app: Express) => {
    app.route(rootUrl+'/petitions')
        .get(petition.getAllPetitions)
        .post(loginRequired, petition.addPetition);

    app.route(rootUrl+'/petitions/categories')
        .get(petition.getCategories);

    app.route(rootUrl+'/petitions/:id')
        .get(petition.getPetition)
        .patch(loginRequired, petition.editPetition)
        .delete(loginRequired, petition.deletePetition);

    app.route(rootUrl+'/petitions/:id/image')
        .get(petitionImage.getImage)
        .put(loginRequired, petitionImage.setImage);

    app.route(rootUrl+'/petitions/:id/supportTiers')
        .put(loginRequired, supportTiers.addSupportTier);

    app.route(rootUrl+'/petitions/:id/supportTiers/:tierId')
        .patch(loginRequired, supportTiers.editSupportTier)
        .delete(loginRequired, supportTiers.deleteSupportTier);

    app.route(rootUrl + '/petitions/:id/supporters')
        .get(supporter.getAllSupportersForPetition)
        .post(loginRequired, supporter.addSupporter);
}