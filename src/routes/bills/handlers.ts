import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import type { Bills } from "@/db/schema";
import type { AppRouteHandler, User } from "@/lib/types";
import db from "@/db";
import env from "@/env";
import type { GetRoute} from "./routes"

export const get: AppRouteHandler<GetRoute> = async (c) => {
  const {userId}= c.req.valid("param");
  //console.log(userId)
  const bills = await db.query.Bill.findMany({
    where(fields, operators) {
      return operators.eq(fields.userId, userId);
    },
  },
  );
  
  return c.json(bills);
};