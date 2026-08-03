export const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "dev.mytender.io:7861";
export const HTTP_PREFIX = import.meta.env.VITE_REACT_APP_API_URL_PREFIX_HTTPS
  ? ""
  : "s";
export const M365_SIGNIN_URL =
  import.meta.env.VITE_M365_SIGNIN_URL ||
  `http${HTTP_PREFIX}://${API_URL}/auth/microsoft/login`;

// RFP-Importer PostgREST integration
export const POSTGREST_URL = import.meta.env.VITE_POSTGREST_URL || "";
export const POSTGREST_JWT = import.meta.env.VITE_POSTGREST_JWT || "";

export const placeholder_upload = `
Paste bid material here...
    `;
