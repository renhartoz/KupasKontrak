import logging
import time
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from django.conf import settings

logger = logging.getLogger("CloudinaryService")


class CloudinaryServiceError(Exception):
    pass


def _configure_cloudinary():
    storage = getattr(settings, "CLOUDINARY_STORAGE", {})
    cloud_name = storage.get("CLOUD_NAME", "")
    api_key = storage.get("API_KEY", "")
    api_secret = storage.get("API_SECRET", "")

    if not all([cloud_name, api_key, api_secret]):
        raise CloudinaryServiceError("Cloudinary credentials are not configured.")

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )


def upload_file(file_obj, folder="", resource_type="raw"):
    _configure_cloudinary()

    allowed_formats = (
        ["jpg", "jpeg", "png", "webp", "gif"]
        if resource_type == "image"
        else ["pdf", "jpg", "jpeg", "png"]
    )

    try:
        file_obj.seek(0)
        result = cloudinary.uploader.upload(
            file_obj,
            folder=folder,
            resource_type=resource_type,
            type="authenticated" if resource_type == "raw" else "upload",
            allowed_formats=allowed_formats,
        )

        secure_url = result.get("secure_url", "")
        if not secure_url:
            raise CloudinaryServiceError(
                "Cloudinary returned no URL. Upload may have failed."
            )

        logger.info("File uploaded to Cloudinary: %s", secure_url)
        return secure_url

    except cloudinary.exceptions.Error as e:
        logger.error("Cloudinary upload failed: %s", e)
        raise CloudinaryServiceError(f"Cloudinary upload failed: {e}")
    except Exception as e:
        logger.error("Unexpected error during Cloudinary upload: %s", e)
        raise CloudinaryServiceError(f"Unexpected upload error: {e}")


def upload_document(file_obj, folder="contracts"):
    _configure_cloudinary()
    try:
        file_obj.seek(0)
        result = cloudinary.uploader.upload(
            file_obj,
            folder=folder,
            resource_type="raw",
            type="authenticated",
            allowed_formats=["pdf"],
        )
        if not result.get("public_id"):
            raise CloudinaryServiceError("Cloudinary returned no public_id.")
        return {
            "public_id": result.get("public_id"),
            "secure_url": result.get("secure_url", ""),
            "bytes": result.get("bytes", 0),
        }
    except cloudinary.exceptions.Error as e:
        logger.error("Cloudinary upload_document failed: %s", e)
        raise CloudinaryServiceError(f"Cloudinary upload failed: {e}")
    except Exception as e:
        logger.error("Unexpected error during Cloudinary upload_document: %s", e)
        raise CloudinaryServiceError(f"Unexpected upload error: {e}")


def generate_signed_url(public_id, resource_type="raw", ttl_seconds=None):
    _configure_cloudinary()
    if ttl_seconds is None:
        ttl_seconds = getattr(settings, "CLOUDINARY_SIGNED_URL_TTL_SECONDS", 3600)
    expires_at = int(time.time()) + ttl_seconds
    try:
        url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type=resource_type,
            type="authenticated",
            sign_url=True,
            expires_at=expires_at,
        )
        return url, expires_at
    except Exception as e:
        logger.error("Failed to generate signed url: %s", e)
        raise CloudinaryServiceError(f"Failed to generate signed url: {e}")


def delete_file(public_id, resource_type="raw"):
    _configure_cloudinary()
    try:
        result = cloudinary.uploader.destroy(
            public_id, resource_type=resource_type, type="authenticated" if resource_type == "raw" else "upload"
        )
        logger.info("Deleted from Cloudinary: %s (%s)", public_id, result)
        return result
    except Exception as e:
        logger.error("Cloudinary delete failed: %s", e)


def upload_profile_image(file_obj):
    return upload_file(file_obj, folder="profiles", resource_type="image")


def delete_profile_image(public_id):
    return delete_file(public_id, resource_type="image")