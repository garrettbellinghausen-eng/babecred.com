# BabeCred.com — Starter Site

## Overview

A retro/ironic blog and content site for **babecred.com**. Built as a single-page HTML file with a cream & mustard palette, vintage typography (Anybody, Playfair Display, DM Mono), noise texture overlay, scrolling marquee, and a blog section called "The Ledger."

## Tech Stack (Recommended)

- **Framework**: Astro (static site generator, markdown-based blog)
- **Hosting**: Vercel (free tier)
- **Domain**: babecred.com (DNS pointed to Vercel)

## Setup Instructions

### 1. Create Astro Project

```bash
cd C:\Projects
npm create astro@latest babecred
cd babecred
npm install
```

### 2. Preview the Design

Open `index.html` (included below) directly in a browser to see the design. Then port the styles and structure into Astro layouts.

### 3. Astro Project Structure (Target)

```
babecred/
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro      # Head, nav, footer, global styles
│   ├── pages/
│   │   ├── index.astro            # Homepage (hero + latest posts)
│   │   └── blog/
│   │       └── [...slug].astro    # Dynamic blog post pages
│   ├── content/
│   │   └── blog/
│   │       ├── inaugural-cred-audit.md
│   │       ├── top-10-instant-babe-cred-moves.md
│   │       └── things-that-destroy-your-cred.md
│   └── styles/
│       └── global.css             # Extracted from index.html
├── public/
│   └── favicon.svg
├── astro.config.mjs
└── package.json
```

### 4. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Then point babecred.com DNS (Namecheap) to Vercel:
- A record → `76.76.21.21`
- CNAME `www` → `cname.vercel-dns.com`

---

## Design Spec

| Element | Choice |
|---|---|
| **Primary BG** | `#FFF8E7` (cream) |
| **Accent 1** | `#E8A317` (mustard) |
| **Accent 2** | `#CC5500` (burnt orange) |
| **Text** | `#3B1F0B` (deep brown) |
| **Secondary Text** | `#6B6B3C` (olive) |
| **Pop** | `#FF6B8A` (pink) |
| **Display Font** | Anybody (900, bold headlines) |
| **Serif Font** | Playfair Display (italic subheads) |
| **Body Font** | DM Mono (monospace, retro feel) |
| **Vibe** | Retro, ironic, self-aware humor |

---

## Sample Blog Post Ideas

- **The Inaugural Cred Audit** — What is babe cred and why it matters
- **Top 10 Instant Babe Cred Moves** — Parallel parking, knowing the bartender's name
- **Things That Quietly Destroy Your Cred** — Cargo shorts, reply-all, "I'm not like other guys"
- **The Dad Cred Paradox** — How kids simultaneously destroy and supercharge your cred
- **Babe Cred: A Seasonal Guide** — Summer cred vs. winter cred
- **The Cred Economy** — Can you borrow cred? Transfer it? Go into cred debt?

---

## Full HTML Source

