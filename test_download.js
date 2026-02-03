// Quick test for download API
async function testDownload() {
    console.log('Testing download API...');
    try {
        const res = await fetch('http://localhost:5173/api/download?id=dQw4w9WgXcQ');
        console.log('Status:', res.status, res.statusText);
        console.log('Content-Type:', res.headers.get('content-type'));
        console.log('Content-Disposition:', res.headers.get('content-disposition'));

        if (res.ok) {
            const blob = await res.blob();
            console.log('✅ Download success! Size:', blob.size, 'bytes');
        } else {
            const text = await res.text();
            console.log('❌ Download failed:', text);
        }
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

testDownload();
