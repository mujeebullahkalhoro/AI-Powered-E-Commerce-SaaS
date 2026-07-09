export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_SIZE_LABEL = "10 MB";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateImageFiles(files: File[]): string | null {
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return `"${file.name}" is not supported. Use JPEG, PNG, or WebP.`;
    }
  }

  return null;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Could not read "${file.name}"`));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

async function compressImage(
  file: File,
  maxBytes: number,
): Promise<File> {
  const image = await loadImage(file);
  const maxDimension = 2048;
  let { width, height } = image;

  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare image for upload");
  }

  context.drawImage(image, 0, 0, width, height);

  let quality = 0.92;
  let blob = await canvasToBlob(canvas, "image/jpeg", quality);

  while (blob && blob.size > maxBytes && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
  }

  if (!blob) {
    throw new Error(`Could not compress "${file.name}"`);
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export async function prepareImagesForUpload(files: File[]): Promise<File[]> {
  const validationError = validateImageFiles(files);

  if (validationError) {
    throw new Error(validationError);
  }

  const targetBytes = Math.floor(MAX_IMAGE_SIZE_BYTES * 0.9);
  const prepared: File[] = [];

  for (const file of files) {
    if (file.size <= targetBytes) {
      prepared.push(file);
      continue;
    }

    const compressed = await compressImage(file, targetBytes);

    if (compressed.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(
        `"${file.name}" is still too large after compression (${formatFileSize(compressed.size)}). Try a smaller image.`,
      );
    }

    prepared.push(compressed);
  }

  return prepared;
}
