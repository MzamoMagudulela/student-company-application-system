import hashlib
import secrets
import string
from datetime import datetime, timezone
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64MB
    parallelism=4,
    hash_len=32,
    salt_len=16
)

def hash_password(password: str) -> str:
    """Hashes a plaintext password using Argon2id."""
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against an Argon2id hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False

def generate_secure_token(nbytes: int = 32) -> str:
    """Generates a cryptographically strong URL-safe session or recovery token."""
    return secrets.token_urlsafe(nbytes)

def hash_token(token: str) -> str:
    """Creates a deterministic SHA-256 hash of a token for secure database storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def generate_reference_number(prefix: str = "APP") -> str:
    """Generates a readable enterprise reference number, e.g., APP-2026-X9K2B."""
    year = datetime.now(timezone.utc).year
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(secrets.choice(chars) for _ in range(5))
    return f"{prefix}-{year}-{suffix}"
