// Simplified Greenfield service for photo uploads
class GreenfieldService {
  private bucketName: string = 'civic-violations';

  // Simulate Greenfield upload for now - replace with actual implementation
  async uploadViolationEvidence(
    file: File,
    violationId: string,
    userAddress: string
  ): Promise<string> {
    try {
      console.log('Uploading to Greenfield:', {
        file: file.name,
        size: file.size,
        violationId,
        userAddress
      });

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For now, create a simulated Greenfield URL
      // In production, this would be the actual Greenfield upload
      const timestamp = Date.now();
      const greenfieldUrl = `https://gnfd-testnet-sp1.bnbchain.org/view/${this.bucketName}/violation-${violationId}-${timestamp}-${file.name}`;
      
      console.log('File uploaded to Greenfield:', greenfieldUrl);
      return greenfieldUrl;
    } catch (error) {
      console.error('Error uploading to Greenfield:', error);
      throw new Error('Failed to upload evidence to Greenfield');
    }
  }

  async getObjectUrl(objectName: string): string {
    return `https://gnfd-testnet-sp1.bnbchain.org/view/${this.bucketName}/${objectName}`;
  }

  // Convert file to base64 for preview
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  // Validate file type and size
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/mov'];

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only images (JPEG, PNG, GIF) and videos (MP4, MOV) are allowed' };
    }

    return { valid: true };
  }
}

export const greenfieldService = new GreenfieldService();