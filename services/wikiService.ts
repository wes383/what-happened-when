// Helper function to search and fetch Wikipedia content
export const fetchWikipediaData = async (term: string): Promise<{ title: string, content: string } | null> => {
    try {
        // 1. Search for the most relevant page title
        const searchParams = new URLSearchParams({
            action: 'query',
            list: 'search',
            srsearch: term,
            format: 'json',
            origin: '*'
        });

        const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?${searchParams.toString()}`);
        const searchData = await searchRes.json();

        if (!searchData.query?.search?.length) {
            return null;
        }

        const bestTitle = searchData.query.search[0].title;

        // 2. Fetch the FULL HTML content using 'parse'
        const contentParams = new URLSearchParams({
            action: 'parse',
            page: bestTitle,
            prop: 'text',
            format: 'json',
            origin: '*',
            redirects: '1'
        });

        const contentRes = await fetch(`https://en.wikipedia.org/w/api.php?${contentParams.toString()}`);
        const contentData = await contentRes.json();

        const html = contentData.parse?.text?.['*'];
        if (!html) return null;

        // 3. Client-side HTML stripping to get raw text
        // We use DOMParser to safely extract text content from the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Remove script, style, and noisy elements to save tokens
        const trash = doc.querySelectorAll('script, style, noscript, .mw-editsection, .reference, .reflist, .box-More_citations_needed');
        trash.forEach(el => el.remove());

        const textContent = doc.body.textContent || "";

        return {
            title: bestTitle,
            content: textContent
        };
    } catch (error) {
        console.warn(`Wiki fetch failed for ${term}`, error);
        return null;
    }
};
