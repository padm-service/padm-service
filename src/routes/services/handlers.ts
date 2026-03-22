import { and, eq, or } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { proxy } from 'hono/proxy'
import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { Node, Service,Servicelog,Monthtotal } from "@/db/schema";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";

import type { CreateRoute, GetReadmeRoute, GetRoute, GetSchemaRoute, ListRoute, NodeCreateRoute, NodeGetRoute, NodeListRoute, NodePatchRoute, NodeRemoveRoute, PatchRoute, RemoveRoute } from "./routes";
import { toOpenaiTools } from "@/lib/tools";
import { Context } from "hono";
export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const auth = c.get("auth");
  const init = c.req.valid("json");
  const userId = auth.user.id;
  // const clientApiKey = c.req.header('X-API-Key');
  // console.log('Received API Key:', clientApiKey);
  
  // if (!clientApiKey) {
  //   return c.json({ message: 'Unauthorized: No API Key provided' }, 401);
  // }
  // const config = c.get("config") || {};
  // const serverApiKey = config.apiKey || process.env.API_KEY;
  
  // if (!serverApiKey) {
  //   console.error('Server API Key not configured');
  //   return c.json({ message: 'Server configuration error' }, 500);
  // }
  
  // 验证 API Key
  // if (clientApiKey !== serverApiKey) {
  //   console.log('API Key mismatch:', {
  //     client: clientApiKey?.substring(0, 8) + '...',
  //     server: serverApiKey?.substring(0, 8) + '...'
  //   });
  //   return c.json({ message: 'Unauthorized: Invalid API Key' }, 401);
  // }
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
      return or(operators.eq(fields.userId, auth.user.id),operators.eq(fields.level, -1));
    },
  },
  );
  console.log(services);
  
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
  //console.log(auth);
  const { id } = c.req.param(); // 从ctx.params中获取id
  const userId = auth.user.id;
  const userName = await db.query.User.findFirst({
    columns: {
      name: true,
    },
    where(fields, operators) {
      return operators.eq(fields.id, userId);
    },
  });
  console.log('userName:', userName);
  //service?.schema.info.title
  const service_schema=await db.query.Service.findFirst({
        columns:{
           schema:true,
        },
        where(fields,operators){
          return operators.eq(fields.id,id)
        }
  });
  //console.log(service_schema?.schema?.info?.title);
  const service_name=service_schema?.schema?.info?.title;
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
  const node = runnodes[i]; 
  const url = `${node.url}${/\/fetch.*/.exec(c.req.url)![0].slice(6)}`;
  const ctype = c.req.raw.headers.get("content-type");
  const headers = new Headers({
    "content-type": ctype ?? "application/json",
  });
  console.log(url) 
  console.log(c.req.raw.headers)
    await db.insert(Servicelog).values({
      userId,
      //header:c.req.raw.headers,
      header:Object.fromEntries(c.req.raw.headers.entries()),
      method: c.req.raw.method,
      url,
      service_name,
      user_name: userName?.name,
    });
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const time = `${year}-${month}`;
    const existingRecord = await db.query.Monthtotal.findFirst({
    where: (fields, { eq, and }) => 
      and(
        eq(fields.service, id),
        eq(fields.time, time)
      ),
    });
    if (existingRecord) {
    const updated = await db
      .update(Monthtotal)
      .set({
        times: existingRecord.times! + 1,
        updated_at: now,
      })
      .where(
        and(
          eq(Monthtotal.service, id),
          eq(Monthtotal.time, time)
        )
      );
    //console.log('更新成功，当前次数:', updated[0].times);
    //return updated[0];
  } else {
    const created = await db
      .insert(Monthtotal)
      .values({
        service: id,
        service_name,
        time: time,
        times: 1,
        created_at: now,
        updated_at: now,
      });
    //console.log('创建成功，初始次数: 1');
    //return created[0];
  }
  //}  
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