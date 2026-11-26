import { useCallback, useEffect, useRef, useState } from 'react';
import { auth } from '../../firebase';
import { API_URL } from '../../config';
import { detectFootageKind } from '../../utils/uploadFootage';

const PAGE_SIZE = 8;

function groupLegacyFootage(items, { search, searchByProductOnly, influencer, date }) {
    const groups = new Map();
    const term = (search || '').trim().toLowerCase();
    const fields = searchByProductOnly ? ['deviceName'] : ['deviceName', 'species', 'description', 'location'];

    for (const item of items) {
        const key = item.uploadBatchId && Number(item.uploadBatchImageCount) > 1 && detectFootageKind(item) === 'image'
            ? `batch:${item.uploadBatchId}`
            : `file:${item.id}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
    }

    return [...groups.values()].filter((group) => group.some((item) => (
        (!influencer || item.userId === influencer) &&
        (!date || String(item.createdAt || '').startsWith(date)) &&
        (!term || fields.some((field) => String(item[field] || '').toLowerCase().includes(term)))
    )));
}

function readLegacyPage(groups, requestedPage) {
    const pageNumber = Math.min(requestedPage, Math.max(1, Math.ceil(groups.length / PAGE_SIZE)));
    const offset = (pageNumber - 1) * PAGE_SIZE;
    return {
        items: groups.slice(offset, offset + PAGE_SIZE).flat(),
        total: groups.length,
        pageNumber
    };
}

const isFootageList = (items) => Array.isArray(items) &&
    items.every((item) => typeof item?.id === 'string');

export default function useFootageLibrary({ userId, ownerId, region, isGlobal, visibilityFilter,
    refreshTrigger, searchTerm, searchByProductOnly, influencer, date }) {
    const [videos, setVideos] = useState([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [pendingPage, setPendingPage] = useState(null);
    const [error, setError] = useState('');
    const [search, setSearch] = useState(searchTerm);
    const effectiveSearch = searchTerm ? search : '';
    const [reloadCount, setReloadCount] = useState(0);
    const request = useRef(null);
    const refreshKey = useRef(null);
    const legacyGroups = useRef(null);

    useEffect(() => {
        const timeout = setTimeout(() => setSearch(searchTerm), 250);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    const fetchPage = useCallback(async ({ pageNumber, refresh, signal }) => {
        if (legacyGroups.current && !refresh) {
            return readLegacyPage(legacyGroups.current, pageNumber);
        }

        const params = new URLSearchParams({ page: 'numbered', pageNumber: String(pageNumber) });
        if (isGlobal) params.set('region', region);
        if (visibilityFilter) params.set('visibility', visibilityFilter);
        if (effectiveSearch) params.set('search', effectiveSearch);
        if (searchByProductOnly) params.set('productOnly', '1');
        if (influencer) params.set('influencer', influencer);
        if (date) params.set('date', date);
        if (refresh) params.set('refresh', '1');

        const headers = {};
        if (!isGlobal) {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error('Sign in to view this footage.');
            headers.Authorization = `Bearer ${token}`;
        }
        const route = isGlobal ? 'all' : encodeURIComponent(ownerId);
        const response = await fetch(`${API_URL}/api/footage/${route}?${params}`, { headers, signal });
        if (response.status === 409) throw new Error('The library changed.');
        if (!response.ok) throw new Error('Could not load footage.');
        const data = await response.json();
        if (isFootageList(data)) {
            const groups = groupLegacyFootage(data, { search: effectiveSearch, searchByProductOnly, influencer, date });
            if (!signal.aborted) legacyGroups.current = groups;
            return readLegacyPage(groups, pageNumber);
        }
        if (!isFootageList(data?.items) || !Number.isInteger(data.total) || data.total < 0 ||
            !Number.isInteger(data.pageNumber) || data.pageNumber < 1) {
            throw new Error('The footage API returned an unexpected response.');
        }
        return data;
    }, [ownerId, region, isGlobal, visibilityFilter, effectiveSearch, searchByProductOnly, influencer, date]);

    useEffect(() => {
        if (!userId) {
            setVideos([]);
            setTotal(0);
            setCurrentPage(1);
            setPendingPage(null);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        request.current = controller;
        const key = `${refreshTrigger}:${reloadCount}`;
        const refresh = Boolean(refreshTrigger || reloadCount) && refreshKey.current !== key;
        setLoading(true);
        setPendingPage(null);
        setError('');
        legacyGroups.current = null;
        setVideos([]);
        setTotal(0);
        setCurrentPage(1);

        fetchPage({ pageNumber: 1, refresh, signal: controller.signal }).then((page) => {
            if (controller.signal.aborted) return;
            refreshKey.current = key;
            setVideos(page.items);
            setTotal(page.total);
            setCurrentPage(page.pageNumber);
        }).catch((failure) => {
            if (!controller.signal.aborted) setError(failure.message);
        }).finally(() => {
            if (request.current === controller) request.current = null;
            if (!controller.signal.aborted) setLoading(false);
        });

        return () => {
            controller.abort();
            request.current?.abort();
            request.current = null;
        };
    }, [userId, fetchPage, refreshTrigger, reloadCount]);

    const pageCount = Math.ceil(total / PAGE_SIZE);
    const goToPage = async (pageNumber) => {
        if (pageNumber < 1 || pageNumber > pageCount || pageNumber === currentPage || request.current) return false;
        const controller = new AbortController();
        request.current = controller;
        setPendingPage(pageNumber);
        setError('');
        try {
            const page = await fetchPage({ pageNumber, signal: controller.signal });
            if (controller.signal.aborted) return false;
            setVideos(page.items);
            setTotal(page.total);
            setCurrentPage(page.pageNumber);
            return true;
        } catch (failure) {
            if (!controller.signal.aborted) setError(failure.message);
            return false;
        } finally {
            if (request.current === controller) request.current = null;
            if (!controller.signal.aborted) setPendingPage(null);
        }
    };

    return { videos, setVideos, total, currentPage, pageCount, pendingPage, loading, error, goToPage,
        reload: () => setReloadCount((count) => count + 1) };
}
