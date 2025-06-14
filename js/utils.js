// js/utils.js

/**
 * Formats seconds into mm:ss string.
 * @param {number} seconds - The time in seconds.
 * @returns {string} Formatted time string.
 */
export function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

/**
 * Generates a shuffled array of track indexes, optionally starting with a specific track.
 * @param {number} totalTracks - Total number of tracks.
 * @param {number} [startIndex = -1] - The index of the track to start the shuffled list with.
 * @returns {number[]} The shuffled array of track indexes.
 */
export function generateShuffledIndexes(totalTracks, startIndex = -1) {
    let tempIndexes = Array.from({ length: totalTracks }, (_, i) => i);
    if (startIndex !== -1 && tempIndexes.includes(startIndex)) {
        tempIndexes = tempIndexes.filter(index => index !== startIndex);
        for (let i = tempIndexes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tempIndexes[i], tempIndexes[j]] = [tempIndexes[j], tempIndexes[i]];
        }
        return [startIndex, ...tempIndexes];
    } else {
        for (let i = tempIndexes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tempIndexes[i], tempIndexes[j]] = [tempIndexes[j], tempIndexes[i]];
        }
        return tempIndexes;
    }
}