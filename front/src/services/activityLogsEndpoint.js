import api from '../api/axios.js';
import { readEndpointData } from './backendSupport.js';

export const ACTIVITY_LOGS_ENDPOINT = '/system/activity-logs/';
export const ACTIVITY_LOGS_EXPORT_ENDPOINT = '/system/activity-logs/export/';

export async function fetchActivityLogs() {
  return readEndpointData({
    getPreviewData: [],
    request: () => api.get(ACTIVITY_LOGS_ENDPOINT),
    normalize: (payload) => {
      if (Array.isArray(payload)) {
        return payload;
      }

      if (Array.isArray(payload?.results)) {
        return payload.results;
      }

      if (Array.isArray(payload?.logs)) {
        return payload.logs;
      }

      return [];
    },
  });
}
