
/* =========================================
   1. FIREBASE CONFIGURATION
========================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBclHoz-rqVVmh3UbAQcZyX6WOqBdBLZM",
  authDomain: "letter-ce8a6.firebaseapp.com",
  projectId: "letter-ce8a6",
  storageBucket: "letter-ce8a6.firebasestorage.app",
  messagingSenderId: "53471037365",
  appId: "1:53471037365:web:f60bb83b39002fcfc2fbfc",
  measurementId: "G-68ZW83N7VT"
};

let db = null;

try {
  if (
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  ) {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

/* =========================================
   2. COMPLETE LETTER — UPDATED
========================================= */

const originalLetter = `To
Hima Krishna Priya
Kodad
Telengana

Subject: Your wish fill anything

Respected Hima,

Miru rasina reply chadhiva, miru ignore chesthunnaru ala em feel avakandi, actually daily miku messages chestha ga, so na day ela undhi ani miku chepdham ani letters rasa, miru reply evakapoyina parledhu, but ala em anukokandi miru. Eroju letter em rayakudadhu anukunna, but miru ala em feel avakandi ani chepatam kosam letter rasthunna.

Miku okati cheppana, nina night nen message chesa ga miku appudu miru reply echaru, normal ga message chestha ga alane message chesa miku and miru last varaku reply echaru, morning lechaka chusthe chat em ledhu, just "Hai" message okati undhi, miku telsu ga nadhi kodi brain ani, taravatha chala time alochinchaka ardham ayindhi, miru message cheyaledhu, adhi dream ani.

Miru eve em alochinchakandi, inti dagara miku em anna works unte chuskondi, intlo valatho time spend cheyandi and miru nanu ignore chesthunnaru ala em anukokandi, miru message cheyali ante message cheyandi, miru letters rayamante rastha lekapothe ledhu.

Actually letter morning send chedham anukunna, but send chedhama odha ani alochisthu, ippudu send chesthunna, sorry if I disturbed you, actually nen chepdham anukunindhi miku ardham ayindha ledha ani ardham kavatam ledhu, hope you understood, em ledhu just one thing "Miru holidays happy ga enjoy cheyandi", take care.

Thanking you

Yours sincerely,
Rahul`;

/* =========================================
   3. GET HTML ELEMENTS
========================================= */

const $ = (id) => document.getElementById(id);

const journey = $("journey");
const welcome = $("welcome");
const envelopeScreen = $("envelopeScreen");
const letterScreen = $("letterScreen");
const replyScreen = $("replyScreen");
const confirmation = $("confirmation");

const travelLetter = $("travelLetter");
const travelPostbox = $("travelPostbox");
const cityScene = $("cityScene");
const sceneCaption = $("sceneCaption");
const skipButton = $("skipButton");

const postboxButton = $("postboxButton");
const envelopeButton = $("envelopeButton");

const letterPagesElement = $("letterPages");
const previousPageButton = $("previousPageButton");
const nextPageButton = $("nextPageButton");
const pageIndicator = $("pageIndicator");
const replyButton = $("replyButton");

const replyForm = $("replyForm");
const replyText = $("replyText");
const postButton = $("postButton");
const errorMessage = $("errorMessage");

/* =========================================
   4. AUTOMATIC LETTER PAGINATION
========================================= */

let letterPageChunks = [];
let currentLetterPage = 0;
let pageAnimationBusy = false;
let resizeTimer = null;

