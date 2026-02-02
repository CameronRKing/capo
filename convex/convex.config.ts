import { defineApp } from "convex/server";
import presence from "@convex-dev/presence/convex.config.js";
import auth from "@convex-dev/auth/convex.config.js";

const app = defineApp();
app.use(presence);
app.use(auth);

export default app;
