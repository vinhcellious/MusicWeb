// js/playerControls.js
import { formatTime, generateShuffledIndexes } from './utils.js';

// DOM Elements - make sure these are passed in or accessed globally if not importing as module
let audioPlayer;
let playPauseButton;
let prevButton;
let nextButton;
let shuffleButton;
let repeatButton;
let seekSlider;
let volumeSlider;
let volumeIcon;
let currentTimeSpan;
let durationSpan;
let playerAlbumArt;
let playerSongTitle;
let playerArtistName;
let musicPlayerBar;
let musicCards;
let favoriteButton; // Added for player control context

// State Variables (can be managed by a centralized state manager or passed)
let currentTrackIndex = -1;
let trackList = [];
let isShuffling = false;
let repeatMode = 0; // 0: No repeat, 1: Repeat all, 2: Repeat one
let shuffledTrackIndexes = [];
let originalTrackIndexes = [];
let lastVolume = 0.7;
let favoriteTracks; // Set via initializePlayerControls

/**
 * Initializes DOM elements and necessary state for player controls.
 * @param {Object} elements - Object containing all necessary DOM elements.
 * @param {Array} initialTrackList - The list of tracks.
 * @param {Set} initialFavoriteTracks - The initial set of favorite track IDs.
 */
export function initializePlayerControls(elements, initialTrackList, initialFavoriteTracks) {
    audioPlayer = elements.audioPlayer;
    playPauseButton = elements.playPauseButton;
    prevButton = elements.prevButton;
    nextButton = elements.nextButton;
    shuffleButton = elements.shuffleButton;
    repeatButton = elements.repeatButton;
    seekSlider = elements.seekSlider;
    volumeSlider = elements.volumeSlider;
    volumeIcon = elements.volumeIcon;
    currentTimeSpan = elements.currentTimeSpan;
    durationSpan = elements.durationSpan;
    playerAlbumArt = elements.playerAlbumArt;
    playerSongTitle = elements.playerSongTitle;
    playerArtistName = elements.playerArtistName;
    musicPlayerBar = elements.musicPlayerBar;
    musicCards = elements.musicCards;
    favoriteButton = elements.favoriteButton; // Now passed as part of elements

    trackList = initialTrackList;
    originalTrackIndexes = Array.from({ length: trackList.length }, (_, i) => i);
    favoriteTracks = initialFavoriteTracks; // Get reference to the global favoriteTracks Set

    setupPlayerEventListeners();
    applySavedPlayerState();
    updateFavoriteButtonUI(); // Initial update
}

/**
 * Updates the active/playing state of music cards and their play icons.
 * Also updates active state for liked songs in sidebar.
 */
function updateActiveCard() {
    musicCards.forEach((card) => {
        const index = parseInt(card.dataset.index);
        const playOverlayIcon = card.querySelector('.play-overlay i');

        if (index === currentTrackIndex) {
            card.classList.add('active-playing');
            if (!audioPlayer.paused) {
                playOverlayIcon.classList.remove('fa-play');
                playOverlayIcon.classList.add('fa-pause');
            } else {
                playOverlayIcon.classList.remove('fa-pause');
                playOverlayIcon.classList.add('fa-play');
            }
        } else {
            card.classList.remove('active-playing');
            playOverlayIcon.classList.remove('fa-pause');
            playOverlayIcon.classList.add('fa-play');
        }
    });

    // Also update active state for liked songs in sidebar
    const likedSongsDynamicList = document.getElementById('liked-songs-dynamic-list');
    if (likedSongsDynamicList) {
        const likedSongItems = likedSongsDynamicList.querySelectorAll('.liked-song-item');
        likedSongItems.forEach(item => {
            const trackId = item.dataset.id;
            const currentTrack = trackList[currentTrackIndex];
            if (currentTrack && trackId === currentTrack.id) {
                item.classList.add('active-playing');
            } else {
                item.classList.remove('active-playing');
            }
        });
    }
}

