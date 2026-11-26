import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';

const creatorName = (creator) => creator.displayName || creator.name || creator.uid;

export default function FootageLibraryFilters({ isGlobal, userDirectory, influencer, onInfluencerChange,
    date, onDateChange, hasFilters, onClear }) {
    return (
        <div className="footage-library-filters">
            {isGlobal && (
                <label>
                    Influencer
                    <select className="search-input" value={influencer} onChange={(event) => onInfluencerChange(event.target.value)}>
                        <option value="">All influencers</option>
                        {Object.values(userDirectory).sort((a, b) => creatorName(a).localeCompare(creatorName(b))).map((creator) => (
                            <option key={creator.uid} value={creator.uid}>{creatorName(creator)}</option>
                        ))}
                    </select>
                </label>
            )}
            <label>
                Upload date (UTC)
                <span className="footage-date-field">
                    <input className="search-input" type="date" value={date} onChange={(event) => onDateChange(event.target.value)} />
                    <FontAwesomeIcon icon={faCalendarDays} className="footage-date-icon" aria-hidden="true" />
                </span>
            </label>
            <button type="button" className="pagination-btn footage-clear-filters" disabled={!hasFilters} onClick={onClear}>
                Clear filters
            </button>
        </div>
    );
}
