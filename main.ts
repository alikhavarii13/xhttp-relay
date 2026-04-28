async function handler(req: Request): Promise<Response> {
  const TARGET_DOMAIN = Deno.env.get("TARGET_DOMAIN");
  
  if (!TARGET_DOMAIN) {
    return new Response("TARGET_DOMAIN not set", { status: 500 });
  }

  const url = new URL(req.url);
  const targetUrl = TARGET_DOMAIN + url.pathname + url.search;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-proto");

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.body,
      duplex: "half",
      redirect: "manual"
    });
    return response;
  } catch (error) {
    return new Response(`Relay error: ${error.message}`, { status: 502 });
  }
}

Deno.serve(handler);