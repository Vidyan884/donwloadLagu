import { error } from '@sveltejs/kit';
import ytdl from '@distube/ytdl-core';
import { spawn } from 'child_process';
import path from 'path';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    const id = url.searchParams.get('id');

    if (!id) {
        throw error(400, 'Missing video ID');
    }

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${id}`;
        console.log(`[Method: Direct] Fetching info for ID: ${id}`);

        if (!ytdl.validateID(id) && !ytdl.validateURL(videoUrl)) {
            throw new Error('Invalid video ID');
        }

        const info = await ytdl.getBasicInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        const filename = `${title}.mp3`;

        console.log(`Streaming: ${title}`);

        const isWin = process.platform === 'win32';
        const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
        const ytDlpPath = path.resolve('bin', binName);

        // Ensure executable permissions on Linux/Unix
        if (!isWin) {
            try {
                // chmod +x
                const fs = await import('fs');
                fs.chmodSync(ytDlpPath, 0o755);
            } catch (e) {
                console.warn('Failed to set permissions on yt-dlp binary:', e);
            }
        }

        console.log(`Using yt-dlp binary at: ${ytDlpPath}`);

        // Spawn yt-dlp process
        const ytDlpProcess = spawn(ytDlpPath, [
            '-f', 'bestaudio', // Best audio quality
            '-o', '-',         // Output to stdout
            videoUrl
        ]);

        ytDlpProcess.stderr.on('data', (data) => {
            console.log(`yt-dlp stderr: ${data}`);
        });

        // @ts-ignore - SvelteKit Node adapter handles Node streams
        return new Response(ytDlpProcess.stdout, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (e) {
        console.error("Download error for ID:", id);
        console.error(e);
        // @ts-ignore
        return new Response(JSON.stringify({ message: "Gagal: Terjadi kesalahan saat memproses audio.", error: e.message || String(e) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
