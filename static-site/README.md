# MapColonies Schema Documentation Site

Static documentation site for browsing and visualizing MapColonies JSON Schemas. Built with Astro + React islands for optimal performance.

## 🚀 Features

- **Static-First Architecture** - Fast, SEO-friendly pages with minimal JavaScript
- **Full-Text Search** - Powerful search across schema titles, descriptions, paths, and content with contextual match previews
- **Interactive Components** - React islands for search, code viewers, and visualizations
- **Schema Browser** - Browse schemas by category with full metadata
- **Dependency Visualization** - Interactive Cytoscape.js graph with hierarchical layout
- **TypeScript Types** - See generated TypeScript definitions for each schema
- **Default Configs** - Copy-paste default configuration examples
- **Dark Mode** - Beautiful dark theme with persistent preference
- **Responsive Design** - Mobile-friendly layout with collapsible sidebar

## �️ Technology Stack

### Core

- **Astro** - Static site generator with island architecture
- **React 18** - For interactive components (islands)
- **TypeScript** - Type safety throughout

### UI & Styling

- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **CodeMirror 6** - Syntax-highlighted code viewer
- **Cytoscape.js** - Interactive graph visualization with dagre layout
- **FlexSearch** - Fast full-text search indexing

### Build Tools

- **tsx** - TypeScript execution for build scripts
- **glob** - File pattern matching

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Navigate to the static-site directory
cd static-site

# Install dependencies
npm install
```

### Development

```bash
# Generate data files from schemas
npm run build:data

# Start development server
npm run dev

# Visit http://localhost:4321/schemas
```

### Production Build

```bash
# Build static site (includes data generation)
npm run build

# Preview production build
npm run preview
```

The production build outputs to `dist/` directory and can be deployed to any static hosting service.

## 📝 Build Process

The site build happens in two phases:

### 1. Data Generation (`npm run build:data`)

Three scripts process the schema repository into consumable JSON:

#### `buildSchemaData.ts`

- Scans `../schemas/` for all `.schema.json` files
- Extracts metadata: title, description, version, category
- Finds external references (dependencies)
- Locates corresponding TypeScript definitions from `../build/`
- Checks for config files
- Calculates reverse dependencies
- Outputs `public/data/schemas.json`

#### `buildGraphData.ts`

- Reads schema metadata
- Builds graph nodes (schemas) and edges (dependencies)
- Calculates node degrees (connection counts)
- Outputs `public/data/graph.json`

#### `buildConfigData.ts`

- Finds all `.configs.json` files
- Groups configs by schema
- Outputs `public/data/configs.json`

### 2. Static Site Generation (`astro build`)

Astro reads the JSON data files and generates:

- Static HTML pages for all routes
- Minified CSS bundle
- Code-split JavaScript for React islands
- Optimized assets

## 🏗️ Architecture

### Astro Island Architecture

The site uses Astro's "island architecture" for optimal performance:

- **Static by Default** - Most content is pre-rendered HTML with zero JavaScript
- **Selective Hydration** - Only interactive components load JavaScript
- **Progressive Enhancement** - Site works without JS, enhances with islands

### React Islands

Interactive components use hydration directives:

```astro
<!-- Load immediately (critical) -->
<SearchBar client:load />

<!-- Load when visible (below fold) -->
<CodeViewer code={schema} client:visible />

<!-- Load when browser idle (non-critical) -->
<Analytics client:idle />
```

### Data Flow

```
schemas/ (source files)
    ↓
scripts/ (build-time processing)
    ↓
public/data/*.json (generated data)
    ↓
Astro build (static generation)
    ↓
dist/ (static HTML + JS islands)
    ↓
User browser (GitHub Pages)
```

## 🎨 Styling

The site uses Tailwind CSS with:

- **Dark Mode** - Class-based dark mode with `dark:` variants
- **CSS Variables** - Customizable color palette
- **Responsive Design** - Mobile-first breakpoints
- **Custom Components** - Pre-styled UI components

## 📄 Pages

### Home (`/schemas/`)

- Category overview with schema counts
- Getting started guide
- Quick access links
- Full-text search accessible via ⌘K/Ctrl+K

### Schema Detail (`/schemas/schema/{path}/v{version}`)

- Schema metadata and description
- Copyable schema ID
- Breadcrumb navigation
- Tabbed interface:
  - **Raw Schema** - JSON with syntax highlighting
  - **TypeScript** - Generated type definitions
  - **Documentation** - Human-readable property table
  - **Configs** - Default configuration examples (if available)
- Dependencies section showing references and reverse references
- Full-text search accessible from header

### Graph View (`/schemas/graph`)

- Interactive Cytoscape.js visualization with hierarchical left-to-right layout
- Schema dependency graph with focus mode
- Integrated search with automatic graph focusing
- Click nodes to navigate to schema details
- Hover tooltips for schema information
- Visual legend with category colors and controls
- Connection statistics
- Most connected schemas list

## 🚀 Deployment

The site is designed to be deployed to GitHub Pages:

1. Build the site: `npm run build`
2. Deploy the `dist/` folder to GitHub Pages
3. Site will be available at `https://mapcolonies.github.io/schemas/`

The base path `/schemas` is configured in `astro.config.mjs`.

## 📊 Performance

### Metrics

- **Initial Load** - < 50KB JavaScript (only for islands)
- **First Contentful Paint** - < 1s on 3G
- **Time to Interactive** - < 2s on 3G
- **Lighthouse Score** - 95+ (Performance, Accessibility, SEO)

### Optimizations

- Static HTML generation (no runtime rendering)
- Code splitting per island
- Lazy loading for below-the-fold content
- Minimal CSS with Tailwind purging
- Data preloaded at build time

## 🐛 Troubleshooting

### Data files not found

Run `npm run build:data` before starting the dev server.

### TypeScript errors for imports

These are expected before the first build. The data files don't exist until you run `build:data`.

### Dark mode not persisting

Check that the inline script in `Layout.astro` is executing before the page renders.

### Tailwind classes not working

Ensure Tailwind CSS v3.4.x is installed (not v4.x) for compatibility with @astrojs/tailwind.

## 📚 Resources

- [Astro Documentation](https://docs.astro.build)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [CodeMirror 6](https://codemirror.net)
- [Cytoscape.js](https://js.cytoscape.org)
- [FlexSearch](https://github.com/nextapps-de/flexsearch)
