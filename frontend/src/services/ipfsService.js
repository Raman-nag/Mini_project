import { uploadToIPFS, ipfsUrl } from '../utils/ipfs';
import { IPFS_CONFIG } from '../config/contractConfig';

/**
 * IPFS Service
 * Real implementation for IPFS file operations using Pinata
 */
class IPFSService {
  constructor() {
    this.gatewayBaseUrl = IPFS_CONFIG.gateway || 'https://gateway.pinata.cloud/ipfs/';
  }

  /**
   * Upload file to IPFS using Pinata
   * @param {File|Blob} file - File to upload
   * @param {Object} options - Upload options
   * @returns {Promise<string>} IPFS hash (CID)
   */
  async uploadFile(file, options = {}) {
    try {
      if (!IPFS_CONFIG.pinataApiKey || !IPFS_CONFIG.pinataSecretApiKey) {
        throw new Error('IPFS credentials not configured. Please set VITE_PINATA_API_KEY and VITE_PINATA_SECRET_API_KEY in your .env file.');
      }

      const hash = await uploadToIPFS([file], options.onProgress);
      
      console.log('[IPFS Service] File uploaded:', {
        name: file.name,
        size: file.size,
        type: file.type,
        hash
      });

      return hash;
    } catch (error) {
      console.error('IPFS Service - Upload File Error:', error);
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to IPFS
   * @param {File[]|Blob[]} files - Files to upload
   * @returns {Promise<Array>} Array of {file, hash} objects
   */
  async uploadMultipleFiles(files) {
    try {
      if (!IPFS_CONFIG.pinataApiKey || !IPFS_CONFIG.pinataSecretApiKey) {
        throw new Error('IPFS credentials not configured. Please set VITE_PINATA_API_KEY and VITE_PINATA_SECRET_API_KEY in your .env file.');
      }

      const hash = await uploadToIPFS(files);
      
      // Pinata returns a single hash for multiple files
      const results = files.map((file, index) => ({
        file,
        hash: hash, // All files share the same hash when uploaded together
        url: this.getGatewayURL(hash)
      }));

      console.log('[IPFS Service] Multiple files uploaded:', results.length);

      return results;
    } catch (error) {
      console.error('IPFS Service - Upload Multiple Files Error:', error);
      throw new Error(`Failed to upload files to IPFS: ${error.message}`);
    }
  }

  /**
   * Retrieve file from IPFS
   * @param {string} hash - IPFS hash (CID)
   * @returns {Promise<string>} File URL
   */
  async retrieveFile(hash) {
    try {
      if (!hash || hash.trim().length === 0) {
        throw new Error('Invalid IPFS hash');
      }

      const url = this.getGatewayURL(hash);

      console.log('[IPFS Service] File retrieved:', hash);

      return url;
    } catch (error) {
      console.error('IPFS Service - Retrieve File Error:', error);
      throw new Error(`Failed to retrieve file from IPFS: ${error.message}`);
    }
  }

  /**
   * Get IPFS gateway URL
   * @param {string} hash - IPFS hash (CID)
   * @returns {string} Gateway URL
   */
  getGatewayURL(hash) {
    if (!hash) return '';
    return ipfsUrl(hash);
  }

  /**
   * Validate IPFS hash
   * @param {string} hash - IPFS hash
   * @returns {boolean} Validation result
   */
  isValidHash(hash) {
    if (!hash || typeof hash !== 'string') return false;
    // IPFS hashes (CIDs) can be Qm... (v0) or start with other prefixes (v1)
    // Basic validation: non-empty string
    return hash.trim().length > 0;
  }

  /**
   * Download file from IPFS
   * @param {string} hash - IPFS hash
   * @param {string} filename - Filename for download
   * @returns {Promise<Blob>} File blob
   */
  async downloadFile(hash, filename = 'download') {
    try {
      const url = this.getGatewayURL(hash);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();

      console.log('[IPFS Service] File downloaded:', hash);

      return blob;
    } catch (error) {
      console.error('IPFS Service - Download File Error:', error);
      throw new Error(`Failed to download file from IPFS: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new IPFSService();
