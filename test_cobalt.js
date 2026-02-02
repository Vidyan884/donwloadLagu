import fetch from 'node-fetch';

const instances = [
    'https://cobalt-api.meowing.de',
    'https://kityune.imput.net',
    'https://blossom.imput.net',
    'https://cobalt-backend.canine.tools',
    'https://capi.3kh0.net',
    'https://api.cobalt.tools', // Original (likely dead)
    'https://cobalt.oup.us.kg',
    'https://cobalt.kwiatekmiki.com'
];

const testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll

async function testInstances() {
    console.log('Testing Cobalt instances...');

    for (const instance of instances) {
        try {
            console.log(`\nTesting ${instance}...`);
            const response = await fetch(`${instance}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Origin': 'https://cobalt.tools'
                },
                body: JSON.stringify({
                    url: testVideoUrl,
                    downloadMode: 'audio',
                    audioFormat: 'mp3'
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ SUCCESS: ${instance}`);
                console.log(`   URL: ${data.url ? 'Has URL' : 'No URL'}`);
            } else {
                console.log(`❌ FAILED: ${instance} (Status: ${response.status})`);
                const text = await response.text();
                // console.log(`   Response: ${text.substring(0, 100)}`);
            }
        } catch (e) {
            console.log(`❌ ERROR: ${instance} (${e.message})`);
        }
    }
}

testInstances();
