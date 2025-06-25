console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];

    for (let element of as) {
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    // Render playlist
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `
        <li>
            <img class="invert" width="34" src="img/music.svg" alt="">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>Harry</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div>
        </li>`;
    }

    // Click event for each song
    Array.from(songUL.children).forEach(li => {
        li.addEventListener("click", () => {
            const track = li.querySelector(".info div").innerText.trim();
            playMusic(track);
        });
    });

    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/${track}`;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerText = decodeURI(track);
    document.querySelector(".songtime").innerText = "00:00 / 00:00";
};

async function displayAlbums() {
    console.log("Displaying albums...");
    let res = await fetch(`/songs/`);
    let text = await res.text();
    let div = document.createElement("div");
    div.innerHTML = text;
    let anchors = Array.from(div.getElementsByTagName("a"));
    let cardContainer = document.querySelector(".cardContainer");

    for (const a of anchors) {
        if (a.href.includes("/songs/") && !a.href.includes(".htaccess")) {
            let folder = a.href.split("/").slice(-2)[0];
            try {
                let meta = await fetch(`/songs/${folder}/info.json`);
                let data = await meta.json();

                cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="Cover">
                    <h2>${data.title}</h2>
                    <p>${data.description}</p>
                </div>`;
            } catch (err) {
                console.warn(`Could not load album info for: ${folder}`);
            }
        }
    }

    // Card click to load songs
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            const folder = card.dataset.folder;
            songs = await getSongs(`songs/${folder}`);
            playMusic(songs[0]);
        });
    });
}

async function main() {
    await getSongs("songs/ncs");
    playMusic(songs[0], true);
    await displayAlbums();

    // Play/Pause Button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    // Update Seekbar and Time
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerText = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = `${(currentSong.currentTime / currentSong.duration) * 100}%`;
    });

    // Click to seek
    document.querySelector(".seekbar").addEventListener("click", e => {
        const seekbar = document.querySelector(".seekbar");
        const rect = seekbar.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percent = (offsetX / rect.width) * 100;

        document.querySelector(".circle").style.left = `${percent}%`;
        currentSong.currentTime = (percent / 100) * currentSong.duration;
    });

    // Hamburger Menu
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Close Sidebar
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous Song
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index > 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Next Song
    next.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index < songs.length - 1) {
            playMusic(songs[index + 1]);
        }
    });

    // Volume Range Input
    document.querySelector(".range input").addEventListener("input", (e) => {
        const value = parseInt(e.target.value);
        currentSong.volume = value / 100;
        const volumeIcon = document.querySelector(".volume > img");
        volumeIcon.src = value === 0 ? "img/mute.svg" : "img/volume.svg";
    });

    // Mute / Unmute Toggle
    document.querySelector(".volume > img").addEventListener("click", e => {
        const input = document.querySelector(".range input");
        if (currentSong.volume > 0) {
            e.target.src = "img/mute.svg";
            currentSong.volume = 0;
            input.value = 0;
        } else {
            e.target.src = "img/volume.svg";
            currentSong.volume = 0.1;
            input.value = 10;
        }
    });
}

main();