/**
 * Updates the background fill for the seek slider based on its current value.
 */
function updateSeekSlider() {
    const percentage = (seekSlider.value / seekSlider.max) * 100;
    seekSlider.style.setProperty('--seek-before-width', `${percentage}%`);
}

/**
 * Updates the background fill for the volume slider based on its current value.
 */
function updateVolumeSlider() {
    const percentage = (volumeSlider.value / volumeSlider.max) * 100;
    volumeSlider.style.setProperty('--volume-before-width', `${percentage}%`);
}

/**
 * Updates the volume icon based on the current volume level.
 * @param {number} volume - The current volume (0 to 1).
 */
function updateVolumeIcon(volume) {
    volumeIcon.innerHTML = '';
    const iconElement = document.createElement('i');

    if (volume === 0) {
        iconElement.classList.add('fas', 'fa-volume-mute');
    } else if (volume < 0.5) {
        iconElement.classList.add('fas', 'fa-volume-down');
    } else {
        iconElement.classList.add('fas', 'fa-volume-up');
    }
    volumeIcon.appendChild(iconElement);
}

/**
 * Updates the UI of the favorite button based on the current track's favorite status.
 */
function updateFavoriteButtonUI() {
    if (!favoriteButton) {
        console.warn("Favorite button not found. Ensure its ID is 'player-heart-button'.");
        return;
    }

    if (currentTrackIndex === -1 || !trackList[currentTrackIndex]) {
        favoriteButton.classList.remove('favorite-active');
        favoriteButton.querySelector('i').classList.remove('fas', 'fa-heart');
        favoriteButton.querySelector('i').classList.add('far', 'fa-heart');
        favoriteButton.style.display = 'none'; // Hide if no track loaded
        return;
    }

    favoriteButton.style.display = 'block'; // Show if a track is loaded

    const currentTrackId = trackList[currentTrackIndex].id;
    const isFavorite = favoriteTracks.has(currentTrackId);
    const iconElement = favoriteButton.querySelector('i');

    if (isFavorite) {
        favoriteButton.classList.add('favorite-active');
        iconElement.classList.remove('far', 'fa-heart');
        iconElement.classList.add('fas', 'fa-heart');
    } else {
        favoriteButton.classList.remove('favorite-active');
        iconElement.classList.remove('fas', 'fa-heart');
        iconElement.classList.add('far', 'fa-heart');
    }
}

/**
 * Loads a track into the audio player and updates UI.
 * @param {number} index - The index of the track to load from trackList.
 * @param {boolean} [playImmediately=true] - Whether to play the track immediately after loading.
 */
export function loadTrack(index, playImmediately = true) {
    if (index < 0 || index >= trackList.length) {
        console.warn("Invalid track index:", index);
        return;
    }

    currentTrackIndex = index;
    const track = trackList[currentTrackIndex];

    audioPlayer.src = track.src;
    playerAlbumArt.src = track.image;
    playerSongTitle.textContent = track.title;
    playerArtistName.textContent = track.artist;

    if (musicPlayerBar.classList.contains('hidden')) {
        musicPlayerBar.classList.remove('hidden');
        musicPlayerBar.classList.add('active');
    }

    audioPlayer.load();
    if (playImmediately) {
        playTrack();
    } else {
        pauseTrack();
        audioPlayer.currentTime = 0;
        seekSlider.value = 0;
        currentTimeSpan.textContent = formatTime(0);
        updateSeekSlider();
    }
    updateActiveCard();
    updateFavoriteButtonUI();

    sessionStorage.setItem('currentTrackIndex', currentTrackIndex);
    sessionStorage.setItem('playerState', playImmediately ? 'playing' : 'paused');
}

/**
 * Plays the current track.
 */
