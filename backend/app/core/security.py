from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Any
from jose import jwt, JWTError
from passlib.context import CryptContext
import redis
import logging
from app.config import settings

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Setup redis client with fallback if connection fails
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    # Ping check
    redis_client.ping()
    logger.info("Connected to Redis successfully.")
except Exception as e:
    logger.warning(f"Could not connect to Redis: {e}. Falling back to in-memory blacklist.")
    redis_client = None

# Fallback in-memory blacklist for security fallback if Redis is down
in_memory_blacklist = set()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRY_MINUTES)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "type": "access"
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh"
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def blacklist_token(token: str, expires_in_seconds: int = 3600) -> None:
    if redis_client:
        try:
            redis_client.setex(f"blacklist:{token}", expires_in_seconds, "true")
        except Exception as e:
            logger.error(f"Redis write error on blacklisting: {e}")
            in_memory_blacklist.add(token)
    else:
        in_memory_blacklist.add(token)

def is_token_blacklisted(token: str) -> bool:
    if redis_client:
        try:
            return redis_client.exists(f"blacklist:{token}") > 0
        except Exception as e:
            logger.error(f"Redis read error: {e}")
            return token in in_memory_blacklist
    return token in in_memory_blacklist
