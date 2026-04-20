import { TEMP_FRONTEND_PREVIEW_MODE } from '../config/previewMode.js';

function resolveValue(valueOrFactory) {
  return typeof valueOrFactory === 'function'
    ? valueOrFactory()
    : valueOrFactory;
}

export function isFrontendPreviewMode() {
  return TEMP_FRONTEND_PREVIEW_MODE;
}

export function createBackendRequirementResult(actionLabel, endpoint = '') {
  const normalizedEndpoint = String(endpoint || '').trim();

  return {
    success: false,
    preview: true,
    endpoint: normalizedEndpoint,
    error: normalizedEndpoint
      ? `Backend endpoint is required to ${actionLabel}: ${normalizedEndpoint}`
      : `Backend endpoint is required to ${actionLabel}.`,
  };
}

export async function readEndpointData({
  getPreviewData,
  request,
  normalize = (value) => value,
}) {
  if (TEMP_FRONTEND_PREVIEW_MODE) {
    return normalize(resolveValue(getPreviewData));
  }

  const response = await request();
  return normalize(response?.data ?? response);
}

export async function runEndpointMutation({
  endpoint = '',
  actionLabel,
  request,
  getPreviewResult,
}) {
  if (TEMP_FRONTEND_PREVIEW_MODE) {
    if (getPreviewResult) {
      return resolveValue(getPreviewResult);
    }

    return createBackendRequirementResult(actionLabel, endpoint);
  }

  const response = await request();
  return response?.data ?? response;
}
