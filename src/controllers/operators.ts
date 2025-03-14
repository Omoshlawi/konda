import { NextFunction, Request, Response } from "express";
import { OperatorsModel } from "../models";
import { OperatorSchema } from "@/schema";
import { getMultipleOperationCustomRepresentationQeury } from "@/utils/db";
import { APIException } from "@/utils/exceptions";

export const getOperators = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const results = await OperatorsModel.findMany({
      where: { voided: false },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json({ results });
  } catch (error) {
    next(error);
  }
};

export const getOperator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await OperatorsModel.findUniqueOrThrow({
      where: { id: req.params.operatorId, voided: false },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const addOperator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await OperatorSchema.safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await OperatorsModel.create({
      data: validation.data,
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const updateOperator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await OperatorSchema.safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await OperatorsModel.update({
      where: { id: req.params.operatorId, voided: false },
      data: validation.data,
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const patchOperator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await OperatorSchema.partial().safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await OperatorsModel.update({
      where: { id: req.params.operatorId, voided: false },
      data: validation.data,
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteOperator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await OperatorsModel.update({
      where: { id: req.params.operatorId, voided: false },
      data: {
        voided: true,
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const purgeOperator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await OperatorsModel.delete({
      where: { id: req.params.operatorId, voided: false },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};
