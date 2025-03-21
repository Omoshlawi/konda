import { point, distance } from "@turf/turf";

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
