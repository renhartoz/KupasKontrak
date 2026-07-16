from datetime import timedelta
from pathlib import Path

import dj_database_url
import environ
from corsheaders.defaults import default_headers

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
env_file_config = BASE_DIR / "config" / ".env"
env_file_root = BASE_DIR / ".env"
if env_file_config.exists():
    environ.Env.read_env(env_file_config)
elif env_file_root.exists():
    environ.Env.read_env(env_file_root)

SECRET_KEY = env("DJANGO_SECRET_KEY", default=env("SECRET_KEY", default="django-insecure-default-secret-key-change-in-prod"))
DEBUG = env.bool("DEBUG", default=True)
ALLOWED_HOSTS = [
    host.strip()
    for host in env("ALLOWED_HOSTS", default="*").split(",")
    if host.strip()
]

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "cloudinary",
    "cloudinary_storage",
]

LOCAL_APPS = [
    "core",
    "documents",
    "audits",
    "chat",
    "accounts",
    "insights",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

AUTH_USER_MODEL = "accounts.User"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": dj_database_url.parse(
        env("DATABASE_URL", default="sqlite:///" + str(BASE_DIR / "db.sqlite3"))
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Jakarta"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
WHITENOISE_MANIFEST_STRICT = False

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in env("CORS_ALLOWED_ORIGINS", default="*").split(",")
    if origin.strip() and origin.strip() != "*"
]
if env("CORS_ALLOWED_ORIGINS", default="*").strip() == "*":
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(default_headers) + [
    "X-CSRFToken",
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in env("CORS_ALLOWED_ORIGINS", default="*").split(",")
    if origin.strip() and origin.strip() != "*"
]
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"
CSRF_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardPageNumberPagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=int(
            env(
                "SIMPLE_JWT_ACCESS_TOKEN_LIFETIME_MINUTES",
                default=env("JWT_ACCESS_TOKEN_LIFETIME_MIN", default=60),
            )
        )
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=int(env("SIMPLE_JWT_REFRESH_TOKEN_LIFETIME_DAYS", default=7))
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_COOKIE": "refresh_token",
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_SAMESITE": "Lax",
    "AUTH_COOKIE_SECURE": not DEBUG,
}

SPECTACULAR_SETTINGS = {
    "TITLE": "KupasKontrak API",
    "DESCRIPTION": "KupasKontrak API Endpoint",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

MEDIA_URL = "/kupaskontrak/"
MEDIA_ROOT = BASE_DIR / "media"

CLOUDINARY_STORAGE = {
    "CLOUD_NAME": env("CLOUDINARY_CLOUD_NAME", default=""),
    "API_KEY": env("CLOUDINARY_API_KEY", default=""),
    "API_SECRET": env("CLOUDINARY_API_SECRET", default=""),
}

STORAGES = {
    "default": {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

CELERY_BROKER_URL = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE

OCR_SPACE_API_KEY = env("OCR_SPACE_API_KEY", default="")
OCR_SPACE_TIER = env("OCR_SPACE_TIER", default="free")

LLM_PROVIDER = env("LLM_PROVIDER", default="groq")
GROQ_API_KEY = env("GROQ_API_KEY", default="")
OPENROUTER_API_KEY = env("OPENROUTER_API_KEY", default="")
OPENROUTER_MODEL_CHAIN = [
    model.strip()
    for model in env(
        "OPENROUTER_MODEL_CHAIN",
        default="x-ai/grok-4.1-fast,google/gemini-2.5-flash,openai/gpt-oss-120b",
    ).split(",")
    if model.strip()
]

PASAL_ID_MCP_ENDPOINT = env("PASAL_ID_MCP_ENDPOINT", default="https://pasal.id/api/v1/mcp")
PASAL_ID_MCP_API_KEY = env("PASAL_ID_MCP_API_KEY", default="")

CLOUDINARY_SIGNED_URL_TTL_SECONDS = int(env("CLOUDINARY_SIGNED_URL_TTL_SECONDS", default=3600))
