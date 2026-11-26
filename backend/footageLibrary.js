const IMAGE_EXTENSIONS = /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)(?:[?#]|$)/i;

const isImage = (item) => item.fileKind === 'image' ||
    (item.fileKind !== 'video' && ((item.mediaType || '').startsWith('image/') ||
        IMAGE_EXTENSIONS.test(item.originalFileName || item.mediaUrl || item.videoUrl || '')));

function buildFootageCatalog(documents) {
    const records = documents.map((doc) => {
        const data = doc.data();
        const rawDate = data.createdAt;
        const date = rawDate?.toDate?.() || new Date(rawDate || NaN);
        const createdAt = Number.isFinite(date.getTime()) ? date.toISOString() : null;
        return { ...data, id: doc.id, createdAt };
    });
    records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '') || a.id.localeCompare(b.id));

    const groups = new Map();
    for (const record of records) {
        const key = record.uploadBatchId && Number(record.uploadBatchImageCount) > 1 && isImage(record)
            ? `image-batch:${record.uploadBatchId}`
            : `file:${record.id}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(record);
    }
    return Array.from(groups, ([key, items]) => ({ key, items }));
}

function paginateFootage(catalog, filters) {
    const fields = filters.productOnly ? ['deviceName'] : ['deviceName', 'species', 'description', 'location'];
    const matches = catalog.filter(({ items }) => items.some((item) => (
        (!filters.influencer || item.userId === filters.influencer) &&
        (!filters.date || item.createdAt?.startsWith(filters.date)) &&
        (!filters.search || fields.some((field) => String(item[field] || '').toLowerCase().includes(filters.search)))
    )));
    const previousIndex = filters.after ? matches.findIndex(({ key }) => key === filters.after) : -1;
    if (filters.after && previousIndex === -1) return null;

    const lastPage = Math.max(1, Math.ceil(matches.length / filters.limit));
    const pageNumber = filters.pageNumber ? Math.min(filters.pageNumber, lastPage) : undefined;
    const start = pageNumber ? (pageNumber - 1) * filters.limit : previousIndex + 1;
    const page = matches.slice(start, start + filters.limit);
    return {
        items: page.flatMap(({ items }) => items),
        total: matches.length,
        pageNumber,
        nextCursor: start + page.length < matches.length ? page.at(-1).key : null
    };
}

module.exports = { buildFootageCatalog, paginateFootage };
