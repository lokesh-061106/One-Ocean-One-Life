from rest_framework.exceptions import APIException


class O3LBaseException(APIException):
    status_code = 400
    default_detail = 'An error occurred.'
    default_code = 'error'


class ContributionValidationError(O3LBaseException):
    default_detail = 'Contribution validation failed.'
    default_code = 'contribution_validation_error'


class LocationRequiredError(O3LBaseException):
    default_detail = 'GPS location is required for this contribution.'
    default_code = 'location_required'


class FileUploadError(O3LBaseException):
    default_detail = 'File upload failed.'
    default_code = 'file_upload_error'


class OfflineSyncError(O3LBaseException):
    default_detail = 'Offline sync failed.'
    default_code = 'offline_sync_error'


class EmergencyDataError(O3LBaseException):
    default_detail = 'Could not load emergency data.'
    default_code = 'emergency_data_error'
