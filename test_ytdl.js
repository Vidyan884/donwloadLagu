import ytdl from '@distube/ytdl-core';
import fs from 'fs';

const videoId = 'dQw4w9WgXcQ'; // Rick Roll
const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

async function testYtdl() {
    console.log(`Testing ytdl-core for ${videoUrl}...`);
    try {
        console.log('Fetching basic info...');
        const info = await ytdl.getBasicInfo(videoUrl);
        console.log(`Title: ${info.videoDetails.title}`);

        console.log('Starting stream...');
        const stream = ytdl(videoUrl, {
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        stream.on('info', (info, format) => {
            console.log('Stream info received.');
            console.log(`Format: ${format.container} - ${format.audioBitrate}kbps`);
            stream.destroy(); // Stop download, we just want to know if it starts
            console.log('✅ Success: Stream started.');
        });

        stream.on('error', (err) => {
            console.error('❌ Stream Error:', err.message);
        });

        stream.pipe(fs.createWriteStream('test_audio.mp3'));

    } catch (e) {
        console.error('❌ Global Error:', e.message);
        if (e.statusCode === 403) {
            console.error('⚠️  403 Forbidden: Likely an IP block or bot detection.');
        }
    }
}

testYtdl();
