# Quick Start Guide

## 🚀 Getting Started in 3 Steps

### 1. Install Dependencies

```bash
cd static-site
npm install
```

### 2. Generate Data

```bash
npm run build:data
```

This will:

- Scan all schemas in `../schemas/`
- Parse TypeScript definitions from `../build/schemas/`
- Generate data files in `public/data/`:
  - `schemas.json` - All schema metadata
  - `graph.json` - Dependency graph
  - `configs.json` - Default configurations

### 3. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:4321/schemas/

## 📦 Available Scripts

| Command              | Description                                     |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Start development server                        |
| `npm run build`      | Build for production (includes data generation) |
| `npm run build:data` | Generate data files only                        |
| `npm run preview`    | Preview production build                        |

## 🏗️ Making Changes

### Adding a New Page

Create a new `.astro` file in `src/pages/`:

```astro
---
import Layout from '@/components/Layout.astro';
---

<Layout title="New Page">
  <h1>New Page</h1>
</Layout>
```

### Adding a React Component

Create a new `.tsx` file in `src/components/`:

```tsx
export default function MyComponent() {
  return <div>Hello from React!</div>;
}
```

Use it in Astro with a client directive:

```astro
<MyComponent client:load />
```

### Styling

Use Tailwind utility classes:

```astro
<div class="p-4 bg-card rounded-lg border">
  <h2 class="text-2xl font-bold mb-2">Title</h2>
  <p class="text-muted-foreground">Description</p>
</div>
```

## 🎨 Client Directives

Choose the right hydration strategy:

```astro
<!-- Load immediately (critical UI) -->
<SearchBar client:load />
<GraphWithSearch data={graphData} client:only="react" />

<!-- Load when visible (below fold) -->
<CodeViewer code={data} client:visible />

<!-- Load when browser idle (non-critical) -->
<Analytics client:idle />

<!-- No directive = static HTML only -->
<StaticComponent />
```

## 🔍 Using the Search Feature

The site includes a powerful full-text search:

1. **Open Search**: Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux)
2. **Search**: Type your query (searches titles, descriptions, paths, and content)
3. **View Matches**: See highlighted match previews showing where the term was found
4. **Navigate**: Click a result to view the schema or focus it in the graph
5. **Close**: Press `Esc` or click outside the modal

### Search Features

- Searches across schema titles, descriptions, hierarchical paths, and full content
- Shows contextual match previews with highlighting
- Displays which field matched (title, description, path, or content property)
- Works on all pages (on graph page, clicking a result focuses that node)
- Fast FlexSearch indexing for instant results

## 📁 Key Files

- `src/pages/index.astro` - Home page
- `src/pages/schema/[...path].astro` - Schema detail page (dynamic route)
- `src/pages/graph.astro` - Interactive dependency graph page
- `src/components/Layout.astro` - Main layout wrapper
- `src/components/Sidebar.astro` - Navigation sidebar
- `src/components/SearchBar.tsx` - Full-text search with FlexSearch
- `src/components/ForceGraph.tsx` - Cytoscape.js graph visualization
- `src/components/GraphWithSearch.tsx` - Graph + Search integration
- `src/components/ui/dialog.tsx` - Modal dialog component
- `src/styles/globals.css` - Global styles and Tailwind
- `scripts/buildSchemaData.ts` - Data generation script
- `scripts/buildGraphData.ts` - Graph data generation script

## 🐛 Troubleshooting

### Error: Cannot find data files

**Solution**: Run `npm run build:data` before starting dev server

### TypeScript errors on imports

**Solution**: These are expected before first build. Run `npm run build:data` to generate the data files.

### Dark mode not working

**Solution**: Check that `localStorage` is accessible and the inline script in `Layout.astro` is executing.

### Tailwind classes not applied

**Solution**: Ensure Tailwind CSS v3.4.x is installed (not v4). Check `package.json`.

### Dev server won't start

**Solution**:

1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Run `npm run build:data`
4. Run `npm run dev`

## 🚀 Deploying to Production

### Build

```bash
npm run build
```

Output will be in `dist/` directory.

### Deploy

The site is configured for GitHub Pages at `/schemas/` base path.

Deploy the `dist/` folder to:

- GitHub Pages
- Netlify
- Vercel
- Any static hosting

### Environment

The site requires no environment variables or runtime servers. It's 100% static.

## 📚 Learn More

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS](https://tailwindcss.com)
- [React](https://react.dev)

Happy coding! 🎉
