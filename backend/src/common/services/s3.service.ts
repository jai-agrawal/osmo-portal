import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CreateFileDto } from 'src/files/dtos/create-file.dto';

interface SignedUrlResponse extends CreateFileDto {
  signedUrl: string;
  url: string;
}

@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async createSignedUrl(fileDetail: CreateFileDto): Promise<SignedUrlResponse> {
    const key = `testing/${Date.now()}_${fileDetail.name}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: fileDetail.type,
      ACL: 'public-read',
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });
    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { ...fileDetail, key, signedUrl, url };
  }

  async createSignedUrls(files: CreateFileDto[]): Promise<SignedUrlResponse[]> {
    return Promise.all(files.map((file) => this.createSignedUrl(file)));
  }
}
