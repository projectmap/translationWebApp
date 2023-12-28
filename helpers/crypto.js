/**
The choice between AES-CBC (Cipher Block Chaining), AES-CTR (Counter Mode), and AES-GCM (Galois/Counter Mode) depends on the specific requirements and characteristics of your use case. Each mode has its strengths and considerations. Let's compare them:

1. AES-CBC:
   - Advantages:
     - Simplicity and wide support.
     - Good performance on platforms with hardware-accelerated AES.
     - Suitable for encrypting large amounts of data sequentially.
   - Considerations:
     - Requires padding to handle data that is not a multiple of the block size.
     - Vulnerable to padding oracle attacks if not properly implemented and secured.
     - Does not provide built-in data integrity/authentication. Additional measures like HMAC (Hash-based Message Authentication Code) may be required.

2. AES-CTR:
   - Advantages:
     - Excellent performance, particularly for random-access scenarios.
     - Supports parallel encryption and decryption.
     - No padding requirement.
     - Data integrity/authentication can be achieved separately using algorithms like HMAC.
   - Considerations:
     - Requires unique and non-repeating counter values for each encryption operation to maintain security.
     - Lacks built-in data integrity/authentication, so additional measures are necessary.

3. AES-GCM:
   - Advantages:
     - Provides both confidentiality (encryption) and integrity (authentication) in a single operation.
     - Built-in authentication and integrity checking with the authentication tag.
     - Supports parallel encryption and decryption.
     - Suitable for high-speed communication and hardware-accelerated cryptography.
   - Considerations:
     - Requires a unique IV for each encryption operation to maintain security.
     - Sensitive to IV reuse, as it can compromise security.
     - Additional care should be taken when handling the authentication tag to prevent potential vulnerabilities.

In terms of security and performance, AES-GCM is generally considered the most favorable choice due to its built-in integrity checking and parallel processing capabilities. However, proper implementation and careful management of IVs and authentication tags are crucial.
 */

// REF: https://github.com/mdn/dom-examples/blob/main/web-crypto/encrypt-decrypt/aes-gcm.js

const algorithmName = 'AES-GCM';

// DO NOT CHNAGE using static secrets
const SECRET_KEY = '5OEhl6scCFWfTCyjuhGS3X@69KldLljC';

let encryptDecryptKey;

function encodeData(data) {
  // Convert secretKey to Uint8Array
  return new TextEncoder('utf-8').encode(data);
}

function decodeData(data) {
  return new TextDecoder('utf-8').decode(data);
}

async function generateKey(secretKey = SECRET_KEY) {
  if (encryptDecryptKey) {
    return encryptDecryptKey;
  }

  if (secretKey.length !== 32) {
    throw new Error(
      'Encryp/Decrypt Key error.Please pass exact 32 char secrets'
    );
  }

  // Convert secretKey to Uint8Array
  const encodedKey = encodeData(secretKey);

  // Import encoded secretKey as CryptoKey
  encryptDecryptKey = await crypto.subtle.importKey(
    'raw',
    encodedKey,
    {
      name: algorithmName,
    },
    true,
    ['encrypt', 'decrypt']
  );
  return encryptDecryptKey;
}

// Encrypt data using the provided key
async function encryptData(data) {
  const key = await generateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const algorithm = {
    name: algorithmName,
    iv,
  };

  const encodedData = encodeData(data);

  const encryptedData = await crypto.subtle.encrypt(
    algorithm,
    key,
    encodedData
  );

  // Combine IV and encrypted data into a single Uint8Array
  const encryptedBytes = new Uint8Array(encryptedData);
  const result = new Uint8Array(iv.length + encryptedBytes.length);
  result.set(iv);
  result.set(encryptedBytes, iv.length);

  return result.buffer;
}

// Decrypt data using the provided key
async function decryptData(encryptedData) {
  const key = await generateKey();

  const _encryptData = new Uint8Array(encryptedData);

  const iv = _encryptData.slice(0, 12);
  const algorithm = {
    name: algorithmName,
    iv,
  };

  // Extracting encrypted data as our data starts from 12
  // as In AES-GCM, the first 12 bytes of the encrypted data are reserved for the initialization vector (IV)
  const encryptedBytes = _encryptData.slice(12);
  const decryptedData = await crypto.subtle.decrypt(
    algorithm,
    key,
    encryptedBytes
  );

  // Convert the decrypted data to string and return
  return decodeData(decryptedData);
}

export { encryptData, decryptData };