export function playTrack() {
    if (!audioPlayer.src) {
        const initialIndex = isShuffling && shuffledTrackIndexes.length > 0 ? shuffledTrackIndexes[0] : 0;
        if (trackList.length > 0) {
            loadTrack(initialIndex, true);
        }
        return;
    }
    audioPlayer.play().catch(e => {
        console.error("Error playing audio:", e);
    });
    playPauseButton.querySelector('i').classList.remove('fa-play');
    playPauseButton.querySelector('i').classList.add('fa-pause');
    updateActiveCard();
    sessionStorage.setItem('playerState', 'playing');
}

/**
 * Pauses the current track.
 */
export function pauseTrack() {
    audioPlayer.pause();
    playPauseButton.querySelector('i').classList.remove('fa-pause');
    playPauseButton.querySelector('i').classList.add('fa-play');
    updateActiveCard();
    sessionStorage.setItem('playerState', 'paused');
}

/**
 * Plays the next track based on shuffle/repeat mode.
 */
function playNextTrack() {
    if (trackList.length === 0) return;

    let nextIndex;
    if (repeatMode === 2) { // Repeat one
        audioPlayer.currentTime = 0;
        playTrack();
        return;
    } else if (isShuffling) {
        const currentShuffledPos = shuffledTrackIndexes.indexOf(currentTrackIndex);
        if (currentShuffledPos === -1) {
            nextIndex = shuffledTrackIndexes[0] || 0;
        } else {
            nextIndex = (currentShuffledPos + 1) % shuffledTrackIndexes.length;
            if (nextIndex === 0 && repeatMode === 0) { // End of shuffled list, no repeat all
                pauseTrack();
                audioPlayer.currentTime = 0;
                currentTrackIndex = -1; // Reset to no track active
                updateActiveCard();
                musicPlayerBar.classList.remove('active');
                musicPlayerBar.classList.add('hidden');
                updateFavoriteButtonUI();
                return;
            }
        }
        loadTrack(shuffledTrackIndexes[nextIndex % shuffledTrackIndexes.length]);
    } else {
        nextIndex = (currentTrackIndex + 1) % trackList.length;
        if (nextIndex === 0 && repeatMode === 0) { // End of original list, no repeat all
            pauseTrack();
            audioPlayer.currentTime = 0;
            currentTrackIndex = -1; // Reset to no track active
            updateActiveCard();
            musicPlayerBar.classList.remove('active');
            musicPlayerBar.classList.add('hidden');
            updateFavoriteButtonUI();
            return;
        }
        loadTrack(nextIndex);
    }
}

/**
 * Plays the previous track based on shuffle mode.
 */
function playPrevTrack() {
    if (trackList.length === 0) return;

    if (audioPlayer.currentTime > 3) { // If current time is more than 3 seconds, restart current track
        audioPlayer.currentTime = 0;
        playTrack();
        return;
    }

    let prevIndex;
    if (isShuffling) {
        const currentShuffledPos = shuffledTrackIndexes.indexOf(currentTrackIndex);
        if (currentShuffledPos === -1) {
            prevIndex = shuffledTrackIndexes[0] || 0;
        } else {
            prevIndex = (currentShuffledPos - 1 + shuffledTrackIndexes.length) % shuffledTrackIndexes.length;
        }
        loadTrack(shuffledTrackIndexes[prevIndex]);
    } else {
        prevIndex = (currentTrackIndex - 1 + trackList.length) % trackList.length;
        loadTrack(prevIndex);
    }
}

/**
 * Sets up all event listeners for the music player controls.
 */
