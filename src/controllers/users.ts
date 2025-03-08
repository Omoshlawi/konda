import { UsersModel } from "@/models";
import { UserFilterSchema } from "@/schema";
import { getMultipleOperationCustomRepresentationQeury } from "@/utils/db";
import { APIException } from "@/utils/exceptions";
import { Request, Response, NextFunction } from "express";

export const getUserByToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await UsersModel.findUnique({
      where: { id: req.user?.id },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(user);
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = UserFilterSchema.safeParse(req.query);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const { search } = validation.data;
    // TODO uncoment mode when in postresql
    const results = await UsersModel.findMany({
      where: {
        AND: [
          { voided: false },
          {
            OR: search
              ? [
                  {
                    username: {
                      contains: search,
                      //  mode: "insensitive"
                    },
                  },
                  {
                    person: {
                      email: {
                        contains: search,
                        //  mode: "insensitive"
                      },
                    },
                  },
                  {
                    person: {
                      phoneNumber: {
                        contains: search,
                        // mode: "insensitive"
                      },
                    },
                  },
                  {
                    person: {
                      firstName: {
                        contains: search,
                        //  mode: "insensitive"
                      },
                    },
                  },
                  {
                    person: {
                      lastName: {
                        contains: search,
                        //  mode: "insensitive"
                      },
                    },
                  },
                  {
                    person: {
                      surname: {
                        contains: search,
                        //  mode: "insensitive"
                      },
                    },
                  },
                ]
              : undefined,
          },
        ],
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json({ results });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await UsersModel.findUniqueOrThrow({
      where: { id: req.params.userId, voided: false },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};
