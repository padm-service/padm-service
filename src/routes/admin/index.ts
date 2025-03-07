import db from "@/db";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import createApp from "@/lib/create-app";
import { User } from "@/db/schema";
import { eq } from "drizzle-orm";
const app = createApp();

app.get('/users', async (c) => {
    const users = await db.query.User.findMany(
        {
            columns: {
                secret: false,
            },
            where(fields, operators) {
                return operators.eq(fields.scope, 'user');
            },
        },
    );
    return c.json(users, HttpStatusCodes.OK);
});
app.put('/users', async (c) => {
    const init = await c.req.json();
    if (init.ids.length > 1) {
        await db.transaction(async (tx) => {
            for (const id of init.ids) {
                await tx.update(User)
                    .set(init.update)
                    .where(eq(User.id, id))
            }
        });
    }
    else {
        await db.update(User)
            .set(init.update)
            .where(eq(User.id, init.ids[0]))
    }
    const users = await db.query.User.findMany(
        {
            columns: {
                secret: false,
            },
            where(fields, operators) {
                return operators.eq(fields.scope, 'user');
            },
        },
    );
    return c.json(users, HttpStatusCodes.OK);
})

app.delete('/users/:id', async (c) => {
    const { id } = c.req.param();
    await db.delete(User).where(
        eq(User.id, id),
    );
    const users = await db.query.User.findMany(
        {
            columns: {
                secret: false,
            },
            where(fields, operators) {
                return operators.eq(fields.scope, 'user');
            },
        },
    );
    return c.json(users, HttpStatusCodes.OK);
})
export default app;