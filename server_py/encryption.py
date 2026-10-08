import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ALGORITHM = 'aes-256-gcm'
RAW_KEY = os.environ.get('TOKEN_ENCRYPTION_KEY') or os.environ.get('ENCRYPTION_KEY', 'c87f98d4a6e352b192e40192837465abcdeffedcba9876543210123456789abc')
# Strictly 32 bytes for AES-256
KEY_BYTES = bytes.fromhex(RAW_KEY.ljust(64, '0')[:64])
aesgcm = AESGCM(KEY_BYTES)

def encrypt_token(plain_text: str) -> str:
    """
    Encrypts sensitive credentials using AES-256-GCM.
    Returns format: iv_hex:auth_tag_hex:encrypted_payload_hex
    """
    if not plain_text or not isinstance(plain_text, str):
        return ""
    try:
        nonce = os.urandom(12)  # 12-byte standard GCM nonce
        # aesgcm.encrypt appends 16-byte auth tag at the end of ciphertext
        ciphertext_with_tag = aesgcm.encrypt(nonce, plain_text.encode('utf-8'), None)
        auth_tag = ciphertext_with_tag[-16:]
        ciphertext = ciphertext_with_tag[:-16]
        return f"{nonce.hex()}:{auth_tag.hex()}:{ciphertext.hex()}"
    except Exception as e:
        print(f"❌ Encryption failed: {e}")
        return plain_text

def decrypt_token(encrypted_payload: str) -> str:
    """
    Decrypts AES-256-GCM encrypted credentials.
    Gracefully handles plaintext legacy tokens if not in iv:tag:data format.
    """
    if not encrypted_payload or not isinstance(encrypted_payload, str):
        return ""
    try:
        parts = encrypted_payload.split(':')
        if len(parts) != 3:
            return encrypted_payload
        
        nonce_hex, auth_tag_hex, ciphertext_hex = parts
        nonce = bytes.fromhex(nonce_hex)
        auth_tag = bytes.fromhex(auth_tag_hex)
        ciphertext = bytes.fromhex(ciphertext_hex)
        
        decrypted = aesgcm.decrypt(nonce, ciphertext + auth_tag, None)
        return decrypted.decode('utf-8')
    except Exception as e:
        print(f"❌ Decryption failed: {e}")
        return ""
