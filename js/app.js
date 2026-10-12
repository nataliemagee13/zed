const moodSelect = document.querySelector("#mood-select");
const recommendButton = document.querySelector("#recommend-btn");
const againButton = document.querySelector("#again-btn");
const message = document.querySelector("#message");
const result = document.querySelector("#result");
const songTitle = document.querySelector("#song-title");
const songAlbum = document.querySelector("#song-album");
const saveFavoriteButton = document.querySelector("#save-favorite-btn");
const spotifyLink = document.querySelector("#spotify-link");
const favoritesEmpty = document.querySelector("#favorites-empty");
const favoritesList = document.querySelector("#favorites-list");

let songs = [];
let shuffledSongs = [];
let currentIndex = 0;
let songsFailedToLoad = false;
let currentSong = null;
let favorites = loadFavorites();

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

function renderFavorites() {
	favoritesList.replaceChildren();
	favoritesEmpty.hidden = favorites.length > 0;

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
function showSong(song) {
	currentSong = song;
	songTitle.textContent = song.title;
	songAlbum.textContent = song.album;
	const searchText = encodeURIComponent(`${song.title} Taylor Swift`);
	spotifyLink.href = `https://open.spotify.com/search/${searchText}`;
	result.hidden = false;
	message.textContent = "";
	updateSaveButton();
}

// Show the next song, reshuffling after every song has been seen.
function nextSong(showRefreshMessage = false) {
	let startedNewMix = false;

	if (currentIndex >= shuffledSongs.length) {
		shuffledSongs = shuffleSongs(filterByMood(moodSelect.value));
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

	shuffledSongs = shuffleSongs(filterByMood(moodSelect.value));
	currentIndex = 0;
	nextSong();
}

recommendButton.addEventListener("click", recommendSong);
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
// Keep the visual theme in sync with the mood selected by the user.
moodSelect.addEventListener("change", () => {
	document.body.dataset.mood = moodSelect.value;
});
const songsLoadPromise = loadSongs();

renderFavorites();
