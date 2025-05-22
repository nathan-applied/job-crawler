

import { PutObjectCommand, S3Client, GetObjectCommand  } from "@aws-sdk/client-s3";


const streamToString = async (stream) => {
    return await new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
};

class R2Handler {
    
    constructor (config) {
        this.config = config;
        this.R2 = new S3Client({
            region: "auto",
            endpoint: `https://${this.config.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
              accessKeyId: this.config.ACCESS_KEY_ID,
              secretAccessKey: this.config.ACCESS_SECRET_KEY,
            },
        });
        console.log(this.config.R2_BUCKET)
    }

    async uploadJSONFile (key, content) {
        try {
            const command = new PutObjectCommand({
              Bucket: this.config.R2_BUCKET,
              Key: key,
              Body: content, 
              ContentType: 'application/json'
            });
        
            const response = await this.R2.send(command);
            console.log(`✅ Uploaded string to ${key}`);
          } catch (err) {
            console.error('❌ Upload failed:', err);
          }
         
    }

    async getJsonFromS3 (key) {
        try {
            const command = new GetObjectCommand({
              Bucket: this.config.R2_BUCKET,
              Key: key,
            });
        
            const response = await this.R2.send(command);
            const jsonString = await streamToString(response.Body);
        
            return JSON.parse(jsonString);
        
        } catch (err) {
        console.error('❌ Error reading from S3:', err);
        throw err;
        }
    }
    
}

export default R2Handler;