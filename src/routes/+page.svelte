<script>
    import {
        Search,
        Download,
        Play,
        Pause,
        Link,
        Youtube,
        Music,
    } from "lucide-svelte";
    import { t } from "$lib/i18n.js";

    let query = "";
    let loading = false;
    /**
     * @typedef {Object} Song
     * @property {string|number} id
     * @property {string} title
     * @property {string} artist
     * @property {string} duration
     * @property {string} cover
     */

    /** @type {Song[]} */
    let results = [];

    // Mock data removed

    let errorMsg = "";

    async function handleSearch() {
        if (!query) return;
        loading = true;
        results = [];
        errorMsg = "";

        try {
            const res = await fetch(
                `/api/search?q=${encodeURIComponent(query)}`,
            );
            if (res.ok) {
                results = await res.json();
                if (results.length === 0) {
                    errorMsg = "No results found.";
                }
            } else {
                errorMsg = "Search failed. Please try again.";
            }
        } catch (e) {
            errorMsg = "Network error.";
            console.error(e);
        } finally {
            loading = false;
        }
    }

    /** @param {KeyboardEvent} e */
    function handleKeydown(e) {
        if (e.key === "Enter") handleSearch();
    }

    // URL Download Feature
    let urlInput = "";
    let urlLoading = false;
    let urlResult =
        /** @type {{ id: string; title: string; platform: string; thumbnail: string; downloadUrl: string } | null} */ (
            null
        );
    let urlError = "";

    async function handleUrlDownload() {
        if (!urlInput) return;
        urlLoading = true;
        urlResult = null;
        urlError = "";

        try {
            const res = await fetch(
                `/api/url-download?url=${encodeURIComponent(urlInput)}`,
            );
            if (res.ok) {
                urlResult = await res.json();
            } else {
                const err = await res.json();
                urlError = err.message || "Failed to process URL";
            }
        } catch (e) {
            urlError = "Network error. Please try again.";
        } finally {
            urlLoading = false;
        }
    }

    /** @param {KeyboardEvent} e */
    function handleUrlKeydown(e) {
        if (e.key === "Enter") handleUrlDownload();
    }

    // Download Handler
    let downloadingIds = new Set();

    /** @param {string} id
     * @param {string} filename */
    async function handleDownload(id, filename) {
        if (downloadingIds.has(id)) return;
        downloadingIds.add(id);
        downloadingIds = downloadingIds; // trigger reactivity
        errorMsg = "";

        try {
            const res = await fetch(`/api/download?id=${id}`);

            if (!res.ok) {
                const data = await res.json();
                throw new Error(
                    data.message || data.error || "Download failed",
                );
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = `${filename}.mp3`;
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);
        } catch (e) {
            console.error(e);
            const msg = e instanceof Error ? e.message : String(e);
            errorMsg = `Gagal mendownload: ${msg}. Coba lagu lain.`;
        } finally {
            downloadingIds.delete(id);
            downloadingIds = downloadingIds; // trigger reactivity
        }
    }
</script>

<svelte:head>
    <title>{$t.home} - MusicDownloader</title>
    <meta name="description" content={$t.heroSubtitle} />
</svelte:head>