function setupPlayerEventListeners() {
    playPauseButton.addEventListener('click', () => {
        if (currentTrackIndex === -1 && trackList.length > 0) {
            const initialIndex = isShuffling && shuffledTrackIndexes.length > 0 ? shuffledTrackIndexes[0] : 0;
            loadTrack(initialIndex);
        } else if (audioPlayer.paused) {
            playTrack();
        } else {
            pauseTrack();
        }
    });

    prevButton.addEventListener('click', playPrevTrack);
    nextButton.addEventListener('click', playNextTrack);

    shuffleButton.addEventListener('click', () => {
        isShuffling = !isShuffling;
        shuffleButton.classList.toggle('active-control', isShuffling);
        if (isShuffling && trackList.length > 0) {
            shuffledTrackIndexes = generateShuffledIndexes(trackList.length, currentTrackIndex !== -1 ? currentTrackIndex : undefined);
        } else {
            shuffledTrackIndexes = [];
        }
        console.log("Shuffle:", isShuffling, "Shuffled Order:", shuffledTrackIndexes);
        sessionStorage.setItem('isShuffling', isShuffling);
    });

    repeatButton.addEventListener('click', () => {
        repeatMode = (repeatMode + 1) % 3;

        repeatButton.classList.remove('active-control');
        const iconElement = repeatButton.querySelector('i');
        iconElement.classList.remove('fa-redo-alt');
        const existingRepeatOneIndicator = iconElement.querySelector('.repeat-one-indicator');
        if (existingRepeatOneIndicator) {
            existingRepeatOneIndicator.remove();
        }

        switch (repeatMode) {
            case 0: // No repeat
                iconElement.classList.add('fa-redo-alt');
                break;
            case 1: // Repeat all
                repeatButton.classList.add('active-control');
                iconElement.classList.add('fa-redo-alt');
                break;
            case 2: // Repeat one
                repeatButton.classList.add('active-control');
                iconElement.classList.add('fa-redo-alt');
                const repeatOneIndicator = document.createElement('span');
                repeatOneIndicator.classList.add('repeat-one-indicator');
                repeatOneIndicator.textContent = '1';
                iconElement.appendChild(repeatOneIndicator);
                break;
        }
        console.log("Repeat Mode:", repeatMode);
        sessionStorage.setItem('repeatMode', repeatMode);
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
        durationSpan.textContent = formatTime(audioPlayer.duration);
        seekSlider.max = audioPlayer.duration;
        updateSeekSlider();
    });

    audioPlayer.addEventListener('timeupdate', () => {
        seekSlider.value = audioPlayer.currentTime;
        currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
        updateSeekSlider();
    });

    seekSlider.addEventListener('input', () => {
        audioPlayer.currentTime = seekSlider.value;
        updateSeekSlider();
    });

    audioPlayer.addEventListener('ended', () => {
        playNextTrack();
    });

    volumeSlider.addEventListener('input', () => {
        audioPlayer.volume = volumeSlider.value / 100;
        updateVolumeIcon(audioPlayer.volume);
        updateVolumeSlider();
        sessionStorage.setItem('volume', volumeSlider.value);
        if (audioPlayer.volume > 0) {
            lastVolume = audioPlayer.volume;
            sessionStorage.setItem('lastVolume', lastVolume);
        }
    });

    volumeIcon.addEventListener('click', () => {
        if (audioPlayer.volume > 0) {
            lastVolume = audioPlayer.volume;
            audioPlayer.volume = 0;
            volumeSlider.value = 0;
        } else {
            audioPlayer.volume = lastVolume;
            volumeSlider.value = lastVolume * 100;
        }
        updateVolumeIcon(audioPlayer.volume);
        updateVolumeSlider();
        sessionStorage.setItem('volume', volumeSlider.value);
        sessionStorage.setItem('lastVolume', lastVolume);
    });

    musicCards.forEach(card => {
        card.addEventListener('click', (event) => {
            const index = parseInt(card.dataset.index);
            if (index === currentTrackIndex) {
                if (audioPlayer.paused) {
                    playTrack();
                } else {
                    pauseTrack();
                }
            } else {
                loadTrack(index);
            }
        });
    });

    if (favoriteButton) {
        favoriteButton.addEventListener('click', () => {
            if (currentTrackIndex === -1 || !trackList[currentTrackIndex]) {
                console.warn("No track loaded to favorite.");
                return;
            }

            const currentTrack = trackList[currentTrackIndex];
            const trackId = currentTrack.id;

            if (favoriteTracks.has(trackId)) {
                favoriteTracks.delete(trackId);
                // Call external function to remove from sidebar
                const removeLikedSongFromSidebar = window.removeLikedSongFromSidebar; // Access global function
                if (typeof removeLikedSongFromSidebar === 'function') {
                    removeLikedSongFromSidebar(trackId);
                }
            } else {
                favoriteTracks.add(trackId);
                // Call external function to add to sidebar
                const addLikedSongToSidebar = window.addLikedSongToSidebar; // Access global function
                if (typeof addLikedSongToSidebar === 'function') {
                    addLikedSongToSidebar(currentTrack);
                }
            }
            localStorage.setItem('favoriteTracks', JSON.stringify(Array.from(favoriteTracks)));
            updateFavoriteButtonUI();
            const updateLikedSongsCount = window.updateLikedSongsCount; // Access global function
            if (typeof updateLikedSongsCount === 'function') {
                updateLikedSongsCount();
            }
            console.log("Favorite Tracks:", Array.from(favoriteTracks));
        });
    }
}

