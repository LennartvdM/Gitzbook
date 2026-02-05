# Deployment Guide

Gitzbook generates a fully static site that can be deployed to any static hosting provider. This guide covers the most popular options.

## Build your site

First, create a production build:

```bash
gitzbook build
```

The output is in the `dist/` directory by default.

## Vercel

### Automatic (recommended)

1. Push your repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set the following build settings:
   - **Build Command:** `gitzbook build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

Vercel will automatically redeploy on every push.

### Manual

```bash
npm install -g vercel
vercel --prod
```

## Netlify

### With `netlify.toml`

Create a `netlify.toml` in your project root:

```toml
[build]
  command = "gitzbook build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### With Netlify CLI

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## GitHub Pages

### Using GitHub Actions

Create `.github/workflows/docs.yml`:

```yaml
name: Deploy Docs

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm install
      - run: gitzbook build --base /your-repo-name/

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

Make sure to set `build.base` in your config if deploying to a subpath:

```yaml
# .gitzbook/config.yml
build:
  base: "/your-repo-name/"
```

## Cloudflare Pages

1. Connect your repository in Cloudflare Pages dashboard
2. Configure:
   - **Build command:** `gitzbook build`
   - **Build output directory:** `dist`
3. Deploy

Or use Wrangler:

```bash
npx wrangler pages deploy dist
```

## Docker

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx gitzbook build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Example `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ $uri.html /404.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Custom domain

For all providers, set the `site.url` in your config:

```yaml
site:
  url: "https://docs.yourdomain.com"
```

This ensures correct canonical URLs, sitemap generation, and social meta tags.

## Verifying your deployment

After deploying, run the built-in audit:

```bash
gitzbook audit https://docs.yourdomain.com
```

This checks for:
- Broken links
- Missing meta tags
- Accessibility issues
- Performance metrics
