import { S3 } from "@aws-sdk/client-s3";
import fs from "fs";
import stream from "stream";
import os from "os";
import path from "path";

export async function downloadFromS3(file_key: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const s3 = new S3({
        region: "us-east-1",
        endpoint: "https://s3.us-east-1.amazonaws.com",
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
        },
        forcePathStyle: false,
      });

      const params = {
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
        Key: file_key,
      };

      console.log("Downloading from S3:", file_key);
      const obj = await s3.getObject(params);

      if (!obj.Body) {
        return reject(new Error("S3 object has no body"));
      }

      // Use OS-specific temp directory
      const tempDir = os.tmpdir();
      const file_name = path.join(tempDir, `pdf${Date.now().toString()}.pdf`);

      if (!(obj.Body instanceof stream.Readable)) {
        return reject(new Error("S3 object body is not a readable stream"));
      }

      console.log("Writing to file:", file_name);
      const file = fs.createWriteStream(file_name);

      obj.Body.pipe(file)
        .on("finish", () => {
          console.log("Download complete:", file_name);
          resolve(file_name);
        })
        .on("error", (err) => {
          console.error("Error writing file:", err);
          reject(err);
        });
    } catch (error) {
      console.error("Error in downloadFromS3:", error);
      reject(error);
    }
  });
}
