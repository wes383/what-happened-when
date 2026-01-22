const WIKI_USER_AGENT = 'WhatHappenedWhen/1.0 (contact: why5807@gmail.com)';

const containsChinese = (text: string): boolean => {
    return /[\u4e00-\u9fa5]/.test(text);
};

export const fetchWikipediaData = async (term: string): Promise<{ title: string, content: string } | null> => {
    try {
        const searchParams = new URLSearchParams({
            action: 'query',
            list: 'search',
            srsearch: term,
            format: 'json',
            origin: '*'
        });

        const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?${searchParams.toString()}`, {
            headers: {
                'Api-User-Agent': WIKI_USER_AGENT
            }
        });
        const searchData = await searchRes.json();

        if (!searchData.query?.search?.length) {
            return null;
        }

        const bestTitle = searchData.query.search[0].title;

        const contentParams = new URLSearchParams({
            action: 'parse',
            page: bestTitle,
            prop: 'text',
            format: 'json',
            origin: '*',
            redirects: '1'
        });

        const contentRes = await fetch(`https://en.wikipedia.org/w/api.php?${contentParams.toString()}`, {
            headers: {
                'Api-User-Agent': WIKI_USER_AGENT
            }
        });
        const contentData = await contentRes.json();

        const html = contentData.parse?.text?.['*'];
        if (!html) return null;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const trash = doc.querySelectorAll('script, style, noscript, .mw-editsection, .reference, .reflist, .box-More_citations_needed');
        trash.forEach(el => el.remove());

        const textContent = doc.body.textContent || "";

        return {
            title: bestTitle,
            content: textContent
        };
    } catch (error) {
        return null;
    }
};
