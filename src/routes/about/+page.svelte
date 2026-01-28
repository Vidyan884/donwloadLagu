<script>
    import { t } from "$lib/i18n.js";
</script>

<svelte:head>
    <title>{$t.about} - MusicDownloader</title>
    <meta name="description" content={$t.aboutDesc1} />
</svelte:head>

<div class="about-container">
    <div class="glass content">
        <h1>{$t.aboutTitle}</h1>
        <p>{$t.aboutDesc1}</p>
        <p>{$t.aboutDesc2}</p>

        <h2>{$t.features}</h2>
        <ul>
            <li>{$t.feature1}</li>
            <li>{$t.feature2}</li>
            <li>{$t.feature3}</li>
            <li>{$t.feature4}</li>
        </ul>

        <div class="disclaimer">
            <h3>{$t.disclaimer}</h3>
            <p>{$t.disclaimerText}</p>
        </div>
    </div>
</div>

<style>
    .about-container {
        padding: 4rem 2rem;
        max-width: 800px;
        margin: 0 auto;
    }

    .content {
        padding: 3rem;
    }

    h1 {
        background: linear-gradient(to right, #00d2ff, #ff007a);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2.5rem;
        margin-bottom: 2rem;
    }

    h2 {
        margin-top: 2rem;
        font-size: 1.5rem;
    }

    p {
        line-height: 1.6;
        color: var(--text-muted);
        margin-bottom: 1.5rem;
        font-size: 1.1rem;
    }

    ul {
        list-style: none;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin: 2rem 0;
    }

    li {
        background: rgba(255, 255, 255, 0.05);
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid var(--glass-border);
    }

    .disclaimer {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid var(--glass-border);
    }

    .disclaimer h3 {
        color: #ff6b81;
    }
</style>