function paginateLetter() {
  if (letterScreen.classList.contains("hidden")) {
    return;
  }

  const pageHeight = letterPagesElement.clientHeight;
  const pageWidth = letterPagesElement.clientWidth;

  if (pageHeight <= 0 || pageWidth <= 0) {
    return;
  }

  const previousIndex = currentLetterPage;
  const measurer = document.createElement("div");

  measurer.className =
    "handwritten-letter letter-page-content letter-measurer";

  Object.assign(measurer.style, {
    width: `${pageWidth}px`,
    height: "auto",
    minHeight: "0",
    maxHeight: "none",
    overflow: "visible"
  });

  document.body.appendChild(measurer);

  const tokens = originalLetter.match(/\s+|[^\s]+/g) || [
    originalLetter
  ];

  const pages = [];
  let current = "";

  for (const token of tokens) {
    const candidate = current + token;
    measurer.textContent = candidate;

    if (
      current.length > 0 &&
      measurer.scrollHeight > pageHeight
    ) {
      const finishedPage = current.trimEnd();

      if (finishedPage.trim()) {
        pages.push(finishedPage);
      }

      current = token.trimStart();
      measurer.textContent = current;

      if (
        measurer.scrollHeight > pageHeight &&
        current.length > 1
      ) {
        const characters = Array.from(current);
        let piece = "";

        for (const character of characters) {
          measurer.textContent = piece + character;

          if (
            piece.length > 0 &&
            measurer.scrollHeight > pageHeight
          ) {
            pages.push(piece);
            piece = character;
          } else {
            piece += character;
          }
        }

        current = piece;
      }
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    pages.push(current.trimEnd());
  }

  measurer.remove();

  letterPageChunks = pages.length ? pages : [originalLetter];

  currentLetterPage = Math.min(
    previousIndex,
    letterPageChunks.length - 1
  );

  renderLetterPages();
}

/* =========================================
   5. CREATE AND DISPLAY LETTER PAGES
========================================= */

function createLetterPage(content) {
  const page = document.createElement("div");
  page.className = "letter-page";

  const text = document.createElement("div");
  text.className =
    "handwritten-letter letter-page-content";

  text.textContent = content;
  page.appendChild(text);

  return page;
}

function renderLetterPages() {
  letterPagesElement.replaceChildren();

  const content =
    letterPageChunks[currentLetterPage] || originalLetter;

  letterPagesElement.appendChild(createLetterPage(content));

  const isFirstPage = currentLetterPage === 0;
  const isLastPage =
    currentLetterPage === letterPageChunks.length - 1;

  previousPageButton.hidden = isFirstPage;
  nextPageButton.hidden = isLastPage;

  // Reply button appears only on the final page.
  replyButton.hidden = !isLastPage;

  pageIndicator.textContent =
    `Page ${currentLetterPage + 1} of ${letterPageChunks.length}`;
}

/* =========================================
   6. 3D PAGE-TURN ANIMATION
========================================= */

function turnLetterPage(direction) {
  if (pageAnimationBusy) {
    return;
  }

  const nextIndex = currentLetterPage + direction;

  if (
    nextIndex < 0 ||
    nextIndex >= letterPageChunks.length
  ) {
    return;
  }

  const currentPage =
    letterPagesElement.querySelector(".letter-page");

  if (!currentPage) {
    currentLetterPage = nextIndex;
    renderLetterPages();
    return;
  }

  const turningPage = currentPage.cloneNode(true);

  turningPage.className = "letter-page page-turn-overlay";
  turningPage.setAttribute("aria-hidden", "true");

  pageAnimationBusy = true;
  currentLetterPage = nextIndex;

  renderLetterPages();
  letterPagesElement.appendChild(turningPage);

  void turningPage.offsetWidth;

  turningPage.classList.add(
    direction > 0
      ? "page-turn-forward"
      : "page-turn-backward"
  );

  let finished = false;

  const finishTurn = () => {
    if (finished) {
      return;
    }

    finished = true;
    turningPage.remove();
    pageAnimationBusy = false;
  };

  turningPage.addEventListener("animationend", finishTurn, {
    once: true
  });

  window.setTimeout(finishTurn, 1200);
}

nextPageButton.addEventListener("click", () => {
  turnLetterPage(1);
});

previousPageButton.addEventListener("click", () => {
  turnLetterPage(-1);
});

/* =========================================
   7. RESPONSIVE PAGINATION
========================================= */

window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);

  resizeTimer = window.setTimeout(() => {
    if (!letterScreen.classList.contains("hidden")) {
      paginateLetter();
    }
  }, 200);
});

/* =========================================
   8. SCREEN MANAGEMENT
========================================= */

const screens = [
  journey,
  welcome,
  envelopeScreen,
  letterScreen,
  replyScreen,
  confirmation
];

