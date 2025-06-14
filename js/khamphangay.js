document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const audioPlayer = document.getElementById('audio-player');
    const playPauseButton = document.getElementById('play-pause-button');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const shuffleButton = document.getElementById('shuffle-button');
    const repeatButton = document.getElementById('repeat-button');
    const seekSlider = document.getElementById('seek-slider');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeIcon = document.getElementById('volume-icon');
    const currentTimeSpan = document.getElementById('current-time');
    const durationSpan = document.getElementById('duration');
    const playerAlbumArt = document.getElementById('player-album-art');
    const playerSongTitle = document.getElementById('player-song-title');
    const playerArtistName = document.getElementById('player-artist-name');
    const musicPlayerBar = document.getElementById('music-player-bar');
    const musicCards = document.querySelectorAll('.music-card');
    const favoriteButton = document.getElementById('player-heart-button');

    // New DOM Elements for Sidebar Liked Songs and Search
    const likedSongsCountSpan = document.getElementById('liked-songs-count');
    const likedSongsDynamicList = document.getElementById('liked-songs-dynamic-list');
    const sidebarSearchInput = document.getElementById('sidebar-search-input');
    const headerSearchInput = document.getElementById('header-search-input'); // Assuming there's a header search input too

    // --- State Variables ---
    let currentTrackIndex = -1;
    const trackList = [];
    let isShuffling = false;
    let repeatMode = 0; // 0: No repeat, 1: Repeat all, 2: Repeat one
    let shuffledTrackIndexes = [];
    let originalTrackIndexes = [];
    let lastVolume = 0.7;
    let favoriteTracks = new Set(JSON.parse(localStorage.getItem('favoriteTracks') || '[]')); // Using Set for quick lookups

    // --- Initialization: Populate trackList and add play overlays ---
    musicCards.forEach((card, index) => {
        trackList.push({
            src: card.dataset.src,
            title: card.dataset.title,
            artist: card.dataset.artist,
            image: card.dataset.image,
            id: card.dataset.id || `track-${index}` // Use data-id or generate one if missing
        });
        card.dataset.index = index; // Store original index on the card

        const playOverlay = document.createElement('div');
        playOverlay.classList.add('play-overlay');
        playOverlay.innerHTML = '<i class="fas fa-play"></i>';
        card.appendChild(playOverlay);
    });

    originalTrackIndexes = Array.from({ length: trackList.length }, (_, i) => i);

    // --- Helper Functions ---

    /**
     * Formats seconds into mm:ss string.
     * @param {number} seconds - The time in seconds.
     * @returns {string} Formatted time string.
     */
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    /**
     * Updates the active/playing state of music cards and their play icons.
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
     * Generates a shuffled array of track indexes, optionally starting with a specific track.
     * @param {number} [startIndex = -1] - The index of the track to start the shuffled list with.
     * @returns {number[]} The shuffled array of track indexes.
     */
    function generateShuffledIndexes(startIndex = -1) {
        let tempIndexes = [...originalTrackIndexes];
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
     * Adds a liked song to the sidebar's dynamic list.
     * @param {Object} track - The track object to add.
     */
    function addLikedSongToSidebar(track) {
        // Prevent adding duplicates if already present (e.g. on page reload and initial rendering)
        if (likedSongsDynamicList.querySelector(`.liked-song-item[data-id="${track.id}"]`)) {
            return;
        }

        const likedItem = document.createElement('div');
        likedItem.classList.add('liked-song-item');
        likedItem.dataset.id = track.id; // Store track ID on the element
        // Find the original index from trackList to play it later
        const originalIndex = trackList.findIndex(t => t.id === track.id);
        if (originalIndex !== -1) {
            likedItem.dataset.index = originalIndex;
        } else {
            console.warn("Original track index not found for liked song:", track.id);
        }

        likedItem.innerHTML = `
            <img src="${track.image}" onerror="this.src='/Images/default-album.png'" alt="Album Art">
            <div class="liked-song-details">
                <h4>${track.title}</h4>
                <p>${track.artist}</p>
            </div>
        `;
        likedSongsDynamicList.appendChild(likedItem);

        // Add click listener to play the song when clicked in the sidebar
        likedItem.addEventListener('click', () => {
            const indexToLoad = parseInt(likedItem.dataset.index);
            if (!isNaN(indexToLoad) && indexToLoad !== currentTrackIndex) {
                loadTrack(indexToLoad);
            } else if (!isNaN(indexToLoad) && indexToLoad === currentTrackIndex) {
                // If already current track, toggle play/pause
                if (audioPlayer.paused) {
                    playTrack();
                } else {
                    pauseTrack();
                }
            }
        });
    }

    /**
     * Removes a liked song from the sidebar's dynamic list.
     * @param {string} trackId - The ID of the track to remove.
     */
    function removeLikedSongFromSidebar(trackId) {
        const itemToRemove = likedSongsDynamicList.querySelector(`.liked-song-item[data-id="${trackId}"]`);
        if (itemToRemove) {
            itemToRemove.remove();
        }
    }

    /**
     * Updates the displayed count of liked songs in the sidebar.
     */
    function updateLikedSongsCount() {
        if (likedSongsCountSpan) {
            likedSongsCountSpan.textContent = favoriteTracks.size;
        }
    }

    /**
     * Filters music cards and liked song items based on search query.
     * @param {string} query - The search query.
     */
    function filterSongs(query) {
        const lowerCaseQuery = query.toLowerCase().trim();

        // Filter main music cards
        musicCards.forEach(card => {
            const title = card.dataset.title.toLowerCase();
            const artist = card.dataset.artist.toLowerCase();
            if (title.includes(lowerCaseQuery) || artist.includes(lowerCaseQuery)) {
                card.style.display = 'flex'; // Show card
            } else {
                card.style.display = 'none'; // Hide card
            }
        });

        // Filter liked song items in sidebar
        const likedSongItems = likedSongsDynamicList.querySelectorAll('.liked-song-item');
        likedSongItems.forEach(item => {
            const title = item.querySelector('h4').textContent.toLowerCase();
            const artist = item.querySelector('p').textContent.toLowerCase();
            if (title.includes(lowerCaseQuery) || artist.includes(lowerCaseQuery)) {
                item.style.display = 'flex'; // Show item
            } else {
                item.style.display = 'none'; // Hide item
            }
        });
    }


    // --- Core Player Functions ---

    /**
     * Loads a track into the audio player and updates UI.
     * @param {number} index - The index of the track to load from trackList.
     * @param {boolean} [playImmediately=true] - Whether to play the track immediately after loading.
     */
    function loadTrack(index, playImmediately = true) {
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
        updateFavoriteButtonUI(); // Update favorite button when track loads

        sessionStorage.setItem('currentTrackIndex', currentTrackIndex);
        sessionStorage.setItem('playerState', playImmediately ? 'playing' : 'paused');
    }

    /**
     * Plays the current track.
     */
    function playTrack() {
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
    function pauseTrack() {
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
        if (isShuffling) {
            const currentShuffledPos = shuffledTrackIndexes.indexOf(currentTrackIndex);
            if (currentShuffledPos === -1) {
                nextIndex = shuffledTrackIndexes[0] || 0;
            } else {
                nextIndex = (currentShuffledPos + 1) % shuffledTrackIndexes.length;
                if (nextIndex === shuffledTrackIndexes.length && repeatMode === 0) { // End of shuffled list, no repeat all
                    // Do not load next track, just pause and reset if not repeating
                    pauseTrack();
                    audioPlayer.currentTime = 0;
                    currentTrackIndex = -1; // Reset to no track active
                    updateActiveCard();
                    musicPlayerBar.classList.remove('active');
                    musicPlayerBar.classList.add('hidden');
                    updateFavoriteButtonUI(); // Update when player is hidden
                    return; // Exit function, do not load new track
                }
            }
            loadTrack(shuffledTrackIndexes[nextIndex % shuffledTrackIndexes.length]); // Use modulo for repeat all
        } else {
            nextIndex = (currentTrackIndex + 1) % trackList.length;
            if (nextIndex === 0 && repeatMode === 0) { // End of original list, no repeat all
                pauseTrack();
                audioPlayer.currentTime = 0;
                currentTrackIndex = -1; // Reset to no track active
                updateActiveCard();
                musicPlayerBar.classList.remove('active');
                musicPlayerBar.classList.add('hidden');
                updateFavoriteButtonUI(); // Update when player is hidden
                return; // Exit function
            }
            loadTrack(nextIndex);
        }
    }

    /**
     * Plays the previous track based on shuffle mode.
     */
    function playPrevTrack() {
        if (trackList.length === 0) return;

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

    // --- Event Listeners ---

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
            shuffledTrackIndexes = generateShuffledIndexes(currentTrackIndex !== -1 ? currentTrackIndex : undefined);
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
        // Remove existing '1' indicator if any
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
        if (repeatMode === 2) {
            audioPlayer.currentTime = 0;
            playTrack();
        } else {
            playNextTrack();
        }
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
            // Check if the click was directly on the play-overlay or its child icon
            const isPlayOverlayClick = event.target.closest('.play-overlay');

            if (index === currentTrackIndex) {
                // If clicking the current playing/paused track's card
                if (audioPlayer.paused) {
                    playTrack();
                } else {
                    pauseTrack();
                }
            } else {
                // If clicking a different track's card or play-overlay
                loadTrack(index); // This will automatically play the new track
            }
        });
    });

    // Event listener for Favorite Button
    if (favoriteButton) { // Ensure button exists before adding listener
        favoriteButton.addEventListener('click', () => {
            if (currentTrackIndex === -1 || !trackList[currentTrackIndex]) {
                console.warn("No track loaded to favorite.");
                return; // Cannot favorite if no track is loaded
            }

            const currentTrack = trackList[currentTrackIndex];
            const trackId = currentTrack.id; // Use the unique ID of the track

            if (favoriteTracks.has(trackId)) {
                favoriteTracks.delete(trackId);
                removeLikedSongFromSidebar(trackId); // Remove from sidebar
            } else {
                favoriteTracks.add(trackId);
                addLikedSongToSidebar(currentTrack); // Add to sidebar
            }
            localStorage.setItem('favoriteTracks', JSON.stringify(Array.from(favoriteTracks)));
            updateFavoriteButtonUI(); // Update button appearance
            updateLikedSongsCount(); // Update the count
            console.log("Favorite Tracks:", Array.from(favoriteTracks));
        });
    } else {
        console.warn("Favorite button element with ID 'player-heart-button' not found.");
    }

    // Event listener for sidebar search input
    if (sidebarSearchInput) {
        sidebarSearchInput.addEventListener('input', (event) => {
            filterSongs(event.target.value);
        });
    } else {
        console.warn("Sidebar search input with ID 'sidebar-search-input' not found.");
    }

    // Event listener for header search input (optional, if you want it to filter the same content)
    if (headerSearchInput) {
        headerSearchInput.addEventListener('input', (event) => {
            filterSongs(event.target.value);
        });
    } else {
        console.warn("Header search input with ID 'header-search-input' not found.");
    }


    // --- Initial State Load and Setup ---
    function initializePlayerState() {
        // Restore volume
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

        // Restore shuffle state
        const savedIsShuffling = sessionStorage.getItem('isShuffling');
        if (savedIsShuffling !== null) {
            isShuffling = (savedIsShuffling === 'true');
            shuffleButton.classList.toggle('active-control', isShuffling);
        }

        // Restore repeat mode
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

        // Restore current track and player state (playing/paused)
        const savedTrackIndex = sessionStorage.getItem('currentTrackIndex');
        const savedPlayerState = sessionStorage.getItem('playerState');

        if (savedTrackIndex !== null && trackList.length > 0) {
            currentTrackIndex = parseInt(savedTrackIndex);

            if (isShuffling) {
                shuffledTrackIndexes = generateShuffledIndexes(currentTrackIndex);
            }

            loadTrack(currentTrackIndex, false); // Load track but don't play immediately

            musicPlayerBar.classList.remove('hidden');
            musicPlayerBar.classList.add('active');

            // If it was playing, try to play again (after metadata is loaded)
            if (savedPlayerState === 'playing') {
                audioPlayer.addEventListener('canplaythrough', () => {
                    playTrack();
                }, { once: true });
            }

        } else {
            musicPlayerBar.classList.add('hidden');
            musicPlayerBar.classList.remove('active');
        }

        // Populate liked songs in sidebar on initial load
        favoriteTracks.forEach(trackId => {
            const track = trackList.find(t => t.id === trackId);
            if (track) {
                addLikedSongToSidebar(track);
            }
        });
        updateLikedSongsCount(); // Initial update for liked songs count

        updateFavoriteButtonUI(); // Initial update for favorite button based on saved state or no track
    }

    initializePlayerState();
});
