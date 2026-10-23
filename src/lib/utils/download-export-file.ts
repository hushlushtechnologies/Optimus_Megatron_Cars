export interface DownloadResult {
  error: string | null;
  /** Rows in the file, and how many matched before any cap. null when unknown. */
  count: number | null;
  total: number | null;
  truncated: boolean;
}

function filenameFrom(header: string | null): string | null {
  const match = header?.match(/filename="([^"]+)"/);
  return match ? match[1] : null;
}

function headerNumber(response: Response, name: string): number | null {
  const value = Number(response.headers.get(name));
  return Number.isFinite(value) && response.headers.has(name) ? value : null;
}

/** Fetches a file from our own server and hands it to the browser as a download. */
export async function downloadExportFile(url: string): Promise<DownloadResult> {
  const fail = (error: string): DownloadResult => ({ error, count: null, total: null, truncated: false });

  let response: Response;
  try {
    response = await fetch(url, { credentials: "same-origin" });
  } catch {
    return fail("Couldn't reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    let message = "The export couldn't be created. Please try again.";
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body.error === "string") message = body.error;
    } catch {
      // keep the generic message
    }
    return fail(message);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filenameFrom(response.headers.get("Content-Disposition")) ?? "omc-test-drives";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);

  return {
    error: null,
    count: headerNumber(response, "X-Export-Count"),
    total: headerNumber(response, "X-Export-Total"),
    truncated: response.headers.get("X-Export-Truncated") === "true",
  };
}
