export type FleetRouteInterStageMovement = {
  fleetNo: string;
  routeName: string;
  routeId: string;
  currentStage: string;
  currentStageId: string;
  nextStage: string;
  nextStageId: string;
};

export type GPSSesorData = {
  latitude: number;
  longitude: number;
  fleetNo: string;
};
