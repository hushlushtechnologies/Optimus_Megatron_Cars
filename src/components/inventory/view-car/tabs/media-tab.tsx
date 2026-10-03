import { CarFront, VideoOff, Music } from "lucide-react";
import type { CarMedia } from "@/src/lib/types/inventory";

export function MediaTab({ media }: { media: CarMedia[] }) {
  const images = media.filter((m) => m.media_type === "image");
  const videos = media.filter((m) => m.media_type === "video");
  const audioClips = media.filter((m) => m.media_type === "audio");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-label mb-3">Images ({images.length})</p>
        {images.length === 0 ? (
          <p className="text-body-sm text-text-muted flex items-center gap-2">
            <CarFront className="size-4" aria-hidden="true" /> No images uploaded.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="border-border relative aspect-square overflow-hidden rounded-lg border"
              >
                <img src={img.url} alt="" className="size-full object-cover" />
                {img.is_featured && (
                  <span className="bg-primary absolute top-1.5 left-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold text-[#0b1220]">
                    Featured
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-label mb-3">Videos ({videos.length})</p>
        {videos.length === 0 ? (
          <p className="text-body-sm text-text-muted flex items-center gap-2">
            <VideoOff className="size-4" aria-hidden="true" /> No videos uploaded.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {videos.map((v) => (
              <div key={v.id} className="surface-card flex items-center gap-3 p-3">
                <video src={v.url} controls className="aspect-video w-48 rounded-md bg-black" />
                <div>
                  <p className="text-body-sm text-text-primary">{v.title ?? "Untitled"}</p>
                  <p className="text-caption">{v.subtype}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-label mb-3">Engine Sound Experience ({audioClips.length})</p>
        {audioClips.length === 0 ? (
          <p className="text-body-sm text-text-muted flex items-center gap-2">
            <Music className="size-4" aria-hidden="true" /> No audio uploaded.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {audioClips.map((a) => (
              <div key={a.id} className="surface-card flex items-center gap-3 p-3">
                <audio src={a.url} controls className="w-56" />
                <div>
                  <p className="text-body-sm text-text-primary">{a.title ?? "Untitled"}</p>
                  <p className="text-caption">{a.subtype}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
