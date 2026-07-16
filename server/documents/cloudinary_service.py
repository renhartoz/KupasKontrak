import logging
import cloudinary
import cloudinary.uploader
from django.conf import settings

logger = logging.getLogger("Image Upload")

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

def delete_file(public_id, resource_type="raw"):
    _configure_cloudinary()
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        logger.info("Deleted from Cloudinary: %s (%s)", public_id, result)
        return result
    except Exception as e:
        logger.error("Cloudinary delete failed: %s", e)

def upload_profile_image(file_obj):
    return upload_file(file_obj, folder="profiles", resource_type="image")

def delete_profile_image(public_id):
    return delete_file(public_id, resource_type="image")