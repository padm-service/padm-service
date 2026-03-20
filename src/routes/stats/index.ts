import db from "@/db";
import { Servicelog,Monthtotal,Node } from "@/db/schema";
import createApp from "@/lib/create-app";
const app = createApp();
app.get('/stats/request/:start/:end', async (ctx) => {
  const { start, end } = ctx.req.param();  
  const starts = Number(start);
  const ends = Number(end);

  const res = await db.query.Servicelog.findMany({
    where(fields, operators) {
      return operators.and(
        operators.gte(fields.created_at, new Date(starts)),
        operators.lte(fields.created_at, new Date(ends))
      );
    },
    orderBy(fields, operators) {
      return [operators.asc(fields.created_at)];
    }
  });

  // 处理时间
  res.forEach(element => {
    if (element.created_at) {
      const date = new Date(element.created_at);
      element.created_at = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    }
  });
  // const response = {
  //   status: "OK",
  //   time: new Date().toISOString(),
  //   result: res
  // };
  // console.log(response)
  return ctx.json(res);
});
app.get('/stats/month/:month', async (ctx) => { 
    const { month } = ctx.req.param();
    const parsedMonth = parseInt(month, 10);

    const formattedMonth = parsedMonth.toString().padStart(2, '0');
    const currentYear = new Date().getFullYear();
    const time = `${currentYear}-${formattedMonth}`;

    const result = await db.query.Monthtotal.findMany({
      where: (fields, { eq }) => eq(fields.time, time),
      columns: { service_name: true, times: true },
    });
    // return ctx.json({
    //   status: "OK",
    //   result: result ?? []
    // });
    return ctx.json(result ?? []);
});
app.get('/services/:id/nodes',async(ctx)=>{
  const auth = ctx.get("auth");
  //console.log('node打印的：',ctx);
  const { id } = ctx.req.param();
  console.log('id:',id);
  const nodes = await db.query.Node.findMany({
    where: (fields,{eq}) =>eq(fields.serviceId,id)
  });
  return ctx.json(nodes);
});
export default app;