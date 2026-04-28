async function handler(req: Request): Promise<Response> {
  const TARGET_DOMAIN = Deno.env.get("TARGET_DOMAIN");
  if (!TARGET_DOMAIN) {
    return new Response("TARGET_DOMAIN not set", { status: 500 });
  }

  const url = new URL(req.url);
  const targetUrl = TARGET_DOMAIN + url.pathname + url.search;

  const headers = new Headers(req.headers);

  // حذف hop-by-hop headers
  headers.delete("host");
  headers.delete("connection");
  headers.delete("keep-alive");
  headers.delete("proxy-authenticate");
  headers.delete("proxy-authorization");
  headers.delete("te");
  headers.delete("trailers");
  headers.delete("transfer-encoding");
  headers.delete("upgrade");

  // مهم: preserve client IP
  const clientIp = req.headers.get("x-forwarded-for");
  if (clientIp) {
    headers.set("x-forwarded-for", clientIp);
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.body,
      redirect: "manual",
      // مهم برای streaming
      duplex: "half",
    });

    return upstream;
  } catch (e) {
    return new Response("Relay error: " + e.message, { status: 502 });
  }
}

Deno.serve(handler);
