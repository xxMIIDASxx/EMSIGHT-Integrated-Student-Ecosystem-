from cloudinary_storage.storage import RawMediaCloudinaryStorage
import cloudinary

class SignedRawMediaCloudinaryStorage(RawMediaCloudinaryStorage):
    """
    Custom storage to generate signed URLs for raw files.
    This bypasses Cloudinary's "Strict delivery" block for raw files
    on free tiers by automatically appending a signature to the URL.
    """
    def _get_url(self, name):
        name = self._prepend_prefix(name)
        cloudinary_resource = cloudinary.CloudinaryResource(
            name, 
            default_resource_type=self._get_resource_type(name)
        )
        return cloudinary_resource.build_url(sign_url=True)
