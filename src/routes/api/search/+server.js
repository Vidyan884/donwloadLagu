import { json } from '@sveltejs/kit';
import ytSearch from 'yt-search';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    const query = url.searchParams.get('q');

    if (!query) {
        return json([]);
    }

    try {
        const r = await ytSearch(query);
        const videos = r.videos.slice(0, 10).map(v => ({
            id: v.videoId,
            title: v.title,
            artist: v.author.name,
            duration: v.timestamp,
            cover: v.thumbnail,
            url: v.url
        }));

        return json(videos);
    } catch (e) {
        console.error("Search error:", e);
        return json([], { status: 500 });
    }
}
