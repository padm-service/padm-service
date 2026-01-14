import createApp from "@/lib/create-app";
import assistants from "@/routes/assistants";
import files from "@/routes/files";
import iam from "@/routes/iam";
import keys from "@/routes/keys";
import services from "@/routes/services";
import colletions from "@/routes/document"
import users from "@/routes/users"
import admin from "@/routes/admin"
import bills from "@/routes/bills"
import { consume } from "./lib/receive";
const app = createApp();

const routes = [
  iam,
  keys,
  assistants,
  services,
  files,
  colletions,
  users,
  admin,
  bills
] as const;

routes.forEach((route) => {
  app.route("/", route);
});

consume();
export type AppType = typeof routes[number];

export default app;
