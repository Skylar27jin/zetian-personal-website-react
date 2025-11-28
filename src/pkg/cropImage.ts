// src/pkg/cropImage.ts
import type { Area } from "react-easy-crop";

/**
 * 加载图片为 HTMLImageElement
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous"; // 避免 canvas 污染，保险加一下
    image.onload = () => resolve(image);
    image.onerror = (err) => reject(err);
    image.src = url;
  });
}

/**
 * 根据 croppedAreaPixels，把原图裁剪成一个 Blob（JPEG）
 */
export async function getCroppedImg(
  imageSrc: string,
  croppedAreaPixels: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context");
  }

  const { x, y, width, height } = croppedAreaPixels;

  canvas.width = width;
  canvas.height = height;

  // 把选中的区域画到 canvas (0,0,width,height)
  ctx.drawImage(
    image,
    x,
    y,
    width,
    height,
    0,
    0,
    width,
    height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.9
    );
  });
}
