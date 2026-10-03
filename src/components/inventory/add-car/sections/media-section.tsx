"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { Divider } from "@/src/components/ui/divider";
import { ImageGallery } from "@/src/components/inventory/add-car/media/image-gallery";
import { VideoGallery } from "@/src/components/inventory/add-car/media/video-gallery";
import { EngineAudioGallery } from "@/src/components/inventory/add-car/media/engine-audio-gallery";
import type { CarMedia } from "@/src/lib/types/inventory";

interface MediaSectionProps {
  carId: string | null;
  initialMedia: CarMedia[];
}

export function MediaSection({ carId, initialMedia }: MediaSectionProps) {
  const [media, setMedia] = useState(initialMedia);

  const images = media.filter((m) => m.media_type === "image");
  const videos = media.filter((m) => m.media_type === "video");
  const audioClips = media.filter((m) => m.media_type === "audio");

  if (!carId) {
    return (
      <Card id="media" padding="lg" className="scroll-mt-24">
        <h2 className="text-h3">Media</h2>
        <div className="mt-6 flex flex-col items-center gap-2 py-8 text-center">
          <Lock className="text-text-subtle size-6" aria-hidden="true" />
          <p className="text-body-sm text-text-muted">
            Save Basic Information first to enable media uploads.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card id="media" padding="lg" className="scroll-mt-24">
      <h2 className="text-h3">Media</h2>
      <p className="text-body-sm text-text-muted mt-1 mb-6">
        Photos, videos, and engine sound — uploads save immediately.
      </p>

      <ImageGallery
        carId={carId}
        images={images}
        onImagesChange={(updater) =>
          setMedia((prev) =>
            updater(prev.filter((m) => m.media_type === "image")).concat(
              prev.filter((m) => m.media_type !== "image"),
            ),
          )
        }
      />

      <Divider className="my-6" />
      <VideoGallery
        carId={carId}
        videos={videos}
        onVideosChange={(updater) =>
          setMedia((prev) =>
            updater(prev.filter((m) => m.media_type === "video")).concat(
              prev.filter((m) => m.media_type !== "video"),
            ),
          )
        }
      />

      <Divider className="my-6" />
      <EngineAudioGallery
        carId={carId}
        audioClips={audioClips}
        onAudioChange={(updater) =>
          setMedia((prev) =>
            updater(prev.filter((m) => m.media_type === "audio")).concat(
              prev.filter((m) => m.media_type !== "audio"),
            ),
          )
        }
      />
    </Card>
  );
}
