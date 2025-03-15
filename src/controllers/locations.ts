import { CountiesModel, SubCountiesModel, WardsModel } from "@/models";
import {
  CountyFilterSchema,
  SubCountyFilterSchema,
  WardFilterSchema,
} from "@/schema";
import { getMultipleOperationCustomRepresentationQeury } from "@/utils/db";
import { APIException } from "@/utils/exceptions";
import { Request, Response, NextFunction } from "express";
export const getCounties = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await CountyFilterSchema.safeParseAsync(req.query);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const { search, ...filters } = validation.data;
    const results = await CountiesModel.findMany({
      where: {
        AND: [
          { voided: false, ...filters },
          {
            OR: search
              ? [
                  {
                    name: {
                      contains: search,
                      //  mode: "insensitive"
                    },
                  },
                  {
                    code: {
                      contains: search,
                      // mode: "insensitive"
                    },
                  },
                  {
                    capital: {
                      contains: search,
                      //  mode: "insensitive"
                    },
                  },
                  {
                    subCounties: {
                      some: {
                        name: {
                          contains: search,
                          // mode: "insensitive"
                        },
                      },
                    },
                  },
                  {
                    wards: {
                      some: {
                        name: {
                          contains: search,
                          // mode: "insensitive"
                        },
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

export const getSubcounties = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await SubCountyFilterSchema.safeParseAsync(req.query);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const { search, county, ...filters } = validation.data;
    const results = await SubCountiesModel.findMany({
      where: {
        AND: [
          { voided: false, ...filters, county: { name: county } },
          {
            OR: search
              ? [
                  {
                    name: {
                      contains: search,
                      //  mode: "insensitive"
                    },
                  },
                  {
                    code: {
                      contains: search,
                      //  mode: "insensitive"
                    },
                  },
                  {
                    county: {
                      name: {
                        contains: county,
                        //  mode: "insensitive"
                      },
                    },
                  },
                  {
                    county: {
                      capital: {
                        contains: county,
                        // mode: "insensitive"
                      },
                    },
                  },
                  {
                    wards: {
                      some: {
                        name: {
                          contains: search,
                          //  mode: "insensitive"
                        },
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

export const getWards = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await WardFilterSchema.safeParseAsync(req.query);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const { search, county, subCounty, ...filters } = validation.data;
    const results = await WardsModel.findMany({
      where: {
        AND: [
          {
            voided: false,
            ...filters,
            county: { name: county },
            subCounty: { name: subCounty },
          },
          {
            OR: search
              ? [
                  {
                    name: {
                      contains: search,
                      //  mode: "insensitive"
                    },
                  },
                  {
                    code: {
                      contains: search,
                      //  mode: "insensitive"
                    },
                  },
                  {
                    county: {
                      name: {
                        contains: county,
                        //  mode: "insensitive"
                      },
                    },
                  },
                  {
                    county: {
                      capital: {
                        contains: county,
                        //  mode: "insensitive"
                      },
                    },
                  },
                  {
                    subCounty: {
                      name: {
                        contains: subCounty,
                        // mode: "insensitive"
                      },
                    },
                  },
                  {
                    subCounty: {
                      code: {
                        contains: subCounty,
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
