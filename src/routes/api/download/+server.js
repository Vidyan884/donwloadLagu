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
        console.log(`[Method: Smart] Fetching info for ID: ${id}`);

        if (!ytdl.validateID(id) && !ytdl.validateURL(videoUrl)) {
            throw new Error('Invalid video ID');
        }

        const info = await ytdl.getBasicInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        const filename = `${title}.mp3`;

        console.log(`Target: ${title}`);

        // Helper to download with ytdl-core as fallback
        const downloadWithYtdl = () => {
            console.log('Falling back to ytdl-core...');
            const stream = ytdl(videoUrl, {
                quality: 'highestaudio',
                filter: 'audioonly'
            });

            // @ts-ignore
            return new Response(stream, {
                headers: {
                    'Content-Type': 'audio/mpeg',
                    'Content-Disposition': `attachment; filename="${filename}"`
                }
            });
        };

        const isWin = process.platform === 'win32';
        const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
        const ytDlpPath = path.resolve('bin', binName);
        let useYtDlp = true;

        // Check binary existence on Linux/Unix
        if (!isWin) {
            try {
                const fs = await import('fs');
                if (fs.existsSync(ytDlpPath)) {
                    fs.chmodSync(ytDlpPath, 0o755);
                } else {
                    console.warn('yt-dlp binary not found, skipping directly to fallback.');
                    useYtDlp = false;
                }
            } catch (e) {
                console.warn('Failed to check/chmod binary:', e);
                useYtDlp = false; // Safe default
            }
        }

        if (useYtDlp) {
            try {
                return await new Promise((resolve, reject) => {
                    console.log(`Attempting yt-dlp spawn at: ${ytDlpPath}`);

                    const ytDlpProcess = spawn(ytDlpPath, [
                        '-f', 'bestaudio',
                        '-o', '-',
                        videoUrl
                    ]);

                    // If spawn fails immediately (e.g. ENOENT, EACCES)
                    ytDlpProcess.on('error', (err) => {
                        console.error('yt-dlp spawn error:', err);
                        // Resolve with fallback instead of rejecting to keep the flow
                        resolve(downloadWithYtdl());
                    });

                    // Capture stderr for debugging, but don't fail immediately on warnings
                    ytDlpProcess.stderr.on('data', (data) => {
                        const msg = data.toString();
                        // Ignore progress outputs
                        if (!msg.includes('[download]')) {
                            console.log(`yt-dlp stderr: ${msg.trim()}`);
                        }
                    });

                    // If the process exits with error code, fallback might be needed
                    // BUT: we are piping stdout. If we wait for exit, we can't stream.
                    // So we rely on the fact that if it works, we get a stdout stream.

                    // Optimization: We return the Response immediately with the stdout stream.
                    // If yt-dlp crashes mid-stream, the download breaks, which is "fine" for HTTP.
                    // The critical part is catching the *start* failure.

                    // However, to be extra safe against immediate exit without data:
                    let hasData = false;
                    ytDlpProcess.stdout.once('data', () => {
                        hasData = true;
                    });

                    ytDlpProcess.on('close', (code) => {
                        if (code !== 0 && !hasData) {
                            console.warn(`yt-dlp exited with code ${code} and no data. Switching to fallback.`);
                            resolve(downloadWithYtdl());
                        }
                    });

                    // Ideally we return the stream immediately
                    if (ytDlpProcess.stdout) {
                        // @ts-ignore
                        resolve(new Response(ytDlpProcess.stdout, {
                            headers: {
                                'Content-Type': 'audio/mpeg',
                                'Content-Disposition': `attachment; filename="${filename}"`
                            }
                        }));
                    } else {
                        // Should not happen if spawn succeeded
                        reject(new Error('No stdout from yt-dlp'));
                    }
                });
            } catch (e) {
                console.error('Global failure in yt-dlp block:', e);
                return downloadWithYtdl();
            }
        } else {
            return downloadWithYtdl();
        }

    } catch (e) {
        console.error("Critical Download Error:", e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        // @ts-ignore
        return new Response(JSON.stringify({
            message: "Gagal memproses audio. Silakan coba lagi nanti.",
            error: errorMessage
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