<div class="hero">
    <div class="content">
        <h1>
            {$t.heroTitle1} <br /><span class="highlight">{$t.heroTitle2}</span>
        </h1>
        <p class="subtitle">{$t.heroSubtitle}</p>

        <div class="search-box glass">
            <Search class="icon" size={24} color="var(--text-muted)" />
            <input
                type="text"
                placeholder={$t.searchPlaceholder}
                bind:value={query}
                on:keydown={handleKeydown}
            />
            <button class="btn" on:click={handleSearch} disabled={loading}>
                {#if loading}
                    {$t.processing}
                {:else}
                    {$t.searchBtn}
                {/if}
            </button>
        </div>

        {#if errorMsg}
            <div class="error-msg">
                {errorMsg}
            </div>
        {/if}
    </div>
</div>

<!-- URL Download Section -->
<div class="url-section">
    <div class="url-container glass">
        <h2><Link size={24} /> {$t.urlTitle}</h2>
        <p class="url-desc">{$t.urlDesc}</p>

        <div class="url-input-box">
            <input
                type="url"
                placeholder={$t.urlPlaceholder}
                bind:value={urlInput}
                on:keydown={handleUrlKeydown}
            />
            <button
                class="btn"
                on:click={handleUrlDownload}
                disabled={urlLoading}
            >
                {#if urlLoading}
                    {$t.processing}
                {:else}
                    <Download size={18} /> {$t.getAudio}
                {/if}
            </button>
        </div>

        {#if urlError}
            <div class="url-error">{urlError}</div>
        {/if}

        {#if urlResult}
            <div class="url-result glass">
                <img
                    src={urlResult.thumbnail}
                    alt={urlResult.title}
                    class="url-thumb"
                />
                <div class="url-info">
                    <span class="platform-badge">{urlResult.platform}</span>
                    <h3>{urlResult.title}</h3>
                    <button
                        class="btn"
                        on:click={() =>
                            urlResult &&
                            handleDownload(urlResult.id, urlResult.title)}
                        disabled={urlResult && downloadingIds.has(urlResult.id)}
                    >
                        {#if urlResult && downloadingIds.has(urlResult.id)}
                            {$t.processing}
                        {:else}
                            <Download size={18} /> {$t.downloadMp3}
                        {/if}
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>

<div class="results-container">
    {#if results.length > 0}
        <div class="grid">
            {#each results as song}
                <div class="song-card glass">
                    <div class="cover">
                        <img src={song.cover} alt={song.title} />
                        <div class="overlay">
                            <button
                                class="btn-icon btn-play"
                                on:click={() =>
                                    handleDownload(
                                        String(song.id),
                                        String(song.title),
                                    )}
                            >
                                <Download size={24} color="white" />
                            </button>
                        </div>
                    </div>
                    <div class="info">
                        <h3>{song.title}</h3>
                        <p>{song.artist}</p>
                    </div>
                    <div class="actions">
                        <button
                            on:click={() =>
                                handleDownload(
                                    String(song.id),
                                    String(song.title),
                                )}
                            class="btn btn-sm"
                            disabled={downloadingIds.has(song.id)}
                        >
                            {#if downloadingIds.has(song.id)}
                                {$t.processing}
                            {:else}
                                <Download size={18} /> {$t.download}
                            {/if}
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {:else if !loading && !query && results.length === 0}
        <!-- Empty state or initial state can go here if needed -->
    {/if}
</div>

<style>
    .error-msg {
        background: rgba(255, 71, 87, 0.2);
        color: #ff6b81;
        padding: 10px;
        border-radius: 8px;
        margin-top: 1rem;
        border: 1px solid rgba(255, 71, 87, 0.3);
    }
    .hero {
        min-height: 60vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 2rem;
    }

    h1 {
        font-size: 3.5rem;
        line-height: 1.2;
        margin-bottom: 1rem;
        font-weight: 700;
    }

    .highlight {
        background: linear-gradient(to right, #00d2ff, #ff007a);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .subtitle {
        font-size: 1.2rem;
        color: var(--text-muted);
        margin-bottom: 3rem;
    }

    .search-box {
        display: flex;
        align-items: center;
        padding: 8px 8px 8px 24px;
        max-width: 600px;
        margin: 0 auto;
        transition: transform 0.3s;
    }

    .search-box:focus-within {
        transform: scale(1.02);
        border-color: var(--primary);
    }

    input {
        flex: 1;
        background: transparent;
        border: none;
        padding: 12px;
        color: white;
        font-size: 1.1rem;
        font-family: inherit;
        outline: none;
    }

    input::placeholder {
        color: rgba(255, 255, 255, 0.4);
    }

    /* Results Grid */
    .results-container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 2rem;
    }

    .song-card {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        transition: all 0.3s ease;
    }

    .song-card:hover {
        transform: translateY(-5px);
        background: rgba(255, 255, 255, 0.1);
    }

    .cover {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 1rem;
        position: relative;
    }

    .cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s;
    }

    .cover:hover .overlay {
        opacity: 1;
    }

    .btn-play {
        background: var(--primary);
        border: none;
        border-radius: 50%;
        padding: 16px;
        cursor: pointer;
        transform: scale(0.8);
        transition: transform 0.2s;
    }

    .btn-play:hover {
        transform: scale(1);
    }

    .info h3 {
        margin: 0.5rem 0 0.2rem;
        font-size: 1.2rem;
    }

    .info p {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.9rem;
    }

    .actions {
        margin-top: 1.5rem;
        width: 100%;
    }

    .actions .btn {
        width: 100%;
        justify-content: center;
        font-size: 0.9rem;
    }

    /* URL Download Section */
    .url-section {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto 2rem;
    }

    .url-container {
        padding: 2rem;
        text-align: center;
    }

    .url-container h2 {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        font-size: 1.5rem;
    }

    .url-desc {
        color: var(--text-muted);
        margin-bottom: 1.5rem;
        font-size: 1.1rem;
    }

    .url-input-box {
        display: flex;
        gap: 0.5rem;
        max-width: 600px;
        margin: 0 auto;
    }

    .url-input-box input {
        flex: 1;
        padding: 14px 20px;
        border-radius: 50px;
        border: 1px solid var(--glass-border);
        background: rgba(255, 255, 255, 0.05);
        color: white;
        font-size: 1rem;
    }

    .url-error {
        color: #ff4757;
        margin-top: 1rem;
        font-size: 0.9rem;
    }

    .url-result {
        display: flex;
        gap: 1.5rem;
        margin-top: 2rem;
        padding: 1.5rem;
        text-align: left;
        align-items: center;
    }

    .url-thumb {
        width: 120px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
    }

    .url-info {
        flex: 1;
    }

    .url-info h3 {
        margin: 0.5rem 0;
        font-size: 1.1rem;
    }

    .platform-badge {
        display: inline-block;
        padding: 4px 10px;
        background: linear-gradient(90deg, var(--secondary), var(--primary));
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    @media (max-width: 600px) {
        .url-input-box {
            flex-direction: column;
        }
        .url-result {
            flex-direction: column;
            text-align: center;
        }
        .url-thumb {
            width: 100%;
            height: auto;
            aspect-ratio: 16/9;
        }
    }
</style>