Save the file below as `index.html` to preview the design locally.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BabeCred — Earn Yours</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Mono:wght@300;400;500&family=Anybody:wght@400;700;900&display=swap" rel="stylesheet">
<style>
  :root {
    --cream: #FFF8E7;
    --mustard: #E8A317;
    --burnt-orange: #CC5500;
    --deep-brown: #3B1F0B;
    --olive: #6B6B3C;
    --pink-pop: #FF6B8A;
    --sky-wash: #B8D4E3;
    --off-black: #1A1108;
    --tape-yellow: #F5E6A3;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: var(--cream);
    color: var(--off-black);
    font-family: 'DM Mono', monospace;
    overflow-x: hidden;
  }

  body::before {
    content: '';
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
  }

  header {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
    background:
      radial-gradient(ellipse at 20% 50%, rgba(232,163,23,0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 30%, rgba(255,107,138,0.1) 0%, transparent 50%),
      var(--cream);
  }

  .stamp {
    position: absolute;
    top: 2rem;
    right: 2rem;
    width: 100px;
    height: 100px;
    border: 3px solid var(--burnt-orange);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(12deg);
    font-family: 'Anybody', sans-serif;
    font-weight: 900;
    font-size: 0.65rem;
    text-transform: uppercase;
    color: var(--burnt-orange);
    letter-spacing: 0.1em;
    line-height: 1.2;
    animation: stampIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s both;
  }

  @keyframes stampIn {
    from { transform: rotate(12deg) scale(2); opacity: 0; }
    to { transform: rotate(12deg) scale(1); opacity: 1; }
  }

  .nav-strip {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2.5rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--olive);
  }

  .nav-strip a {
    color: var(--olive);
    text-decoration: none;
    position: relative;
  }

  .nav-strip a::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1px;
    background: var(--burnt-orange);
    transition: width 0.3s;
  }

  .nav-strip a:hover::after { width: 100%; }

  .nav-links { display: flex; gap: 2rem; }

  .hero-title {
    font-family: 'Anybody', sans-serif;
    font-weight: 900;
    font-size: clamp(4rem, 15vw, 12rem);
    line-height: 0.9;
    color: var(--deep-brown);
    text-transform: uppercase;
    letter-spacing: -0.03em;
    animation: titleReveal 1s ease-out both;
  }

  .hero-title .line2 {
    color: var(--burnt-orange);
    font-style: italic;
    font-family: 'Playfair Display', serif;
    text-transform: lowercase;
    font-weight: 700;
    letter-spacing: 0.02em;
    font-size: 0.45em;
    display: block;
    margin-top: 0.1em;
  }

  @keyframes titleReveal {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .tagline {
    margin-top: 2rem;
    font-size: 0.85rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--olive);
    animation: fadeUp 0.8s ease-out 0.4s both;
  }

  .tagline span {
    display: inline-block;
    background: var(--tape-yellow);
    padding: 0.3em 0.8em;
    transform: rotate(-1deg);
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .scroll-hint {
    position: absolute;
    bottom: 2rem;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--olive);
    opacity: 0.5;
    animation: bob 2s ease-in-out infinite;
  }

  @keyframes bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(8px); }
  }

  .divider-strip {
    background: var(--off-black);
    color: var(--cream);
    padding: 0.8rem 0;
    overflow: hidden;
    white-space: nowrap;
  }

  .divider-strip .marquee {
    display: inline-block;
    animation: marquee 20s linear infinite;
    font-family: 'DM Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
  }

  @keyframes marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  .what-is {
    max-width: 720px;
    margin: 0 auto;
    padding: 6rem 2rem;
    text-align: center;
  }

  .what-is h2 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.8rem, 4vw, 3rem);
    font-weight: 400;
    font-style: italic;
    color: var(--deep-brown);
    margin-bottom: 1.5rem;
  }

  .what-is p {
    font-size: 0.9rem;
    line-height: 1.9;
    color: var(--olive);
  }

  .what-is .definition {
    margin-top: 2.5rem;
    border: 2px solid var(--deep-brown);
    padding: 2rem;
    position: relative;
    text-align: left;
  }

  .definition .word {
    font-family: 'Anybody', sans-serif;
    font-weight: 900;
    font-size: 1.5rem;
    color: var(--burnt-orange);
  }

  .definition .phonetic {
    font-style: italic;
    color: var(--olive);
    font-size: 0.8rem;
    margin: 0.3rem 0 1rem;
  }

  .definition .meaning {
    font-size: 0.85rem;
    line-height: 1.8;
    color: var(--deep-brown);
  }

  .definition .label {
    position: absolute;
    top: -0.6em;
    left: 1.5rem;
    background: var(--cream);
    padding: 0 0.5rem;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--olive);
  }

  .blog-section {
    background:
      linear-gradient(180deg, var(--cream) 0%, #F5EDD6 100%);
    padding: 5rem 2rem 6rem;
  }

  .blog-section h2 {
    text-align: center;
    font-family: 'Anybody', sans-serif;
    font-weight: 900;
    font-size: clamp(2rem, 5vw, 3.5rem);
    text-transform: uppercase;
    color: var(--deep-brown);
    margin-bottom: 3rem;
    letter-spacing: -0.02em;
  }

  .blog-grid {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .blog-post {
    border-top: 1px solid var(--deep-brown);
    padding: 2rem 0;
    display: grid;
    grid-template-columns: 100px 1fr auto;
    gap: 2rem;
    align-items: start;
    transition: background 0.3s;
    cursor: pointer;
  }

  .blog-post:last-child {
    border-bottom: 1px solid var(--deep-brown);
  }

  .blog-post:hover {
    background: rgba(232,163,23,0.06);
  }

  .blog-post .date {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--olive);
    padding-top: 0.3rem;
  }

  .blog-post .post-content h3 {
    font-family: 'Playfair Display', serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--deep-brown);
    margin-bottom: 0.5rem;
  }

  .blog-post .post-content p {
    font-size: 0.8rem;
    line-height: 1.7;
    color: var(--olive);
  }

  .blog-post .tag {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    padding: 0.3em 0.8em;
    border: 1px solid var(--burnt-orange);
    color: var(--burnt-orange);
    white-space: nowrap;
    align-self: center;
  }

  .newsletter {
    background: var(--off-black);
    color: var(--cream);
    padding: 5rem 2rem;
    text-align: center;
  }

  .newsletter h2 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.5rem, 3.5vw, 2.5rem);
    font-weight: 400;
    font-style: italic;
    margin-bottom: 1rem;
  }

  .newsletter p {
    font-size: 0.8rem;
    color: rgba(255,248,231,0.5);
    margin-bottom: 2rem;
    letter-spacing: 0.1em;
  }

  .newsletter .email-form {
    display: flex;
    gap: 0;
    max-width: 440px;
    margin: 0 auto;
  }

  .newsletter input[type="email"] {
    flex: 1;
    padding: 0.9rem 1.2rem;
    font-family: 'DM Mono', monospace;
    font-size: 0.8rem;
    border: 2px solid var(--cream);
    background: transparent;
    color: var(--cream);
    outline: none;
  }

  .newsletter input[type="email"]::placeholder {
    color: rgba(255,248,231,0.3);
  }

  .newsletter button {
    padding: 0.9rem 1.8rem;
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    background: var(--mustard);
    color: var(--off-black);
    border: 2px solid var(--mustard);
    cursor: pointer;
    transition: all 0.3s;
    font-weight: 500;
  }

  .newsletter button:hover {
    background: var(--burnt-orange);
    border-color: var(--burnt-orange);
    color: var(--cream);
  }

  footer {
    background: var(--off-black);
    border-top: 1px solid rgba(255,248,231,0.1);
    color: rgba(255,248,231,0.3);
    padding: 2rem;
    text-align: center;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  @media (max-width: 640px) {
    .blog-post {
      grid-template-columns: 1fr;
      gap: 0.8rem;
    }
    .blog-post .tag {
      justify-self: start;
    }
    .stamp { display: none; }
    .newsletter .email-form {
      flex-direction: column;
    }
    .nav-links { gap: 1rem; }
  }
</style>
</head>
<body>

<header>
  <nav class="nav-strip">
    <div class="logo-mark" style="font-family:'Anybody',sans-serif;font-weight:900;font-size:0.85rem;color:var(--deep-brown);">BC</div>
    <div class="nav-links">
      <a href="#what">What?</a>
      <a href="#blog">Blog</a>
      <a href="#subscribe">Subscribe</a>
    </div>
  </nav>

  <div class="stamp">Est.<br>2026<br>✦</div>

  <h1 class="hero-title">
    Babe
    <span class="line2">Cred</span>
  </h1>
  <div class="tagline"><span>You either have it or you don't.</span></div>

  <div class="scroll-hint">↓ scroll down ↓</div>
</header>

<div class="divider-strip">
  <div class="marquee">
    ✦ BABE CRED ✦ EARN IT ✦ LOSE IT ✦ RESPECT IT ✦ BABE CRED ✦ EARN IT ✦ LOSE IT ✦ RESPECT IT ✦ BABE CRED ✦ EARN IT ✦ LOSE IT ✦ RESPECT IT ✦ BABE CRED ✦ EARN IT ✦ LOSE IT ✦ RESPECT IT ✦
  </div>
</div>

<section class="what-is" id="what">
  <h2>So... what is Babe Cred?</h2>
  <p>
    It's that ineffable quality. The thing that makes someone undeniably,
    magnetically attractive — and it's not what you think. It's earned,
    not bought. Accumulated, not faked. A running ledger of the things
    you do (and don't do) that make people go <em>"damn."</em>
  </p>

  <div class="definition">
    <span class="label">Dictionary Entry</span>
    <div class="word">babe cred</div>
    <div class="phonetic">/beɪb krɛd/ · noun · informal</div>
    <div class="meaning">
      <strong>1.</strong> The intangible social currency earned through acts
      of genuine confidence, effortless style, and being annoyingly good at
      things no one asked you to be good at.<br><br>
      <strong>2.</strong> A metric that cannot be self-assessed — only
      observed by others.<br><br>
      <em>"He lost all his babe cred when he wore those shoes unironically."</em>
    </div>
  </div>
</section>

<section class="blog-section" id="blog">
  <h2>The Ledger</h2>

  <div class="blog-grid">
    <article class="blog-post">
      <div class="date">Apr 01<br>2026</div>
      <div class="post-content">
        <h3>The Inaugural Cred Audit</h3>
        <p>Welcome to BabeCred. Let's talk about what this is, why it matters, and why your friend Chad has more of it than he deserves.</p>
      </div>
      <span class="tag">Manifesto</span>
    </article>

    <article class="blog-post">
      <div class="date">Coming<br>Soon</div>
      <div class="post-content">
        <h3>Top 10 Instant Babe Cred Moves</h3>
        <p>Parallel parking on the first try. Knowing the bartender's name. The complete, unranked list.</p>
      </div>
      <span class="tag">Field Guide</span>
    </article>

    <article class="blog-post">
      <div class="date">Coming<br>Soon</div>
      <div class="post-content">
        <h3>Things That Quietly Destroy Your Cred</h3>
        <p>A public service announcement about cargo shorts, reply-all emails, and saying "I'm not like other guys."</p>
      </div>
      <span class="tag">PSA</span>
    </article>

    <article class="blog-post">
      <div class="date">Coming<br>Soon</div>
      <div class="post-content">
        <h3>The Dad Cred Paradox</h3>
        <p>How having kids simultaneously destroys and supercharges your babe cred. A scientific inquiry.</p>
      </div>
      <span class="tag">Research</span>
    </article>
  </div>
</section>

<section class="newsletter" id="subscribe">
  <h2>Get credentialed.</h2>
  <p>New dispatches from the babe cred bureau, occasionally.</p>
  <div class="email-form">
    <input type="email" placeholder="your@email.com">
    <button type="submit">Subscribe</button>
  </div>
</section>

<footer>
  &copy; 2026 BabeCred.com ✦ A very serious publication ✦ All cred reserved
</footer>

</body>
</html>
```
