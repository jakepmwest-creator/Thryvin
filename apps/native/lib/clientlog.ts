// apps/native/lib/clientLog.ts
export default async function clientLog(tag: string, data?: unknown) {
  try {
    await fetch("/api/_client-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tag, data }),
    });
  } catch (e) {
    // If network fails, still see something locally
    console.log("[CLIENT_LOG_FALLBACK]", tag, data);
  }
}
