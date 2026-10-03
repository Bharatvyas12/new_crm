import secrets
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
)


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(hashed: str, password: str) -> bool:
    try:
        return ph.verify(hashed, password)
    except VerifyMismatchError:
        return False


def generate_session_token() -> str:
    return secrets.token_hex(64)


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def generate_qr_nonce() -> str:
    return secrets.token_urlsafe(48)