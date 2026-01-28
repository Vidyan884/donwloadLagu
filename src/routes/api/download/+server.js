import { error } from '@sveltejs/kit';
import ytdl from '@distube/ytdl-core';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    const id = url.searchParams.get('id');

    if (!id) {
        throw error(400, 'Missing video ID');
    }

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${id}`;

        // Get video info to sanitized title
        const info = await ytdl.getBasicInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');

        // Stream audio
        const stream = ytdl(videoUrl, {
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        // Create a ReadableStream from the Node.js stream for SvelteKit response
        const readable = new ReadableStream({
            start(controller) {
                stream.on('data', (chunk) => controller.enqueue(chunk));
                stream.on('end', () => controller.close());
                stream.on('error', (err) => controller.error(err));
            }
        });

        return new Response(readable, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${title}.mp3"`,
                'Transfer-Encoding': 'chunked'
            }
        });

    } catch (e) {
        console.error("Download error:", e);
        throw error(500, 'Failed to download audio');
    }
}
