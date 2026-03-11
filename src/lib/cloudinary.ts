import { Readable } from "node:stream";
import {
  v2 as cloudinary,
  type UploadApiResponse,
} from "cloudinary";

let configured = false;

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured.");
  }

  return {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  };
}

function getCloudinary() {
  if (!configured) {
    cloudinary.config(getCloudinaryConfig());
    configured = true;
  }

  return cloudinary;
}

export function getPatientPhotoFolder(patientId: string, isDemo: boolean) {
  return `registros-dentales/${isDemo ? "demo" : "real"}/patients/${patientId}`;
}

export async function uploadPatientImage(params: {
  buffer: Buffer;
  patientId: string;
  isDemo: boolean;
  filename?: string;
}) {
  const service = getCloudinary();

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = service.uploader.upload_stream(
      {
        folder: getPatientPhotoFolder(params.patientId, params.isDemo),
        resource_type: "image",
        use_filename: Boolean(params.filename),
        filename_override: params.filename,
        unique_filename: true,
        overwrite: false,
        tags: [
          "patient-photo",
          params.isDemo ? "demo" : "real",
          `patient:${params.patientId}`,
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        resolve(result);
      },
    );

    Readable.from(params.buffer).pipe(stream);
  });
}

export async function deletePatientImage(publicId: string) {
  const service = getCloudinary();
  await service.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
}
