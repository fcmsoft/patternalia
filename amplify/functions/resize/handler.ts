import type { S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createRequire } from 'node:module';
import path from 'node:path';
import sharp from 'sharp';

const THUMBNAIL_SIZE = 200;
const PATTERNS_PREFIX = 'patterns/';
const THUMBNAILS_PREFIX = 'thumbnails/';
const SUPPORTED_IMAGES = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff', 'tif', 'avif']);

const s3 = new S3Client({});

export const handler: S3Handler = async (event) => {
  await Promise.allSettled(
    event.Records.filter((r) => decodeKey(r.s3.object.key).startsWith(PATTERNS_PREFIX)).map((r) =>
      processRecord(r.s3.bucket.name, decodeKey(r.s3.object.key)),
    ),
  );
};

function decodeKey(key: string): string {
  return decodeURIComponent(key.replace(/\+/g, ' '));
}

function toThumbnailKey(sourceKey: string): string {
  return sourceKey
    .replace(new RegExp(`^${PATTERNS_PREFIX}`), THUMBNAILS_PREFIX)
    .replace(/\.[^.]+$/, '.jpg');
}

function getExtension(key: string): string {
  return key.split('.').pop()?.toLowerCase() ?? '';
}

async function processRecord(bucket: string, key: string): Promise<void> {
  const thumbnailKey = toThumbnailKey(key);
  try {
    const buffer = await downloadFromS3(bucket, key);
    const ext = getExtension(key);
    const thumbnail = await createThumbnail(buffer, ext);
    await uploadToS3(bucket, thumbnailKey, thumbnail);
    console.log(`Thumbnail created: ${thumbnailKey}`);
  } catch (error) {
    console.error(`Failed to create thumbnail for ${key}:`, error);
    await uploadFallbackThumbnail(bucket, thumbnailKey);
  }
}

async function createThumbnail(buffer: Buffer, ext: string): Promise<Buffer> {
  if (ext === 'pdf') {
    return createPdfThumbnail(buffer);
  }
  if (SUPPORTED_IMAGES.has(ext)) {
    return createImageThumbnail(buffer);
  }
  return createDefaultThumbnail();
}

async function createPdfThumbnail(pdfBuffer: Buffer): Promise<Buffer> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const { createCanvas } = await import('@napi-rs/canvas');

  // In Node there is no real worker; pdfjs falls back to a "fake worker" it
  // loads via import(workerSrc), so this must point at the worker module.
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';

  // Lets pdfjs load the standard 14 fonts (Helvetica etc.) from disk for PDFs
  // that reference them without embedding.
  const require = createRequire(import.meta.url);
  const standardFontDataUrl = path.join(
    path.dirname(require.resolve('pdfjs-dist/package.json')),
    'standard_fonts/',
  );

  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    disableFontFace: true,
    useSystemFonts: false,
    standardFontDataUrl,
  }).promise;

  const page = await doc.getPage(1);
  const naturalViewport = page.getViewport({ scale: 1 });
  const scale = THUMBNAIL_SIZE / Math.max(naturalViewport.width, naturalViewport.height);
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));

  // pdfjs v6 takes the canvas itself (the canvasContext parameter is legacy
  // and requires a DOM context); it calls getContext('2d') internally.
  await page.render({
    canvas: canvas as unknown as HTMLCanvasElement,
    viewport,
  }).promise;

  const png = canvas.toBuffer('image/png');

  return sharp(png)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'inside' })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 85 })
    .toBuffer();
}

async function createImageThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 85 })
    .toBuffer();
}

async function createDefaultThumbnail(): Promise<Buffer> {
  return sharp({
    create: {
      width: THUMBNAIL_SIZE,
      height: THUMBNAIL_SIZE,
      channels: 3,
      background: { r: 243, g: 244, b: 246 },
    },
  })
    .jpeg({ quality: 85 })
    .toBuffer();
}

async function downloadFromS3(bucket: string, key: string): Promise<Buffer> {
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const chunks: Uint8Array[] = [];
  for await (const chunk of Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function uploadToS3(bucket: string, key: string, body: Buffer): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'image/jpeg',
    }),
  );
}

async function uploadFallbackThumbnail(bucket: string, key: string): Promise<void> {
  try {
    const fallback = await createDefaultThumbnail();
    await uploadToS3(bucket, key, fallback);
    console.log(`Default thumbnail uploaded: ${key}`);
  } catch (error) {
    console.error(`Failed to upload default thumbnail for ${key}:`, error);
  }
}
