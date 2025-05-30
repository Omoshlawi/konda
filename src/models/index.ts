import db from "@/services/db";

export const UsersModel = db.user;
export const PersonModel = db.person;
export const AccountModel = db.account;
export const VerificationTokensModel = db.verificationToken;
export const FleetsModel = db.fleet;
export const RoutesModel = db.route;
export const FleetRoutesModel = db.fleetRoute;
export const StagesModel = db.stage;
export const RouteStagesModel = db.routeStage;
export const RoutePricingsModel = db.routePricing;
export const TripsModel = db.trip;
export const OperatorsModel = db.operator;
export const CountiesModel = db.county;
export const SubCountiesModel = db.subCounty;
export const WardsModel = db.ward;
export const PassengersModel = db.passenger;
export const TocketsModel = db.ticket;
export const NotificationsModel = db.notification
