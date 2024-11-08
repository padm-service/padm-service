import argon2 from "argon2";
import { and, eq } from "drizzle-orm";
import { Jwt } from "hono/utils/jwt";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { User } from "@/db/schema/user";
import env from "@/env";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";
import { omit } from "@/lib/omit-object";
import { DAY } from "@/lib/time";

import type { LoginRoute, RegisterRoute } from "./iam.routes";

export const register: AppRouteHandler<RegisterRoute> = async (c) => {
  const user = c.req.valid("json");
  user.secret = await argon2.hash(user.secret);
  const users = await db.query.User.findFirst({
    where(fields, operators) {
      return operators.eq(fields.email, user.email);
    },
  });
  if (users) {
    return c.json(
      {
        message: HttpStatusPhrases.CONFLICT,
      },
      HttpStatusCodes.CONFLICT,
    );
  }
  else {
    await db.insert(User).values(user);
    return c.json(HttpStatusCodes.OK);
  }
};

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  const init = c.req.valid("json");
  const user = await db.query.User.findFirst(
    {
      columns: {
        id: true,
        level: true,
        secret: true,
        scope: true,
      },
      where(fields, operators) {
        return operators.eq(fields.email, init.email);
      },
    },
  );

  if (!user || !await argon2.verify(user.secret, init.secret)) {
    return c.json(
      {
        message: HttpStatusPhrases.UNAUTHORIZED,
      },
      HttpStatusCodes.UNAUTHORIZED,
    );
  }
  else {
    const expiry = Date.now() + 7 * DAY;
    const access_token = await Jwt.sign(
      {
        iss: "halo.dev",
        exp: Math.floor(expiry / 1000),
        user: omit(user, ["secret"]),
      },
      env.TOKEN_SECRET!,
    );
    return c.json({
      access_token,
      expiry,
    }, HttpStatusCodes.OK);
  }
};