/**
 * Applies saved player state from sessionStorage.
 */
function applySavedPlayerState() {
    const savedVolume = sessionStorage.getItem('volume');
    if (savedVolume !== null) {
        volumeSlider.value = savedVolume;
        audioPlayer.volume = savedVolume / 100;
    } else {
        audioPlayer.volume = volumeSlider.value / 100;
        sessionStorage.setItem('volume', volumeSlider.value);
    }
    const savedLastVolume = sessionStorage.getItem('lastVolume');
    if (savedLastVolume !== null) {
        lastVolume = parseFloat(savedLastVolume);
    }
    updateVolumeIcon(audioPlayer.volume);
    updateVolumeSlider();

    const savedIsShuffling = sessionStorage.getItem('isShuffling');
    if (savedIsShuffling !== null) {
        isShuffling = (savedIsShuffling === 'true');
        shuffleButton.classList.toggle('active-control', isShuffling);
    }

    const savedRepeatMode = sessionStorage.getItem('repeatMode');
    if (savedRepeatMode !== null) {
        repeatMode = parseInt(savedRepeatMode);
        const iconElement = repeatButton.querySelector('i');
        iconElement.classList.remove('fa-redo-alt');
        const existingRepeatOneIndicator = iconElement.querySelector('.repeat-one-indicator');
        if (existingRepeatOneIndicator) {
            existingRepeatOneIndicator.remove();
        }

        switch (repeatMode) {
            case 0:
                iconElement.classList.add('fa-redo-alt');
                break;
            case 1:
                repeatButton.classList.add('active-control');
                iconElement.classList.add('fa-redo-alt');
                break;
            case 2:
                repeatButton.classList.add('active-control');
                iconElement.classList.add('fa-redo-alt');
                const repeatOneIndicator = document.createElement('span');
                repeatOneIndicator.classList.add('repeat-one-indicator');
                repeatOneIndicator.textContent = '1';
                iconElement.appendChild(repeatOneIndicator);
                break;
        }
    }

    const savedTrackIndex = sessionStorage.getItem('currentTrackIndex');
    const savedPlayerState = sessionStorage.getItem('playerState');

    if (savedTrackIndex !== null && trackList.length > 0) {
        currentTrackIndex = parseInt(savedTrackIndex);

        if (isShuffling) {
            shuffledTrackIndexes = generateShuffledIndexes(trackList.length, currentTrackIndex);
        }

        loadTrack(currentTrackIndex, false);

        musicPlayerBar.classList.remove('hidden');
        musicPlayerBar.classList.add('active');

        if (savedPlayerState === 'playing') {
            audioPlayer.addEventListener('canplaythrough', () => {
                playTrack();
            }, { once: true });
        }
    } else {
        musicPlayerBar.classList.add('hidden');
        musicPlayerBar.classList.remove('active');
    }
}