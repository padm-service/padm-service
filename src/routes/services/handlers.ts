import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { Node, Service } from "@/db/schema";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";

import type { CreateRoute, GetRoute, ListRoute, NodeCreateRoute, NodeGetRoute, NodeListRoute, NodePatchRoute, NodeRemoveRoute, PatchRoute, RemoveRoute } from "./routes";

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const auth = c.get("auth");
  const init = c.req.valid("json");
  const userId = auth.user.id;
  const [service] = await db.insert(Service).values({
    ...init,
    userId,
  }).returning();
  return c.json(service, HttpStatusCodes.OK);
};
export const get: AppRouteHandler<GetRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const service = await db.query.Service.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });
  if (!service) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }
  return c.json(service, HttpStatusCodes.OK);
};

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const auth = c.get("auth");
  const id = auth.user.id;
  const services = await db.query.Service.findMany({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  },
  );
  return c.json(services);
};

export const patch: AppRouteHandler<PatchRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const updates = c.req.valid("json");

  if (Object.keys(updates).length === 0) {
    return c.json(
      {
        success: false,
        error: {
          issues: [
            {
              code: ZOD_ERROR_CODES.INVALID_UPDATES,
              path: [],
              message: ZOD_ERROR_MESSAGES.NO_UPDATES,
            },
          ],
          name: "ZodError",
        },
      },
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
    );
  }

  const [service] = await db.update(Service)
    .set(updates)
    .where(eq(Service.id, id))
    .returning();

  if (!service) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(service, HttpStatusCodes.OK);
};
export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const result = await db.delete(Service)
    .where(eq(Service.id, id));
  if (result.rowsAffected === 0) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }
  return c.body(null, HttpStatusCodes.NO_CONTENT);
};

export const nodeCreate: AppRouteHandler<NodeCreateRoute> = async (c) => {
  const auth = c.get("auth");
  const init = c.req.valid("json");
  const userId = auth.user.id;
  const [node] = await db.insert(Node).values({
    ...init,
    userId,
  }).returning();
  return c.json(node, HttpStatusCodes.OK);
};

export const nodeGet: AppRouteHandler<NodeGetRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const node = await db.query.Node.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });
  if (!node) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }
  return c.json(node, HttpStatusCodes.OK);
};

export const nodeList: AppRouteHandler<NodeListRoute> = async (c) => {
  const auth = c.get("auth");
  const id = auth.user.id;
  const services = await db.query.Service.findMany({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  },
  );
  return c.json(services);
};
