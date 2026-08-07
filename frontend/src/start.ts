import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";
import { isRedirect } from "@tanstack/react-router";
import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error: any) {
    if (
      isRedirect(error) ||
      (error != null &&
        typeof error === "object" &&
        ("statusCode" in error || "status" in error || "isRedirect" in error || "to" in error || "href" in error))
    ) {
      throw error;
    }
    console.error("Server Error Middleware Caught:", error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
