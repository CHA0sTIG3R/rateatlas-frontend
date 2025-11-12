import type { Handler } from "@netlify/functions";

const BACKEND_BASE_URL =
    process.env.RATE_ATLAS_BACKEND_URL ??
    process.env.API_BASE_URL;

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": process.env.RATE_ATLAS_CORS_ORIGIN ?? "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

const TEXTUAL_TYPES = ["application/json", "text/", "application/javascript", "application/xml"];

export const handler: Handler = async event => {
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers: CORS_HEADERS };
    }

    if (!BACKEND_BASE_URL) {
        return {
            statusCode: 500,
            headers: {
                ...CORS_HEADERS,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: "RATE_ATLAS_BACKEND_URL env var is not configured." }),
        };
    }

    const pathSuffix = event.path.replace(/^\/\.netlify\/functions\/proxy/, "");
    const targetUrl = buildTargetUrl(BACKEND_BASE_URL, pathSuffix, event.rawQuery);

    const bodyBuffer = event.body
        ? event.isBase64Encoded
            ? Buffer.from(event.body, "base64")
            : Buffer.from(event.body)
        : undefined;

    try {
        const upstreamResponse = await fetch(targetUrl, {
            method: event.httpMethod,
            headers: sanitizeRequestHeaders(event.headers),
            body: shouldHaveBody(event.httpMethod) ? bodyBuffer : undefined,
        });

        const responseBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
        const contentTypeHeader = upstreamResponse.headers.get("content-type") ?? "";
        const isTextResponse = TEXTUAL_TYPES.some(type => contentTypeHeader.includes(type));

        const proxyResponseBody = isTextResponse
            ? responseBuffer.toString("utf8")
            : responseBuffer.toString("base64");

        return {
            statusCode: upstreamResponse.status,
            body: proxyResponseBody,
            headers: {
                ...CORS_HEADERS,
                ...sanitizeResponseHeaders(upstreamResponse.headers),
            },
            isBase64Encoded: !isTextResponse,
        };
    } catch (error) {
        const message =
            error instanceof Error
                ? `Proxy request failed: ${error.message}`
                : "Proxy request failed due to an unknown error.";

        return {
            statusCode: 502,
            headers: {
                ...CORS_HEADERS,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
        };
    }
};

function buildTargetUrl(base: string, pathSuffix: string, rawQuery: string | undefined): string {
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const normalizedSuffix = pathSuffix.startsWith("/") ? pathSuffix.slice(1) : pathSuffix;
    const joined = normalizedSuffix ? `${normalizedBase}/${normalizedSuffix}` : normalizedBase;
    return rawQuery ? `${joined}?${rawQuery}` : joined;
}

function shouldHaveBody(method: string): boolean {
    return !["GET", "HEAD"].includes(method.toUpperCase());
}

function sanitizeRequestHeaders(headers: Record<string, string | undefined> = {}): Record<string, string> {
    const BLOCKED = new Set(["connection", "host", "content-length"]);
    return Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
        if (!value) return acc;
        const normalizedKey = key.toLowerCase();
        if (BLOCKED.has(normalizedKey)) return acc;
        acc[key] = value;
        return acc;
    }, {});
}

function sanitizeResponseHeaders(headers: Headers): Record<string, string> {
    const BLOCKED = new Set(["content-length"]);
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
        if (BLOCKED.has(key.toLowerCase())) return;
        result[key] = value;
    });
    return result;
}
