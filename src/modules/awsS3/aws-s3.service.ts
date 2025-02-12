import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class AwsS3Service {
  private s3: AWS.S3;
  private bucketName = 'user-photo-aws';

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

  async uploadFile(file: Express.Multer.File, userId: number): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: `users/${userId}/${Date.now()}_${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Defina conforme necessário
    };

    const data = await this.s3.upload(params).promise();
    console.log('aws data.location ===>>>', data.Location);
    return data.Location; // URL público da imagem
  }
}
