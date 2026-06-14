from cloudinary_storage.storage import RawMediaCloudinaryStorage
import cloudinary
import cloudinary.uploader
import os

class SignedRawMediaCloudinaryStorage(RawMediaCloudinaryStorage):
    """
    Custom storage to generate signed URLs for raw files and upload them as authenticated.
    This bypasses Cloudinary's "Strict delivery" block for raw files
    on free tiers by automatically appending a signature and using the authenticated delivery type.
    """
    def _upload(self, name, content):
        options = {
            'use_filename': True, 
            'resource_type': self._get_resource_type(name), 
            'tags': getattr(self, 'TAG', ''),
            'type': 'authenticated'
        }
        folder = os.path.dirname(name)
        if folder:
            options['folder'] = folder
        return cloudinary.uploader.upload(content, **options)

    def _get_url(self, name):
        name = self._prepend_prefix(name)
        cloudinary_resource = cloudinary.CloudinaryResource(
            name, 
            default_resource_type=self._get_resource_type(name),
            type='authenticated'
        )
        return cloudinary_resource.build_url(sign_url=True)
