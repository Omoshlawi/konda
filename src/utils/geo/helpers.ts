import logger from "@/services/logger";
import { point, distance } from "@turf/turf";
import { RouteStage, Stage, TraversalDirection } from "dist/prisma";

export const isWithinRadius = (
  stageCoords: [lat: number, lng: number],
  currCoords: [lat: number, lng: number],
  radiusInMetres: number
): boolean => {
  const from = point(stageCoords);
  const to = point(currCoords);
  const d = distance(from, to, { units: "meters" }); // Calculate distance in meters
  return d <= radiusInMetres; // Check if it's within the given radius
};

export const getDistanceInMeteresBetweenTwoPoints = (
  point1: [lat: number, lng: number],
  point2: [lat: number, lng: number]
): number => {
  const from = point(point1);
  const to = point(point2);
  return distance(from, to, { units: "meters" });
};


export const findNextStage = (
  stages: (RouteStage & { stage: Stage })[],
  currentStageId: string,
  direction: TraversalDirection
) => {
  const currentStage = stages.find((stage) => stage.stageId === currentStageId);
  if (!currentStage) {
    logger.warn(`Current stage with ID ${currentStageId} not found.`);
    return null;
  }

  if (direction === "Forward") {
    // If we're moving forward and at the last stage
    if (currentStage.order === stages.length - 1) {
      // Return the previous stage (since we're about to reverse)
      return stages.find((stage) => stage.order === currentStage.order - 1);
    }
    // Otherwise return the next stage
    return stages.find((stage) => stage.order === currentStage.order + 1);
  } else if (direction === "Reverse") {
    // If we're moving backward and at the first stage
    if (currentStage.order === 0) {
      // Return the next stage (since we're about to go forward)
      return stages.find((stage) => stage.order === currentStage.order + 1);
    }
    // Otherwise return the previous stage
    return stages.find((stage) => stage.order === currentStage.order - 1);
  }

  logger.warn(`Invalid traversal direction: ${direction}`);
  return null;
};

export const findNextStageHybrid = (
  stages: (RouteStage & { stage: Stage })[],
  currentStageId: string,
  direction: TraversalDirection,
  currentLat: number,
  currentLng: number
) => {
  const currentStage = stages.find((stage) => stage.stageId === currentStageId);
  if (!currentStage) {
    logger.warn(`Current stage with ID ${currentStageId} not found.`);
    return null;
  }

  // Order-based lookup
  const orderNextStage =
    direction === "Forward"
      ? stages.find((stage) => stage.order === currentStage.order + 1)
      : stages.find((stage) => stage.order === currentStage.order - 1);

  // If we found the next stage by order, return it
  if (orderNextStage) return orderNextStage;

  // Fallback: Find the nearest stage
  let nearestStage = null;
  let minDistance = Infinity;
  for (const stage of stages) {
    const distance = getDistanceInMeteresBetweenTwoPoints(
      [currentLat, currentLng],
      [stage.stage.latitude.toNumber(), stage.stage.longitude.toNumber()]
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestStage = stage;
    }
  }

  return nearestStage;
};