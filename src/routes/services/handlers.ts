import { and, eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { proxy } from 'hono/proxy'
import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { Node, Service } from "@/db/schema";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";

import type { CreateRoute, GetReadmeRoute, GetRoute, GetSchemaRoute, ListRoute, NodeCreateRoute, NodeGetRoute, NodeListRoute, NodePatchRoute, NodeRemoveRoute, PatchRoute, RemoveRoute } from "./routes";
import { toOpenaiTools } from "@/lib/tools";
import { Context } from "hono";
export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const auth = c.get("auth");
  const init = c.req.valid("json");
  const userId = auth.user.id;
  const [service] = await db.insert(Service).values({
    ...init,
    userId,
  }).returning();
  const tools = toOpenaiTools(service.id, init.schema as any);
  const [serviceTool] = await db.update(Service)
    .set({ tools })
    .where(eq(Service.id, service.id))
    .returning();
  return c.json(serviceTool, HttpStatusCodes.OK);
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
  const services = await db.query.Service.findMany({
    where(fields, operators) {
      return operators.eq(fields.userId, auth.user.id);
    },
  },
  );
  return c.json(services);
};

export const patch: AppRouteHandler<PatchRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const updates = c.req.valid("json");
  if (updates.schema) {
    updates.tools = toOpenaiTools(id, updates.schema);
  }
  // if (Object.keys(updates).length === 0) {
  //   return c.json(
  //     {
  //       success: false,
  //       error: {
  //         issues: [
  //           {
  //             code: ZOD_ERROR_CODES.INVALID_UPDATES,
  //             path: [],
  //             message: ZOD_ERROR_MESSAGES.NO_UPDATES,
  //           },
  //         ],
  //         name: "ZodError",
  //       },
  //     },
  //     HttpStatusCodes.UNPROCESSABLE_ENTITY,
  //   );
  // }

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
  const { id } = c.req.valid("param");
  const serviceId = id;
  const userId = auth.user.id;
  const [node] = await db.insert(Node).values({
    ...init,
    userId,
    serviceId,
  }).returning();
  return c.json(node, HttpStatusCodes.OK);
};

export const nodeGet: AppRouteHandler<NodeGetRoute> = async (c) => {
  const { serviceId, nodeId } = c.req.valid("param");
  const node = await db.query.Node.findFirst({
    where: (fields, operators) => operators.and(
      operators.eq(fields.serviceId, serviceId),
      operators.eq(fields.id, nodeId),
    ),
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
  const { id } = c.req.valid("param");
  const services = await db.query.Node.findMany({
    where(fields, operators) {
      return operators.eq(fields.serviceId, id);
    },
  },
  );
  return c.json(services);
};

export const nodePatch: AppRouteHandler<NodePatchRoute> = async (c) => {
  const { serviceId, nodeId } = c.req.valid("param");
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

  const [service] = await db.update(Node)
    .set(updates)
    .where(and(eq(Node.serviceId, serviceId), eq(Node.id, nodeId)))
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

export const nodeRemove: AppRouteHandler<NodeRemoveRoute> = async (c) => {
  const { serviceId, nodeId } = c.req.valid("param");
  const result = await db.delete(Node)
    .where(and(eq(Node.serviceId, serviceId), eq(Node.id, nodeId)));
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
export const getSchema: AppRouteHandler<GetSchemaRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const schema = await db.query.Service.findFirst({
    columns: {
      schema: true,
    },
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });
  return c.json(schema, HttpStatusCodes.OK);
};

export const getReadme: AppRouteHandler<GetReadmeRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const result = await db.query.Service.findFirst({
    columns: {
      readme: true,
    },
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });
  return c.text(result?.readme ?? "", HttpStatusCodes.OK);
};
export const allService: any = async (c: Context) => {
  const auth = c.get("auth");
  const { id } = c.req.param(); // 从ctx.params中获取id
  const userId = auth ? auth.user.id : null;
  const nodes = await db.query.Node.findMany({
    where(fields, operators) {
      return operators.eq(fields.serviceId, id);
    },
  });
  if (!nodes.length) {
    return c.json({ message: "There is no such service or the service has not yet registered a node" }, HttpStatusCodes.NOT_FOUND);
  }
  const runnodes = nodes.filter(item => item.state === 'run');
  if (!runnodes.length) {
    return c.json({ message: "There is no running node" }, HttpStatusCodes.NOT_FOUND);
  }
  const i = Math.floor(Math.random() * 10) % runnodes.length;
  const node = nodes[i];
  const url = `${node.url}${/\/fetch.*/.exec(c.req.url)![0].slice(6)}`;
  const ctype = c.req.raw.headers.get("content-type");
  const headers = new Headers({
    "content-type": ctype ?? "application/json",
  });
  return fetch(url, {
    method: c.req.raw.method,
    headers,
    body: c.req.raw.body ? await c.req.raw.text() : undefined,
  });
  // return proxy(url, {
  //   ...c.req,
  //   headers
  // })
  // return c.json(runnodes);
};