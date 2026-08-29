const required = (name) => {
    const value = process.env[name];
    if (!value)
        throw new Error(`Missing required environment variable: ${name}`);
    return value;
};
export const config = {
    get projectId() { return required("FIREBASE_PROJECT_ID"); },
    get appId() { return required("INSTAGRAM_APP_ID"); },
    get appSecret() { return required("INSTAGRAM_APP_SECRET"); },
    get redirectUri() { return required("INSTAGRAM_REDIRECT_URI"); },
    get appUrl() { return required("APP_URL"); },
    apiVersion: process.env.INSTAGRAM_API_VERSION || "v24.0",
    port: Number(process.env.PORT || 8080),
};
export const permissions = [
    "instagram_business_basic",
    "instagram_business_manage_insights",
    "instagram_business_content_publish",
];
