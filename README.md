# What Happened When...

A web application that merges historical timelines of multiple subjects to discover fascinating connections across time.

## Features

- **Multi-Subject Timelines**: Compare and merge timelines for any combination of people, companies, countries, or events
- **AI-Powered**: Leverages Google Gemini or OpenAI-compatible APIs to generate comprehensive historical timelines
- **Wikipedia Integration**: Automatically fetches Wikipedia data for accurate historical context
- **Interactive Visualization**: Beautiful, color-coded timeline display with filtering capabilities

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- An API key from Google Gemini or an OpenAI-compatible provider

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## Usage

1. Enter subjects you want to compare (e.g., "Apple Inc.", "Microsoft", "Google")
2. Click "Generate Timeline"
3. Explore the merged timeline showing interconnected historical events
4. Filter by subject using the color-coded buttons
5. Use the quick samples in the History section for inspiration

## Technology Stack

- **React** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Google Generative AI SDK** and **OpenAI SDK**
- **Lucide React** for icons
