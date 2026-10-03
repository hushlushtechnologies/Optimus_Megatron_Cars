"use client";

export async function triggerDownloadFromUrl(url: string): Promise<{ error: string | null }> {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { error: body?.error ?? "Export failed. Please try again." };
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch?.[1] ?? "export";

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);

    return { error: null };
  } catch (error) {
    console.error("triggerDownloadFromUrl error:", error);
    return {
      error: "Export failed. Please check your connection and try again.",
    };
  }
}
