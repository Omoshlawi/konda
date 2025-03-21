export type FleetRouteInterStageMovement = {
  fleetNo: string;
  routeName: string;
  routeId: string;
  currentStage: string;
  currentStageId: string;
  nextStage?: string;
  nextStageId?: string;
  pastCurrentStageButNotNextStage: boolean;
};

export type GPSSesorData = {
  latitude: number;
  longitude: number;
  fleetNo: string;
};
