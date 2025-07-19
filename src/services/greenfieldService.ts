import { Client } from '@bnb-chain/greenfield-js-sdk';

// Greenfield configuration for testnet
const GREENFIELD_CONFIG = {
  endpoint: 'https://gnfd-testnet-sp1.bnbchain.org',
  chainId: 5600, // Greenfield testnet chain ID
};

class GreenfieldService {
  private client: Client;
  private bucketName: string = 'civic-violations';

  constructor() {
    this.client = Client.create(GREENFIELD_CONFIG.endpoint, String(GREENFIELD_CONFIG.chainId));
  }

  async initializeBucket(address: string) {
    try {
      // Check if bucket exists
      const bucketInfo = await this.client.bucket.headBucket(this.bucketName);
      console.log('Bucket already exists:', bucketInfo);
    } catch (error) {
      // Bucket doesn't exist, create it
      try {
        const createBucketTx = await this.client.bucket.createBucket({
          bucketName: this.bucketName,
          creator: address,
          visibility: 'VISIBILITY_TYPE_PUBLIC_READ',
          chargedReadQuota: '0',
          spInfo: {
            endpoint: GREENFIELD_CONFIG.endpoint,
          },
        });
        
        console.log('Bucket created successfully:', createBucketTx);
      } catch (createError) {
        console.error('Error creating bucket:', createError);
        throw createError;
      }
    }
  }

  async uploadViolationEvidence(
    file: File,
    violationId: string,
    userAddress: string
  ): Promise<string> {
    try {
      await this.initializeBucket(userAddress);

      const objectName = `violation-${violationId}-${Date.now()}-${file.name}`;
      
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Upload to Greenfield
      const uploadResult = await this.client.object.createObject({
        bucketName: this.bucketName,
        objectName: objectName,
        body: {
          data: buffer,
          size: buffer.length,
        },
        txOpts: {
          creator: userAddress,
        },
      });

      console.log('File uploaded to Greenfield:', uploadResult);

      // Return the Greenfield URL
      const greenfieldUrl = `${GREENFIELD_CONFIG.endpoint}/view/${this.bucketName}/${objectName}`;
      return greenfieldUrl;
    } catch (error) {
      console.error('Error uploading to Greenfield:', error);
      throw new Error('Failed to upload evidence to Greenfield');
    }
  }

  async getObjectUrl(objectName: string): string {
    return `${GREENFIELD_CONFIG.endpoint}/view/${this.bucketName}/${objectName}`;
  }

  async deleteObject(objectName: string, userAddress: string): Promise<void> {
    try {
      await this.client.object.deleteObject({
        bucketName: this.bucketName,
        objectName: objectName,
        operator: userAddress,
      });
      console.log('Object deleted from Greenfield:', objectName);
    } catch (error) {
      console.error('Error deleting object:', error);
      throw error;
    }
  }
}

export const greenfieldService = new GreenfieldService();