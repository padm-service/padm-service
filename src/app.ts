import createApp from "@/lib/create-app";
import assistants from "@/routes/assistants";
import files from "@/routes/files";
import iam from "@/routes/iam";
import keys from "@/routes/keys";
import services from "@/routes/services";

const app = createApp();

const routes = [
  iam,
  keys,
  assistants,
  services,
  files,
] as const;

routes.forEach((route) => {
  app.route("/", route);
});

export type AppType = typeof routes[number];

export default app;
