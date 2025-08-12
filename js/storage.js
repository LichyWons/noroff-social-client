const LS = {
    TOKEN: "ns_token",
    PROFILE: "ns_profile",
    API_KEY: "ns_api_key",
    };

    /** Access Token */
    export function setToken(token) {
        localStorage.setItem(LS.TOKEN, token || "");
    }
    export function getToken() {
        return localStorage.getItem(LS.TOKEN) || "";
    }

    /** Profile (JSON) */
    export function setProfile(profile) {
        localStorage.setItem(LS.PROFILE, JSON.stringify(profile || {}));
    }
    export function getProfile() {
        const raw = localStorage.getItem(LS.PROFILE);
        try { return raw ? JSON.parse(raw) : null;} catch { return null}
    }       
    /** Noroff API Key */
    export function setApiKey(key) { localStorage.setItem(LS.API_KEY, key || ""); }
export function getApiKey() { return localStorage.getItem(LS.API_KEY) || ""; }

/** Logout helper */
export function clearAuth() {
  localStorage.removeItem(LS.TOKEN);
  localStorage.removeItem(LS.PROFILE);
}