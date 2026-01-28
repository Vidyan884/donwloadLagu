<script>
    import "../app.css";
    import { locale, t, toggleLocale } from "$lib/i18n.js";
</script>

<div class="app-container">
    <header class="glass">
        <div class="logo">🎵 MusicDownloader</div>
        <nav>
            <a href="/">{$t.home}</a>
            <a href="/about">{$t.about}</a>
            <button class="lang-toggle" on:click={toggleLocale}>
                {$locale === "en" ? "🇮🇩 ID" : "🇺🇸 EN"}
            </button>
        </nav>
    </header>

    <main>
        <slot />
    </main>
</div>

<style>
    .app-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        position: fixed;
        top: 1rem;
        left: 1rem;
        right: 1rem;
        z-index: 100;
    }

    .logo {
        font-weight: 700;
        font-size: 1.5rem;
        background: linear-gradient(to right, #00d2ff, #3a7bd5);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    nav {
        display: flex;
        align-items: center;
        gap: 2rem;
    }

    nav a {
        font-weight: 500;
        opacity: 0.8;
        transition: opacity 0.2s;
    }

    nav a:hover {
        opacity: 1;
        color: var(--primary);
    }

    .lang-toggle {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.2s;
    }

    .lang-toggle:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    main {
        flex: 1;
        padding-top: 6rem;
    }
</style>
