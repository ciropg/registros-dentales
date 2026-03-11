import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function buildDownloadFilename(originalFilename: string | null, format: string | null) {
  const fallback = `patient-photo.${format ?? "jpg"}`;
  const filename = (originalFilename ?? fallback).trim() || fallback;

  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const user = await getCurrentUser();

  if (!user || !user.active) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id, photoId } = await params;

  const photo = await prisma.patientPhoto.findFirst({
    where: {
      id: photoId,
      patientId: id,
      isDemo: user.isDemo,
    },
    select: {
      secureUrl: true,
      originalFilename: true,
      format: true,
    },
  });

  if (!photo) {
    return new Response("Not found", { status: 404 });
  }

  const upstream = await fetch(photo.secureUrl, {
    cache: "no-store",
  });

  if (upstream.status === 404) {
    return new Response("Not found", { status: 404 });
  }

  if (!upstream.ok) {
    return new Response("Unable to download image", { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? `image/${photo.format ?? "jpeg"}`;
  const arrayBuffer = await upstream.arrayBuffer();

  return new Response(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${buildDownloadFilename(photo.originalFilename, photo.format)}"`,
      "Content-Length": String(arrayBuffer.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
