import createApp from "@/lib/create-app";
import assistant from "@/routes/assistants";
import user from "@/routes/iam";
import index from "@/routes/index.route";
import key from "@/routes/keys";
import services from "@/routes/services";
import tasks from "@/routes/tasks";

const app = createApp();

const routes = [
  index,
  tasks,
  user,
  key,
  assistant,
  services,
] as const;

routes.forEach((route) => {
  app.route("/", route);
});

export type AppType = typeof routes[number];

export default app;
