import { instagramFetch } from "./client.js";
export async function publishImage(platformAccountId, imageUrl, caption, token) {
    const container = await instagramFetch(`${platformAccountId}/media`, token, { method: "POST", body: JSON.stringify({ image_url: imageUrl, caption }) });
    for (let attempt = 0; attempt < 12; attempt++) {
        const status = await instagramFetch(`${container.id}?fields=status_code`, token);
        if (status.status_code === "FINISHED")
            break;
        if (status.status_code === "ERROR" || status.status_code === "EXPIRED")
            throw new Error(`Instagram media container ${status.status_code.toLowerCase()}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    const status = await instagramFetch(`${container.id}?fields=status_code`, token);
    if (status.status_code !== "FINISHED")
        throw new Error("Instagram media container timed out");
    return instagramFetch(`${platformAccountId}/media_publish`, token, { method: "POST", body: JSON.stringify({ creation_id: container.id }) });
}
