import { error } from '@sveltejs/kit';
import youtubedl from 'youtube-dl-exec';

// Cobalt API instances for fallback
const COBALT_INSTANCES = [
    'https://api.cobalt.tools',
    'https://cobalt-api.meowing.de',
    'https://kityune.imput.net',
    'https://blossom.imput.net'
];

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    const id = url.searchParams.get('id');

    if (!id) {
        throw error(400, 'Missing video ID');
    }

    const videoUrl = `https://www.youtube.com/watch?v=${id}`;
    console.log(`[Download] Processing ID: ${id}`);

    try {
        // Try youtube-dl-exec first (primary method)
        return await downloadWithYoutubeDl(videoUrl, id);
    } catch (primaryError) {
        console.error('[Primary] youtube-dl-exec failed:', primaryError);

        // Fallback to Cobalt API
        try {
            return await downloadWithCobalt(videoUrl, id);
        } catch (cobaltError) {
            console.error('[Fallback] Cobalt failed:', cobaltError);

            // Return error response
            return new Response(JSON.stringify({
                message: "Gagal memproses audio. Silakan coba lagi nanti.",
                error: primaryError instanceof Error ? primaryError.message : String(primaryError)
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
}

/**
 * Download using youtube-dl-exec with anti-bot headers
 * @param {string} videoUrl 
 * @param {string} id 
 */
async function downloadWithYoutubeDl(videoUrl, id) {
    console.log('[youtube-dl-exec] Starting download...');

    // Get video info first
    const info = await youtubedl(videoUrl, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
    });

    const title = String(info.title).replace(/[^\w\s]/gi, '');
    const filename = `${title}.mp3`;
    console.log(`[youtube-dl-exec] Title: ${title}`);

    // Get audio stream URL
    const audioUrl = await youtubedl(videoUrl, {
        format: 'bestaudio',
        getUrl: true,
        noCheckCertificates: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
    });

    console.log('[youtube-dl-exec] Got audio URL, streaming...');

    // Fetch and stream the audio
    const audioResponse = await fetch(String(audioUrl), {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.youtube.com/'
        }
    });

    if (!audioResponse.ok || !audioResponse.body) {
        throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
    }

    return new Response(audioResponse.body, {
        headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `attachment; filename="${filename}"`
        }
    });
}

/**
 * Fallback download using Cobalt API
 * @param {string} videoUrl 
 * @param {string} id 
 */
async function downloadWithCobalt(videoUrl, id) {
    console.log('[Cobalt] Trying fallback...');

    for (const instance of COBALT_INSTANCES) {
        try {
            console.log(`[Cobalt] Trying ${instance}...`);

            const response = await fetch(instance, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Origin': 'https://cobalt.tools'
                },
                body: JSON.stringify({
                    url: videoUrl,
                    downloadMode: 'audio',
                    audioFormat: 'mp3'
                })
            });

            if (!response.ok) {
                console.log(`[Cobalt] ${instance} returned ${response.status}`);
                continue;
            }

            const data = await response.json();

            if (data.url) {
                console.log(`[Cobalt] Got download URL from ${instance}`);

                // Fetch audio from cobalt URL
                const audioResponse = await fetch(data.url);
                if (!audioResponse.ok || !audioResponse.body) {
                    throw new Error('Failed to fetch audio from Cobalt URL');
                }

                return new Response(audioResponse.body, {
                    headers: {
                        'Content-Type': 'audio/mpeg',
                        'Content-Disposition': `attachment; filename="${id}.mp3"`
                    }
                });
            }
        } catch (e) {
            console.error(`[Cobalt] ${instance} error:`, e);
        }
    }

    throw new Error('All Cobalt instances failed');
}
