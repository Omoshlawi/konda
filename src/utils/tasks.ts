import logger from "@/services/logger";
import { Request } from "express";

function getRollBackTasks(req: Request): (() => Promise<string>)[] {
  if (!(req as any).rollBackTasks) {
    (req as any).rollBackTasks = [];
  }
  return (req as any).rollBackTasks;
}

export const addRollBackTaskToQueue = async (
  req: Request,
  task: () => Promise<string>
) => {
  const currTasks = getRollBackTasks(req);
  currTasks.push(task);
};

export const executeRollBackTasks = async (req: Request) => {
  const currTasks = getRollBackTasks(req);
  const results = await Promise.allSettled(currTasks.map((task) => task()));
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      logger.error(`Rollback task ${index} failed:${result.reason}`);
    } else {
      logger.info(`${result.value}`);
    }
  });
};
