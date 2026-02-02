import { json, error } from '@sveltejs/kit';
import ytdl from '@distube/ytdl-core';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    const inputUrl = url.searchParams.get('url');

    if (!inputUrl) {
        throw error(400, { message: 'Missing URL parameter' });
    }

    try {
        if (!ytdl.validateURL(inputUrl)) {
            throw error(400, { message: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getBasicInfo(inputUrl);
        const details = info.videoDetails;

        const result = {
            id: details.videoId,
            title: details.title,
            platform: 'YouTube',
            thumbnail: details.thumbnails[details.thumbnails.length - 1].url,
            downloadUrl: `/api/download?id=${details.videoId}`
        };

        return json(result);
    } catch (e) {
        console.error("URL processing error:", e);
        // @ts-ignore
        throw error(500, { message: e.message || 'Failed to process URL' });
    }
}
