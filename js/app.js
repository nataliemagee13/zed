const moodSelect = document.querySelector("#mood-select");
const recommendButton = document.querySelector("#recommend-btn");
const surpriseButton = document.querySelector("#surprise-btn");
const againButton = document.querySelector("#again-btn");
const message = document.querySelector("#message");
const result = document.querySelector("#result");
const bracelet = document.querySelector(".bracelet");
const songTitle = document.querySelector("#song-title");
const songAlbum = document.querySelector("#song-album");
const saveFavoriteButton = document.querySelector("#save-favorite-btn");
const spotifyLink = document.querySelector("#spotify-link");
const shareSongButton = document.querySelector("#share-song-btn");
const shareHint = document.querySelector("#share-hint");
const favoritesEmpty = document.querySelector("#favorites-empty");
const eraStat = document.querySelector("#era-stat");
const favoritesList = document.querySelector("#favorites-list");

let songs = [];
let shuffledSongs = [];
let currentIndex = 0;
let songsFailedToLoad = false;
let currentSong = null;
let favorites = loadFavorites();
let surpriseMode = false;

const favoritesStorageKey = "swiftie-song-favorites";

// Read saved favorites safely. JSON.parse turns the stored text back into an array.
function loadFavorites() {
	try {
		const storedFavorites = localStorage.getItem("swiftie-song-favorites");
		const parsedFavorites = storedFavorites ? JSON.parse(storedFavorites) : [];

		return Array.isArray(parsedFavorites) ? parsedFavorites : [];
	} catch (error) {
		return [];
	}
}

// JSON.stringify turns the favorites array into text that localStorage can store.
function saveFavorites() {
	try {
		localStorage.setItem(favoritesStorageKey, JSON.stringify(favorites));
	} catch (error) {
		message.textContent = "Favorites couldn't be saved in this browser.";
	}
}

function updateSaveButton() {
	const alreadySaved = currentSong && favorites.some((favorite) =>
		favorite.title === currentSong.title && favorite.album === currentSong.album
	);

	saveFavoriteButton.textContent = alreadySaved ? "Saved to favorites" : "Save to favorites";
	saveFavoriteButton.disabled = alreadySaved;
}

function updateEraStat() {
	if (favorites.length === 0) {
		eraStat.hidden = true;
		return;
	}

	const albumCounts = {};
	const albumLastFavorited = {};

	favorites.forEach((favorite, index) => {
		albumCounts[favorite.album] = (albumCounts[favorite.album] || 0) + 1;
		albumLastFavorited[favorite.album] = index;
	});

	const eraAlbum = Object.keys(albumCounts).reduce((currentAlbum, album) => {
		const hasMoreFavorites = albumCounts[album] > albumCounts[currentAlbum];
		const isMostRecentTie = albumCounts[album] === albumCounts[currentAlbum] &&
			albumLastFavorited[album] > albumLastFavorited[currentAlbum];

		return hasMoreFavorites || isMostRecentTie ? album : currentAlbum;
	});

	eraStat.textContent = `You're in your ${eraAlbum} era ✨`;
	eraStat.hidden = false;
}

function renderFavorites() {
	favoritesList.replaceChildren();
	favoritesEmpty.hidden = favorites.length > 0;
	updateEraStat();

	favorites.forEach((favorite, index) => {
		const item = document.createElement("li");
		const details = document.createElement("span");
		const title = document.createElement("strong");
		const album = document.createElement("small");
		const removeButton = document.createElement("button");

		title.textContent = favorite.title;
		album.textContent = favorite.album;
		details.append(title, album);
		removeButton.type = "button";
		removeButton.className = "remove-favorite";
		removeButton.setAttribute("aria-label", `Remove ${favorite.title} from favorites`);
		removeButton.textContent = "×";
		removeButton.addEventListener("click", () => {
			favorites.splice(index, 1);
			saveFavorites();
			renderFavorites();
			updateSaveButton();
		});

		item.append(details, removeButton);
		favoritesList.append(item);
	});
}

// Load the song list when the page starts.
async function loadSongs() {
	try {
		const response = await fetch("data/songs.json");

		if (!response.ok) {
			throw new Error("Songs failed to load");
		}

		songs = await response.json();
		console.log("Songs loaded:", songs.length);
	} catch (error) {
		songsFailedToLoad = true;
		message.textContent = "Songs couldn't load. Try refreshing the page.";
	}
}