function showScreen(target) {
  screens.forEach((screen) => {
    screen.classList.add("hidden");
  });

  target.classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "auto"
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* =========================================
   9. OPENING ANIMATION CONTROL
========================================= */

let animationToken = 0;
let animationFinished = false;

function stillCurrent(token) {
  return token === animationToken && !animationFinished;
}

/* =========================================
   10. CITY SCENES
========================================= */

// Images are directly beside index.html.
// No images/ folder is used.

const scenes = [
  {
    name: "Tirupati",
    image: "Tirupati.png"
  },
  {
    name: "Kodad",
    image: "kodad.png"
  }
];

async function typeWriter(text, element, token) {
  element.textContent = "";

  for (let i = 0; i < text.length; i++) {
    if (!stillCurrent(token)) {
      return;
    }

    element.textContent += text[i];
    await wait(180);
  }
}

async function showCityScene(scene, token) {
  if (!stillCurrent(token)) {
    return;
  }

  cityScene.classList.remove("show", "jerk");
  sceneCaption.textContent = "";

  const imageUrl = new URL(scene.image, document.baseURI).href;

  cityScene.style.backgroundImage =
    `linear-gradient(#21140b35, #21140b35), url("${imageUrl}")`;

  await wait(350);

  if (!stillCurrent(token)) {
    return;
  }

  cityScene.classList.add("show", "jerk");

  await wait(500);

  if (!stillCurrent(token)) {
    return;
  }

  await typeWriter(scene.name, sceneCaption, token);

  if (!stillCurrent(token)) {
    return;
  }

  await wait(1700);

  if (!stillCurrent(token)) {
    return;
  }

  // Screen turns black between Tirupati and Kodad.
  if (scene.name === "Tirupati") {
    cityScene.classList.remove("show");
    journey.classList.add("black-transition");

    await wait(1000);

    if (!stillCurrent(token)) {
      return;
    }
  } else {
    cityScene.classList.remove("show");
    await wait(1000);
  }

  cityScene.classList.remove("jerk");
}

/* =========================================
   11. AUTOMATIC JOURNEY
========================================= */

async function runOpeningAnimation() {
  const token = ++animationToken;
  animationFinished = false;

  showScreen(journey);

  journey.classList.remove("black-transition");
  skipButton.classList.remove("hidden");

  travelLetter.className = "travel-letter";
  travelLetter.style.display = "block";

  travelPostbox.className = "travel-postbox";

  cityScene.className = "city-scene";
  cityScene.style.backgroundImage = "";

  sceneCaption.textContent = "";

  // Postbox appears.
  await wait(500);

  if (!stillCurrent(token)) return;

  travelPostbox.classList.add("visible");

  // Letter begins its journey.
  await wait(450);

  if (!stillCurrent(token)) return;

  travelLetter.classList.add("fly");

  await wait(2500);

  if (!stillCurrent(token)) return;

  // Letter enters the postbox.
  travelLetter.classList.remove("fly");
  travelLetter.classList.add("disappear");

  travelPostbox.classList.add("receive");

  await wait(700);

  if (!stillCurrent(token)) return;

  travelLetter.style.display = "none";

  // Postbox flies away.
  travelPostbox.classList.add("fly-away");

  await wait(1100);

  if (!stillCurrent(token)) return;

  // First: Tirupati.
  await showCityScene(scenes[0], token);

  if (!stillCurrent(token)) return;

  // Second: Kodad.
  await showCityScene(scenes[1], token);

  if (!stillCurrent(token)) return;

  finishOpening(true);
}

/* =========================================
   12. SKIP BUTTON
========================================= */

function finishOpening(animatePostbox = false) {
  if (animationFinished) {
    return;
  }

  animationFinished = true;
  animationToken++;

  skipButton.classList.add("hidden");

  showScreen(welcome);

  postboxButton.classList.remove("arrive");

  if (animatePostbox) {
    void postboxButton.offsetWidth;
    postboxButton.classList.add("arrive");
  }
}

skipButton.addEventListener("click", () => {
  finishOpening();
});

/* =========================================
   13. WELCOME POSTBOX
========================================= */

postboxButton.addEventListener("click", () => {
  showScreen(envelopeScreen);
});

/* =========================================
   14. OPEN ENVELOPE
========================================= */

envelopeButton.addEventListener("click", async () => {
  if (envelopeButton.disabled) {
    return;
  }

  envelopeButton.disabled = true;
  envelopeButton.classList.add("opening");

  try {
    await wait(800);

    showScreen(letterScreen);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        paginateLetter();
      });
    });
  } finally {
    envelopeButton.classList.remove("opening");
    envelopeButton.disabled = false;
  }
});

/* =========================================
   15. REPLY BUTTON
========================================= */

replyButton.addEventListener("click", () => {
  errorMessage.textContent = "";

  showScreen(replyScreen);

  replyText.focus();
});

/* =========================================
   16. SAVE REPLY TO FIREBASE
========================================= */

replyForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = replyText.value.trim();

  if (!message) {
    errorMessage.textContent =
      "Please write a letter before posting.";
    return;
  }

  if (message.length > 10000) {
    errorMessage.textContent =
      "Your letter is too long.";
    return;
  }

  if (!db) {
    errorMessage.textContent =
      "Firebase is not configured. Check your Firebase settings.";
    return;
  }

  postButton.disabled = true;
  postButton.textContent = "Posting your letter...";
  errorMessage.textContent = "";

  try {
    await db.collection("letters").add({
      recipient: "Rahul",
      sender: "Hima Krishna Priya",
      message: message,
      createdAt:
        firebase.firestore.FieldValue.serverTimestamp()
    });

    replyText.value = "";
    showScreen(confirmation);
  } catch (error) {
    console.error("Could not save the reply:", error);

    errorMessage.textContent =
      "Your letter could not be posted. Check your internet connection and try again.";
  } finally {
    postButton.disabled = false;
    postButton.textContent = "Post My Letter ✉";
  }
});

/* =========================================
   17. START WEBSITE
========================================= */

runOpeningAnimation();
