import { S3, PutObjectCommand } from "@aws-sdk/client-s3";

export async function uploadToS3(
  file: File
): Promise<{ file_key: string; file_name: string }> {
  try {
    const s3 = new S3({
      region: process.env.NEXT_PUBLIC_S3_REGION,
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
      },

      requestChecksumCalculation: "WHEN_REQUIRED",
    });

    const file_key = `uploads/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: file_key,
      Body: file,
      ContentType: file.type, // Important for proper file handling
    };

    // Uploading the file
    await s3.send(new PutObjectCommand(params));

    return {
      file_key,
      file_name: file.name,
    };
  } catch (error) {
    console.error("❌ Error uploading to S3:", error);
    throw error; // This will reject the promise automatically
  }
}

export function getS3Url(file_key: string) {
  return `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${file_key}`;
}
