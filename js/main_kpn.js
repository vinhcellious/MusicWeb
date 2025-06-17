// js/main.js
import { initializePlayerControls, loadTrack, playTrack, pauseTrack } from './playerControls.js';
import { initializeSidebar, addLikedSongToSidebar, removeLikedSongFromSidebar, updateLikedSongsCount } from './sidebar.js';

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

    // Sidebar Elements
    const likedSongsCountSpan = document.getElementById('liked-songs-count');
    const likedSongsDynamicList = document.getElementById('liked-songs-dynamic-list');
    const sidebarSearchInput = document.getElementById('sidebar-search-input');
    const headerSearchInput = document.getElementById('header-search-input');

    // --- State Variables (Centralized) ---
    const trackList = [];
    let favoriteTracks = new Set(JSON.parse(localStorage.getItem('favoriteTracks') || '[]')); // Using Set for quick lookups

    // Expose some functions/variables globally for inter-module communication if needed (less ideal, but works for quick setup)
    window.loadTrack = loadTrack;
    window.playTrack = playTrack;
    window.pauseTrack = pauseTrack;
    window.audioPlayer = audioPlayer; // Allow sidebar to check player state
    window.addLikedSongToSidebar = addLikedSongToSidebar;
    window.removeLikedSongFromSidebar = removeLikedSongFromSidebar;
    window.updateLikedSongsCount = updateLikedSongsCount;
    // Potentially expose currentTrackIndex if sidebar needs to know which track is playing
    // This is a simplified approach; a more robust solution would use a state management pattern.

    // --- Initialization: Populate trackList and add play overlays ---
    musicCards.forEach((card, index) => {
        trackList.push({
            src: card.dataset.src,
            title: card.dataset.title,
            artist: card.dataset.artist,
            image: card.dataset.image,
            id: card.dataset.id || `track-${index}`
        });
        card.dataset.index = index; // Store original index on the card

        const playOverlay = document.createElement('div');
        playOverlay.classList.add('play-overlay');
        playOverlay.innerHTML = '<i class="fas fa-play"></i>';
        card.appendChild(playOverlay);
    });

    // Initialize Player Controls
    initializePlayerControls({
        audioPlayer, playPauseButton, prevButton, nextButton,
        shuffleButton, repeatButton, seekSlider, volumeSlider,
        volumeIcon, currentTimeSpan, durationSpan, playerAlbumArt,
        playerSongTitle, playerArtistName, musicPlayerBar, musicCards,
        favoriteButton
    }, trackList, favoriteTracks);

    // Initialize Sidebar
    initializeSidebar({
        likedSongsCountSpan, likedSongsDynamicList,
        sidebarSearchInput, headerSearchInput
    }, favoriteTracks, trackList);
});