import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { env } from './env';


console.log("check:",env.S3_SECRET_ACCESS_KEY);


export const s3 = new S3Client({
    tls: false,
    endpoint: env.S3_ENDPOINT,
    region: "local",
    credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
});

const bucketName = env.S3_BUCKET_NAME;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function uploadFileToS3(key: string, body: any, contentType: string, metadata: Record<string, string>) {
    // console.log("[s3] uploading file to S3", key, body.length, typeof body, contentType, metadata);

    return s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        ACL: 'private',
        Metadata: metadata,
    }));
}

export async function getFileFromS3(key: string) {
    return s3.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
    }));
}