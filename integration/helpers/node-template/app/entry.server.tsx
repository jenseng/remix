import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
// file extension to work around https://github.com/facebook/react/issues/20235
import { renderToString } from "react-dom/server.js";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  let markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