// Return only the songs that match the selected mood.
function filterByMood(mood) {
	const matchingSongs = songs.filter((song) => song.mood === mood);
	console.log(`Songs matched for mood "${mood}":`, matchingSongs.length);
	return matchingSongs;
}

// Shuffle a copy of the list with the Fisher-Yates algorithm.
function shuffleSongs(songList) {
	const shuffledList = [...songList];

	for (let index = shuffledList.length - 1; index > 0; index -= 1) {
		const randomIndex = Math.floor(Math.random() * (index + 1));
		[shuffledList[index], shuffledList[randomIndex]] = [
			shuffledList[randomIndex],
			shuffledList[index],
		];
	}

	return shuffledList;
}

// Put one song's details into the result section.
function restartRevealAnimation() {
	result.classList.remove("is-revealing");
	bracelet.classList.remove("is-bouncing");
	void result.offsetWidth;
	result.classList.add("is-revealing");
	bracelet.classList.add("is-bouncing");
}

function showSong(song) {
	currentSong = song;
	songTitle.textContent = song.title;
	songAlbum.textContent = song.album;
	const searchText = encodeURIComponent(`${song.title} Taylor Swift`);
	spotifyLink.href = `https://open.spotify.com/search/${searchText}`;
	result.hidden = false;
	restartRevealAnimation();
	message.textContent = "";
	updateSaveButton();
}

async function shareSong() {
	if (!currentSong) {
		return;
	}

	const shareText = `Today's Swiftie song: ${currentSong.title} (${currentSong.album}) 🫶 found on Swiftie Song Finder`;

	try {
		if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
			throw new Error("Clipboard is unavailable");
		}

		await navigator.clipboard.writeText(shareText);
		message.textContent = "Copied! Go share it ✨";
		shareHint.textContent = "Copied! Ready to paste and share.";
	} catch (error) {
		message.textContent = "Couldn't copy. Try selecting the song name instead.";
		shareHint.textContent = "Copy unavailable - select the song name instead.";
	}
}

// Show the next song, reshuffling after every song has been seen.
function nextSong(showRefreshMessage = false) {
	let startedNewMix = false;

	if (currentIndex >= shuffledSongs.length) {
		const songPool = surpriseMode ? songs : filterByMood(moodSelect.value);
		shuffledSongs = shuffleSongs(songPool);
		currentIndex = 0;
		startedNewMix = true;

		if (!showRefreshMessage) {
			startedNewMix = false;
		}
	}

	if (shuffledSongs.length === 0) {
		result.hidden = true;
		message.textContent = "No songs found for that mood.";
		return;
	}

	showSong(shuffledSongs[currentIndex]);
	currentIndex += 1;

	if (startedNewMix) {
		message.textContent = "You've seen them all! Starting a new mix.";
	}
}

// Start a new shuffled list for the selected mood.
async function recommendSong() {
	await songsLoadPromise;

	if (!moodSelect.value) {
		result.hidden = true;
		message.textContent = "Pick a mood first!";
		return;
	}

	if (songsFailedToLoad) {
		return;
	}

	surpriseMode = false;
	shuffledSongs = shuffleSongs(filterByMood(moodSelect.value));
	currentIndex = 0;
	nextSong();
}

async function surpriseSong() {
	await songsLoadPromise;

	if (songsFailedToLoad) {
		return;
	}

	surpriseMode = true;
	shuffledSongs = shuffleSongs(songs);
	currentIndex = 0;
	nextSong();
}

recommendButton.addEventListener("click", recommendSong);
surpriseButton.addEventListener("click", surpriseSong);
againButton.addEventListener("click", () => nextSong(true));
saveFavoriteButton.addEventListener("click", () => {
	if (!currentSong || favorites.some((favorite) =>
		favorite.title === currentSong.title && favorite.album === currentSong.album
	)) {
		return;
	}

	favorites.push(currentSong);
	saveFavorites();
	renderFavorites();
	updateSaveButton();
});
shareSongButton.addEventListener("click", shareSong);
// Keep the visual theme in sync with the mood selected by the user.
moodSelect.addEventListener("change", () => {
	document.body.dataset.mood = moodSelect.value;
});
const songsLoadPromise = loadSongs();

renderFavorites();
