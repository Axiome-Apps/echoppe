import { treaty } from "@elysiajs/eden";
import type { App } from "@echoppe/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7532";

export const api = treaty<App>(API_URL, {
  fetch: {
    credentials: "include",
  },
});

export type { App };
