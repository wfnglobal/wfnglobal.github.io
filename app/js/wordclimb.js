// The Word Climb — a 100-question Scripture quiz, Millionaire-style.
// Self-contained module: WFNGame.mount(el) draws the game into any
// container and wires its own events; WFNGame.unmount() tears down
// timers/listeners when the SPA router navigates away.
(function () {
  "use strict";

  // -----------------------------------------------------------------
  // Question bank — 100 questions, 20 per level, easy to hard.
  // Each playthrough draws a random handful per level (see PER_LEVEL)
  // so the bank stays large without making one climb feel endless.
  // -----------------------------------------------------------------
  var LEVELS = [
    { name: "Genesis Steps", tier: "Easy", questions: [
      { q: "Who built the ark at God's command?", opts: ["Noah", "Abraham", "Moses", "David"], a: 0 },
      { q: "“In the beginning God created the heavens and the ___.”", opts: ["sea", "earth", "stars", "sun"], a: 1 },
      { q: "On which day did God rest after creation?", opts: ["3rd", "6th", "7th", "40th"], a: 2 },
      { q: "What was the first man's name?", opts: ["Adam", "Cain", "Abel", "Seth"], a: 0 },
      { q: "What was the first woman's name?", opts: ["Eve", "Sarah", "Rachel", "Ruth"], a: 0 },
      { q: "Where did Adam and Eve live?", opts: ["Garden of Eden", "Garden of Gethsemane", "Mount Sinai", "Jericho"], a: 0 },
      { q: "Who was Adam and Eve's first son?", opts: ["Seth", "Abel", "Cain", "Enoch"], a: 2 },
      { q: "Who killed his brother Abel?", opts: ["Cain", "Seth", "Lamech", "Enoch"], a: 0 },
      { q: "How many of Noah's family boarded the ark with him?", opts: ["6", "8", "10", "12"], a: 1 },
      { q: "What sign did God give after the flood as a promise?", opts: ["A rainbow", "A dove", "A star", "An altar"], a: 0 },
      { q: "What tower did people build to reach the heavens?", opts: ["Tower of Babel", "Tower of David", "Pyramid of Giza", "Jacob's Ladder"], a: 0 },
      { q: "Who is called the father of many nations?", opts: ["Abraham", "Isaac", "Jacob", "Joseph"], a: 0 },
      { q: "What was Abraham's name before God changed it?", opts: ["Abram", "Abner", "Amram", "Asher"], a: 0 },
      { q: "Who was Abraham's son of promise?", opts: ["Ishmael", "Isaac", "Esau", "Jacob"], a: 1 },
      { q: "Who was Isaac's wife?", opts: ["Rebekah", "Rachel", "Leah", "Sarah"], a: 0 },
      { q: "Who were Isaac's twin sons?", opts: ["Cain and Abel", "Jacob and Esau", "Moses and Aaron", "Peter and Andrew"], a: 1 },
      { q: "Jacob's name was changed to what?", opts: ["Judah", "Israel", "Ephraim", "Levi"], a: 1 },
      { q: "How many sons did Jacob have?", opts: ["7", "10", "12", "14"], a: 2 },
      { q: "Who was sold into slavery by his own brothers?", opts: ["Joseph", "Benjamin", "Reuben", "Judah"], a: 0 },
      { q: "What did Joseph famously interpret for Pharaoh?", opts: ["Dreams", "Letters", "Laws", "Stars"], a: 0 },
    ]},
    { name: "Exodus Trail", tier: "Easy–Medium", questions: [
      { q: "Who led the Israelites out of slavery in Egypt?", opts: ["Joshua", "Aaron", "Moses", "Samuel"], a: 2 },
      { q: "How many commandments did God give Moses on Sinai?", opts: ["7", "10", "12", "40"], a: 1 },
      { q: "What sea did God part for Israel to cross on dry ground?", opts: ["The Jordan River", "The Dead Sea", "The Red Sea", "The Nile"], a: 2 },
      { q: "Baby Moses was found floating in what?", opts: ["A basket on the river", "A cave", "A tent", "A well"], a: 0 },
      { q: "What was Moses tending when God spoke from the burning bush?", opts: ["Sheep", "Goats", "Cattle", "Camels"], a: 0 },
      { q: "How many plagues did God send on Egypt?", opts: ["7", "9", "10", "12"], a: 2 },
      { q: "What food did God provide daily in the wilderness?", opts: ["Manna", "Quail only", "Loaves", "Honeycomb"], a: 0 },
      { q: "Where did Moses receive the Ten Commandments?", opts: ["Mount Carmel", "Mount Zion", "Mount Sinai", "Mount Nebo"], a: 2 },
      { q: "Who was Moses' brother who spoke to Pharaoh with him?", opts: ["Aaron", "Joshua", "Caleb", "Nun"], a: 0 },
      { q: "Who succeeded Moses as leader of Israel?", opts: ["Caleb", "Aaron", "Joshua", "Samuel"], a: 2 },
      { q: "Whose walls fell after Israel marched around them?", opts: ["Jerusalem", "Jericho", "Ai", "Hebron"], a: 1 },
      { q: "How many years did Israel wander in the wilderness?", opts: ["10", "25", "40", "70"], a: 2 },
      { q: "Which judge was known for his great strength and long hair?", opts: ["Samson", "Gideon", "Ehud", "Othniel"], a: 0 },
      { q: "Who cut Samson's hair, leading to his downfall?", opts: ["Delilah", "Deborah", "Jael", "Rahab"], a: 0 },
      { q: "Which judge defeated the Midianites with only 300 men?", opts: ["Samson", "Barak", "Gideon", "Jephthah"], a: 2 },
      { q: "Who was the first king of Israel?", opts: ["David", "Saul", "Solomon", "Samuel"], a: 1 },
      { q: "Which shepherd boy became Israel's second king?", opts: ["David", "Jonathan", "Absalom", "Solomon"], a: 0 },
      { q: "Who did young David defeat with a sling and a stone?", opts: ["Goliath", "Og", "Agag", "Sisera"], a: 0 },
      { q: "Which king was famed for his wisdom and built the first Temple?", opts: ["David", "Saul", "Solomon", "Rehoboam"], a: 2 },
      { q: "What animal spoke to the prophet Balaam?", opts: ["A donkey", "A raven", "A serpent", "A lion"], a: 0 },
    ]},
    { name: "Psalms Ascent", tier: "Medium", questions: [
      { q: "“The Lord is my shepherd; I shall not ___.”", opts: ["fear", "want", "fall", "wander"], a: 1 },
      { q: "Who wrote most of the Psalms?", opts: ["Solomon", "David", "Asaph", "Moses"], a: 1 },
      { q: "“Faith cometh by hearing, and hearing by the ___ of God.” (Romans 10:17)", opts: ["spirit", "law", "word", "voice"], a: 2 },
      { q: "Who wrote most of the book of Proverbs?", opts: ["David", "Solomon", "Asaph", "Agur"], a: 1 },
      { q: "“Trust in the Lord with all thine ___, and lean not unto thine own understanding.”", opts: ["soul", "heart", "mind", "strength"], a: 1 },
      { q: "In Psalm 23, what does God prepare in the presence of mine enemies?", opts: ["A table", "A tent", "A throne", "An altar"], a: 0 },
      { q: "Which book opens, “Vanity of vanities, all is vanity”?", opts: ["Job", "Ecclesiastes", "Lamentations", "Proverbs"], a: 1 },
      { q: "Who was thrown into a den of lions for praying to God?", opts: ["Daniel", "Joseph", "Elijah", "Jeremiah"], a: 0 },
      { q: "Who were thrown into a fiery furnace for refusing to bow to an idol?", opts: ["Shadrach, Meshach, and Abednego", "Peter, James, and John", "Moses, Aaron, and Miriam", "Job's three friends"], a: 0 },
      { q: "Which book tells of a Moabite woman loyal to her mother-in-law Naomi?", opts: ["Esther", "Ruth", "Judith", "Tamar"], a: 1 },
      { q: "Which queen of Persia risked her life to save her people?", opts: ["Esther", "Vashti", "Bathsheba", "Jezebel"], a: 0 },
      { q: "Which prophet married an unfaithful woman as a picture of Israel?", opts: ["Hosea", "Amos", "Joel", "Micah"], a: 0 },
      { q: "“A friend loveth at all times” is found in which book?", opts: ["Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon"], a: 1 },
      { q: "Who rebuilt Jerusalem's wall after the exile?", opts: ["Ezra", "Nehemiah", "Zerubbabel", "Haggai"], a: 1 },
      { q: "Who read the Law aloud to the people after returning from Babylon?", opts: ["Nehemiah", "Ezra", "Malachi", "Zechariah"], a: 1 },
      { q: "What swallowed the prophet Jonah?", opts: ["A great fish", "A whirlwind", "A flood", "A cave"], a: 0 },
      { q: "Why did Jonah first flee from God's command?", opts: ["He feared the sea", "He didn't want to preach to Nineveh", "He was ill", "He had no ship fare"], a: 1 },
      { q: "“The fear of the Lord is the beginning of ___.”", opts: ["life", "wisdom", "faith", "mercy"], a: 1 },
      { q: "Which Psalm is known as “The Shepherd Psalm”?", opts: ["Psalm 1", "Psalm 23", "Psalm 91", "Psalm 119"], a: 1 },
      { q: "Who said, “Whither thou goest, I will go” to her mother-in-law?", opts: ["Ruth", "Esther", "Rahab", "Deborah"], a: 0 },
    ]},
    { name: "Prophets' Climb", tier: "Medium–Hard", questions: [
      { q: "Which prophet stood alone against 450 prophets of Baal on Mount Carmel?", opts: ["Elisha", "Isaiah", "Elijah", "Micah"], a: 2 },
      { q: "Who interpreted King Nebuchadnezzar's dream of the four kingdoms?", opts: ["Daniel", "Ezra", "Nehemiah", "Joel"], a: 0 },
      { q: "Who was taken up to heaven in a chariot of fire?", opts: ["Elisha", "Elijah", "Enoch", "Moses"], a: 1 },
      { q: "Who received a double portion of Elijah's spirit as his successor?", opts: ["Elisha", "Obadiah", "Micaiah", "Gehazi"], a: 0 },
      { q: "Which prophet saw a valley of dry bones come back to life?", opts: ["Jeremiah", "Ezekiel", "Daniel", "Isaiah"], a: 1 },
      { q: "Which prophet is known as “the weeping prophet”?", opts: ["Jeremiah", "Hosea", "Amos", "Nahum"], a: 0 },
      { q: "Who baptized Jesus in the Jordan River?", opts: ["Peter", "John the Baptist", "Andrew", "Philip"], a: 1 },
      { q: "How many disciples did Jesus choose as His closest followers?", opts: ["7", "10", "12", "70"], a: 2 },
      { q: "Who betrayed Jesus for thirty pieces of silver?", opts: ["Judas Iscariot", "Thomas", "Peter", "Matthew"], a: 0 },
      { q: "Who denied knowing Jesus three times before the rooster crowed?", opts: ["Peter", "John", "Judas", "Andrew"], a: 0 },
      { q: "What was Jesus' first recorded miracle?", opts: ["Healing a leper", "Turning water into wine", "Walking on water", "Feeding 5,000"], a: 1 },
      { q: "How many people did Jesus feed with five loaves and two fish?", opts: ["500", "1,000", "5,000", "10,000"], a: 2 },
      { q: "Who did Jesus raise from the dead after four days in the tomb?", opts: ["Lazarus", "Jairus' daughter", "The widow's son", "Stephen"], a: 0 },
      { q: "On what day of the week did Jesus rise from the dead?", opts: ["Friday", "Saturday", "Sunday", "Monday"], a: 2 },
      { q: "Who was the Roman governor who presided over Jesus' trial?", opts: ["Herod", "Pontius Pilate", "Felix", "Festus"], a: 1 },
      { q: "Which disciple doubted the resurrection until he saw Jesus' wounds?", opts: ["Thomas", "Philip", "Bartholomew", "James"], a: 0 },
      { q: "Who was struck blind on the road to Damascus and became an apostle?", opts: ["Stephen", "Barnabas", "Saul (Paul)", "Silas"], a: 2 },
      { q: "Who was stoned to death as the first Christian martyr?", opts: ["Stephen", "James", "Timothy", "Barnabas"], a: 0 },
      { q: "Which short letter did Paul write about a runaway slave?", opts: ["Titus", "Philemon", "Jude", "2 Timothy"], a: 1 },
      { q: "Who was the prophet whose book opens with his own unfaithful marriage as a sign?", opts: ["Hosea", "Joel", "Obadiah", "Habakkuk"], a: 0 },
    ]},
    { name: "Revelation Summit", tier: "Hard", questions: [
      { q: "How many seals are on the scroll in Revelation?", opts: ["5", "6", "7", "12"], a: 2 },
      { q: "Who declares, “I am Alpha and Omega” in Revelation?", opts: ["An angel", "The Lamb (Jesus Christ)", "John", "Michael"], a: 1 },
      { q: "What is the name of the final great battle described in Revelation?", opts: ["Jericho", "Armageddon", "Carmel", "Megiddo Pass"], a: 1 },
      { q: "On which island was John exiled when he received Revelation?", opts: ["Crete", "Cyprus", "Patmos", "Malta"], a: 2 },
      { q: "How many churches are addressed in Revelation chapters 2–3?", opts: ["5", "7", "9", "12"], a: 1 },
      { q: "What is “the number of the beast” in Revelation 13?", opts: ["616", "666", "777", "888"], a: 1 },
      { q: "What is the name of the great fallen city in Revelation?", opts: ["Nineveh", "Babylon the Great", "Tyre", "Sodom"], a: 1 },
      { q: "What city comes down from heaven in Revelation 21?", opts: ["New Jerusalem", "Zion restored", "The Holy City of David", "Eden Renewed"], a: 0 },
      { q: "How many elders sit around the throne in Revelation 4?", opts: ["12", "24", "70", "144"], a: 1 },
      { q: "The four living creatures around the throne are likened to a lion, an ox, an eagle, and what else?", opts: ["A man", "A horse", "A serpent", "A lamb"], a: 0 },
      { q: "What is the thousand-year reign in Revelation 20 commonly called?", opts: ["The Tribulation", "The Millennium", "The Jubilee", "The Sabbath Rest"], a: 1 },
      { q: "Which archangel is named in Scripture as fighting against Satan?", opts: ["Gabriel", "Michael", "Raphael", "Uriel"], a: 1 },
      { q: "What tree's leaves bring healing to the nations in Revelation 22?", opts: ["The tree of life", "The olive tree", "The fig tree", "The cedar of Lebanon"], a: 0 },
      { q: "In Daniel's vision, a statue of different materials represented how many kingdoms?", opts: ["3", "4", "5", "7"], a: 1 },
      { q: "Who was cast into the lions' den under King Darius?", opts: ["Daniel", "Shadrach", "Mordecai", "Ezra"], a: 0 },
      { q: "What did the handwriting on the wall declare to King Belshazzar?", opts: ["“Peace, be still”", "“Mene, Mene, Tekel, Upharsin”", "“Holy, Holy, Holy”", "“It is finished”"], a: 1 },
      { q: "Which Old Testament book features a night vision of four beasts representing kingdoms?", opts: ["Ezekiel", "Daniel", "Zechariah", "Joel"], a: 1 },
      { q: "Who is described as “the Ancient of days” in Daniel's vision?", opts: ["Michael the archangel", "God the Father", "The prophet Daniel", "Gabriel"], a: 1 },
      { q: "What is written on the forehead of the beast's followers in Revelation?", opts: ["A crown", "A mark", "A seal of God", "A name only"], a: 1 },
      { q: "What does the rider on the pale horse in Revelation 6 represent?", opts: ["Famine", "War", "Death", "Conquest"], a: 2 },
    ]},
  ];

  var PER_LEVEL = 4; // questions asked per level, drawn at random from each pool of 20
  var TIME_LIMIT = 20;

  // Rotating verse strip, standalone beneath the game card — scripture
  // still in view between questions. Text-only (no color block): each
  // verse carries a tint used only on its small reference label.
  var TICKER_VERSES = [
    { text: "“The Lord is my shepherd; I shall not want.”", ref: "Psalm 23:1", color: "#4F7A68" },
    { text: "“I can do all things through Christ which strengtheneth me.”", ref: "Philippians 4:13", color: "#9C7A34" },
    { text: "“For God so loved the world, that he gave his only begotten Son.”", ref: "John 3:16", color: "#4A4E8C" },
    { text: "“Trust in the Lord with all thine heart.”", ref: "Proverbs 3:5", color: "#9C5240" },
    { text: "“Be strong and of a good courage; be not afraid.”", ref: "Joshua 1:9", color: "#2E7A73" },
    { text: "“The joy of the Lord is your strength.”", ref: "Nehemiah 8:10", color: "#7A4A70" },
    { text: "“In the beginning God created the heaven and the earth.”", ref: "Genesis 1:1", color: "#3E6286" },
    { text: "“Faith cometh by hearing, and hearing by the word of God.”", ref: "Romans 10:17", color: "#A9824F" },
    { text: "“This is the day which the Lord hath made; we will rejoice.”", ref: "Psalm 118:24", color: "#4F7A68" },
    { text: "“Thy word is a lamp unto my feet, and a light unto my path.”", ref: "Psalm 119:105", color: "#9C7A34" },
    { text: "“Let all that you do be done in love.”", ref: "1 Corinthians 16:14", color: "#9C5240" },
    { text: "“He giveth power to the faint; to them that have no might he increaseth strength.”", ref: "Isaiah 40:29", color: "#4A4E8C" },
    { text: "“Casting all your care upon him; for he careth for you.”", ref: "1 Peter 5:7", color: "#7A4A70" },
    { text: "“Call unto me, and I will answer thee.”", ref: "Jeremiah 33:3", color: "#2E7A73" },
  ];

  var SCROLLS = [
    { rank: "Level 1 · Genesis Steps", name: "A Seed Takes Root",
      verse: "“And God said, Let there be light: and there was light.”", ref: "Genesis 1:3",
      poem: "From dust to breath, from void to form,\nHe speaks you steady through the storm.",
      word: "This is a new beginning. What God starts in you, He will stay to finish." },
    { rank: "Level 2 · Exodus Trail", name: "Deliverance Is Coming",
      verse: "“The Lord shall fight for you, and ye shall hold your peace.”", ref: "Exodus 14:14",
      poem: "The sea will part before your feet,\nThe ground once feared will turn retreat.",
      word: "You are walking out of a season of bondage and into a place you were promised." },
    { rank: "Level 3 · Psalms Ascent", name: "The Shepherd's Song",
      verse: "“The Lord is my shepherd; I shall not want.”", ref: "Psalm 23:1",
      poem: "Still waters hold the peace you seek,\nHe leads the strong and lifts the weak.",
      word: "Rest is not far from you. Your Shepherd already knows the path ahead." },
    { rank: "Level 4 · Prophets' Climb", name: "The Fire Still Falls",
      verse: "“When thou walkest through the fire, thou shalt not be burned.”", ref: "Isaiah 43:2",
      poem: "The flame that tried to make you bow\nBecomes the light that marks you now.",
      word: "What was sent to consume you is being turned, quietly, into your testimony." },
    { rank: "Level 5 · Revelation Summit", name: "The Sealed Scroll",
      verse: "“Behold, I make all things new.”", ref: "Revelation 21:5",
      poem: "The scroll unrolls, the final page —\nNot an ending, but a new age.\nEvery tear you carried here\nHe turns to joy, and draws you near.",
      word: "You climbed in faith, and faith always reaches the top. What lies ahead is not a repeat of the past — it is new. The next door opens not by your strength, but by the One who called you up." },
  ];

  var CLIMB_ICON =
    '<svg viewBox="0 0 48 48" aria-hidden="true">' +
    '<defs><linearGradient id="wcGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#F6E8BE"/><stop offset="100%" stop-color="#C9A968"/></linearGradient></defs>' +
    '<circle cx="24" cy="24" r="21.5" fill="none" stroke="#9C7A34" stroke-width="0.9"/>' +
    '<path d="M14 35 L24 12" stroke="url(#wcGrad)" stroke-width="1.8" stroke-linecap="round"/>' +
    '<path d="M34 35 L24 12" stroke="url(#wcGrad)" stroke-width="1.8" stroke-linecap="round"/>' +
    '<line x1="16.3" y1="29.5" x2="31.7" y2="29.5" stroke="url(#wcGrad)" stroke-width="1.6" stroke-linecap="round"/>' +
    '<line x1="18.6" y1="24" x2="29.4" y2="24" stroke="url(#wcGrad)" stroke-width="1.6" stroke-linecap="round"/>' +
    '<line x1="20.9" y1="18.5" x2="27.1" y2="18.5" stroke="url(#wcGrad)" stroke-width="1.6" stroke-linecap="round"/>' +
    '<path d="M24 12 C22.3 9.3 22.7 6.8 24 4.8 C25.3 6.8 25.7 9.3 24 12 Z" fill="#F6E8BE"/>' +
    '</svg>';

  // -----------------------------------------------------------------
  // Audio — synthesized with Web Audio, no files to fetch or cache.
  // -----------------------------------------------------------------
  var Sound = (function () {
    var ctx = null, muted = false;
    try { muted = localStorage.getItem("wfn-climb-muted") === "1"; } catch (e) {}
    function ensure() {
      if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
      if (ctx && ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
    }
    function tone(freq, dur, type, vol, delay, glide) {
      if (muted || !ctx) return;
      type = type || "sine"; vol = vol || 0.2; delay = delay || 0;
      var t0 = ctx.currentTime + delay;
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, t0);
      if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(freq * glide, 20), t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.03);
    }
    function tick(urgent) { ensure(); tone(urgent ? 1250 : 900, 0.08, "square", urgent ? 0.16 : 0.08); }
    function correct() { ensure(); tone(523.25, 0.14, "sine", 0.22, 0); tone(659.25, 0.16, "sine", 0.22, 0.1); tone(783.99, 0.24, "sine", 0.24, 0.2); }
    function wrong() { ensure(); tone(220, 0.35, "sawtooth", 0.16, 0, 0.5); tone(160, 0.42, "sawtooth", 0.13, 0.08, 0.5); }
    function blip() { ensure(); tone(700, 0.09, "triangle", 0.15); }
    function levelUp() { ensure(); [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(f, 0.18, "triangle", 0.2, i * 0.12); }); }
    function scrollChime() { ensure(); tone(392, 0.9, "sine", 0.13, 0, 1.5); tone(587.33, 1.1, "sine", 0.11, 0.15, 1.3); tone(784, 1.3, "sine", 0.09, 0.3, 1.2); }
    function isMuted() { return muted; }
    function toggle(root) { ensure(); muted = !muted; try { localStorage.setItem("wfn-climb-muted", muted ? "1" : "0"); } catch (e) {} paint(root); if (!muted) blip(); }
    function paint(root) {
      if (!root) return;
      root.querySelectorAll(".wc-sound-toggle").forEach(function (el) {
        el.classList.toggle("on", !muted);
        el.setAttribute("aria-pressed", (!muted).toString());
        var icon = el.querySelector(".wc-st-icon"); if (icon) icon.textContent = muted ? "🔇" : "🔊";
        var label = el.querySelector(".wc-st-label"); if (label) label.textContent = muted ? "Sound Off" : "Sound On";
      });
    }
    return { ensure: ensure, tick: tick, correct: correct, wrong: wrong, blip: blip, levelUp: levelUp, scroll: scrollChime, isMuted: isMuted, toggle: toggle, paint: paint };
  })();

  // -----------------------------------------------------------------
  // Markup
  // -----------------------------------------------------------------
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  var TEMPLATE =
    '<div class="wc-stage">' +
      '<button class="wc-sound-toggle wc-mute-float" aria-label="Turn game sound on or off" aria-pressed="true">' +
        '<span class="wc-st-icon">🔊</span><span class="wc-st-label">Sound</span><span class="wc-st-switch"><span class="wc-st-thumb"></span></span>' +
      '</button>' +

      '<div class="wc-screen wc-show" data-screen="start">' +
        '<div class="wc-logo-ring">' + CLIMB_ICON + '</div>' +
        '<p class="wc-eyebrow">Word &amp; Faith Network</p>' +
        '<h1 class="wc-title-xl">The Word<br><span>Climb</span></h1>' +
        '<p class="wc-subtitle">Five levels. One hundred questions in the bank. Climb from Genesis to Revelation — and unlock a sealed scroll at the top.</p>' +
        '<div class="wc-rules">' +
          '<b>How it plays:</b> Answer correctly to climb. Miss one, and your climb ends — but you keep a scroll for the highest level you reached. Two lifelines per game: <b>50:50</b> and <b>Ask the Elder</b>. Sound can be switched off any time with the toggle in the top corner.' +
        '</div>' +
        '<button class="wc-btn wc-btn-gold" data-action="begin">Begin the Climb</button>' +
      '</div>' +

      '<div class="wc-screen" data-screen="ladder">' +
        '<p class="wc-eyebrow">Your Climb</p>' +
        '<h2 class="wc-ladder-title">Choose your footing</h2>' +
        '<div class="wc-ladder" data-el="ladder"></div>' +
        '<button class="wc-btn wc-btn-gold" data-action="startLevel">Start Level <span data-el="startLevelNum">1</span></button>' +
      '</div>' +

      '<div class="wc-screen" data-screen="question">' +
        '<div class="wc-q-head"><span data-el="qLevelLabel">Level 1</span><span data-el="qCountLabel">Question 1 of 4</span></div>' +
        '<div class="wc-timer-bar"><div class="wc-timer-fill" data-el="timerFill"></div></div>' +
        '<div class="wc-q-card"><p class="wc-q-text" data-el="qText">—</p></div>' +
        '<div class="wc-opts" data-el="qOpts"></div>' +
        '<div class="wc-lifelines">' +
          '<button class="wc-life" data-action="fifty" data-el="lifeFifty">50:50</button>' +
          '<button class="wc-life" data-action="elder" data-el="lifeElder">Ask the Elder</button>' +
        '</div>' +
      '</div>' +

      '<div class="wc-screen" data-screen="scroll">' +
        '<p class="wc-eyebrow">The Sealed Scroll</p>' +
        '<div class="wc-scroll-card">' +
          '<p class="wc-scroll-rank" data-el="scrollRank">Level Reached</p>' +
          '<h2 class="wc-scroll-name" data-el="scrollName">—</h2>' +
          '<p class="wc-scroll-verse" data-el="scrollVerse">—</p>' +
          '<p class="wc-scroll-ref" data-el="scrollRef">—</p>' +
          '<p class="wc-scroll-poem" data-el="scrollPoem">—</p>' +
          '<p class="wc-scroll-word" data-el="scrollWord">—</p>' +
        '</div>' +
        '<div class="wc-cert-wrap" data-el="certWrap">' +
          '<canvas class="wc-cert-canvas" data-el="certCanvas" width="1080" height="1350"></canvas>' +
        '</div>' +
        '<div class="wc-cert-actions">' +
          '<a class="wc-btn wc-btn-gold" data-action="downloadCert" data-el="downloadCertBtn" download="the-word-climb-certificate.png">Download Certificate</a>' +
          '<button class="wc-btn wc-btn-ghost" data-action="shareCert" data-el="shareCertBtn" hidden>Share</button>' +
        '</div>' +
        '<button class="wc-btn wc-btn-ghost" data-action="reset">Play Again</button>' +
      '</div>' +
    '</div>' +

    '<div class="wc-verse-strip" data-el="verseStrip">' +
      '<p class="wc-verse-strip-kicker">A Word While You Climb</p>' +
      '<div class="wc-verse-strip-stage">' +
        '<div class="wc-verse-strip-inner" data-el="verseStripInner">' +
          '<span class="wc-verse-strip-sparkle wc-sp1" aria-hidden="true">✦</span>' +
          '<p class="wc-verse-strip-text" data-el="verseStripText">—</p>' +
          '<p class="wc-verse-strip-ref" data-el="verseStripRef"></p>' +
          '<span class="wc-verse-strip-sparkle wc-sp2" aria-hidden="true">✦</span>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="wc-modal-wrap" data-el="modalWrap">' +
      '<div class="wc-modal">' +
        '<p class="wc-modal-badge" data-el="modalBadge">Stage Complete</p>' +
        '<h2 data-el="modalTitle">Well climbed.</h2>' +
        '<p data-el="modalBody">You have reached the next rung.</p>' +
        '<div class="wc-modal-row" data-el="modalButtons"></div>' +
      '</div>' +
    '</div>';

  // -----------------------------------------------------------------
  // Game controller
  // -----------------------------------------------------------------
  var root = null;
  var state = null;

  function qs(sel) { return root.querySelector(sel); }
  function el(name) { return root.querySelector('[data-el="' + name + '"]'); }
  function show(screenName) {
    root.querySelectorAll(".wc-screen").forEach(function (s) { s.classList.remove("wc-show"); });
    var s = root.querySelector('[data-screen="' + screenName + '"]');
    if (s) s.classList.add("wc-show");
  }

  function newState() {
    return {
      levelIdx: 0, qIdx: 0, usedFifty: false, usedElder: false,
      timer: null, timeLeft: TIME_LIMIT, locked: false,
      drawn: LEVELS.map(function (lv) { return shuffle(lv.questions).slice(0, PER_LEVEL); }),
    };
  }

  function goLadder() { Sound.ensure(); renderLadder(); show("ladder"); }

  function renderLadder() {
    var wrap = el("ladder");
    wrap.innerHTML = "";
    LEVELS.forEach(function (lv, i) {
      var div = document.createElement("div");
      div.className = "wc-rung" + (i === state.levelIdx ? " wc-current" : "") + (i < state.levelIdx ? " wc-done" : "");
      div.innerHTML = '<span><span class="wc-rn">LV ' + (i + 1) + '</span>  ' + esc(lv.name) + '</span><span>' + esc(lv.tier) + '</span>';
      wrap.appendChild(div);
    });
    el("startLevelNum").textContent = state.levelIdx + 1;
  }

  function startLevel() { state.qIdx = 0; loadQuestion(); show("question"); }

  function loadQuestion() {
    state.locked = false;
    var lv = LEVELS[state.levelIdx];
    var q = state.drawn[state.levelIdx][state.qIdx];
    el("qLevelLabel").textContent = "Level " + (state.levelIdx + 1) + " · " + lv.name;
    el("qCountLabel").textContent = "Question " + (state.qIdx + 1) + " of " + state.drawn[state.levelIdx].length;
    el("qText").textContent = q.q;
    var optsWrap = el("qOpts");
    optsWrap.innerHTML = "";
    var letters = ["A", "B", "C", "D"];
    q.opts.forEach(function (opt, i) {
      var b = document.createElement("button");
      b.className = "wc-opt"; b.setAttribute("data-opt", i);
      b.innerHTML = '<span class="wc-k">' + letters[i] + '</span><span>' + esc(opt) + '</span>';
      b.addEventListener("click", function () { answer(i); });
      optsWrap.appendChild(b);
    });
    el("lifeFifty").disabled = state.usedFifty;
    el("lifeElder").disabled = state.usedElder;
    startTimer();
  }

  function startTimer() {
    clearInterval(state.timer);
    state.timeLeft = TIME_LIMIT;
    var fill = el("timerFill");
    fill.style.width = "100%";
    state.timer = setInterval(function () {
      state.timeLeft -= 1;
      fill.style.width = Math.max(0, (state.timeLeft / TIME_LIMIT) * 100) + "%";
      if (state.timeLeft > 0) Sound.tick(state.timeLeft <= 5);
      if (state.timeLeft <= 0) { clearInterval(state.timer); if (!state.locked) answer(-1); }
    }, 1000);
  }

  function answer(i) {
    if (state.locked) return;
    state.locked = true;
    clearInterval(state.timer);
    var q = state.drawn[state.levelIdx][state.qIdx];
    root.querySelectorAll(".wc-opt").forEach(function (b) {
      var idx = Number(b.getAttribute("data-opt"));
      b.disabled = true;
      if (idx === q.a) b.classList.add("wc-correct");
      else if (idx === i) b.classList.add("wc-wrong");
    });
    if (i === q.a) { Sound.correct(); } else { Sound.wrong(); }
    setTimeout(function () { if (i === q.a) onCorrect(); else onWrong(); }, 900);
  }

  function onCorrect() {
    var lv = LEVELS[state.levelIdx];
    var pool = state.drawn[state.levelIdx];
    if (state.qIdx < pool.length - 1) {
      state.qIdx += 1;
      loadQuestion();
      return;
    }
    if (state.levelIdx === LEVELS.length - 1) { showFinalScroll(); return; }
    Sound.levelUp();
    openModal({
      badge: "Stage Complete",
      title: "You've reached level " + (state.levelIdx + 1) + ".",
      body: '"' + lv.name + '" is secured. Climb on, or stop here and receive your scroll.',
      buttons: [
        { label: "Continue to Level " + (state.levelIdx + 2), gold: true, action: function () { state.levelIdx += 1; closeModal(); goLadder(); } },
        { label: "Stop & Receive Scroll", gold: false, action: function () { closeModal(); showScrollFor(state.levelIdx); } },
      ],
    });
  }

  function onWrong() {
    var reachedFirstQ = state.levelIdx === 0 && state.qIdx === 0;
    openModal({
      badge: "Climb Ended",
      title: "That wasn't quite it.",
      body: reachedFirstQ
        ? "Your climb ends at the very first step — but every scroll begins somewhere. Here is a word for you."
        : "Your climb holds at Level " + (state.levelIdx + 1) + " in progress — your scroll is secured for Level " + (state.levelIdx === 0 ? 1 : state.levelIdx) + ".",
      buttons: [
        { label: "Receive Your Scroll", gold: true, action: function () { closeModal(); showScrollFor(state.levelIdx === 0 ? 0 : state.levelIdx - 1); } },
      ],
    });
  }

  function showScrollFor(idx) { Sound.scroll(); fillScroll(SCROLLS[idx]); show("scroll"); }
  function showFinalScroll() { Sound.scroll(); fillScroll(SCROLLS[SCROLLS.length - 1]); show("scroll"); }
  function fillScroll(s) {
    el("scrollRank").textContent = s.rank;
    el("scrollName").textContent = s.name;
    el("scrollVerse").textContent = s.verse;
    el("scrollRef").textContent = s.ref;
    el("scrollPoem").textContent = s.poem;
    el("scrollWord").textContent = s.word;
    renderCertificate(s);
  }

  // -----------------------------------------------------------------
  // Shareable certificate — drawn on a <canvas>, downloadable and, where
  // supported, shareable straight to social apps. Doubles as a plug for
  // the app: the image itself carries "wfnglobal.org/app".
  // -----------------------------------------------------------------
  function wrapLines(ctx, text, maxWidth) {
    var words = text.split(" "), line = "", lines = [];
    for (var i = 0; i < words.length; i++) {
      var test = (line + words[i] + " ");
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line.trim()); line = words[i] + " "; }
      else { line = test; }
    }
    if (line) lines.push(line.trim());
    return lines;
  }

  function drawCertificate(s) {
    var canvas = el("certCanvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var W = canvas.width, H = canvas.height, cx = W / 2;

    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#2A2113"); bg.addColorStop(0.5, "#17130D"); bg.addColorStop(1, "#0B0805");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(217,181,107,0.55)"; ctx.lineWidth = 3; ctx.strokeRect(34, 34, W - 68, H - 68);
    ctx.strokeStyle = "rgba(217,181,107,0.25)"; ctx.lineWidth = 1; ctx.strokeRect(56, 56, W - 112, H - 112);

    // climb icon (ring + ladder + flame), same mark used across the app
    var iy = 215;
    ctx.beginPath(); ctx.arc(cx, iy, 86, 0, Math.PI * 2); ctx.strokeStyle = "#9C7A34"; ctx.lineWidth = 3; ctx.stroke();
    function pt(x, y) { var k = 2.05; return [cx + (x - 24) * k, iy + (y - 24) * k]; }
    ctx.strokeStyle = "#D9B56B"; ctx.lineWidth = 7; ctx.lineCap = "round";
    [[14, 35, 24, 12], [34, 35, 24, 12], [16.3, 29.5, 31.7, 29.5], [18.6, 24, 29.4, 24], [20.9, 18.5, 27.1, 18.5]].forEach(function (r) {
      var a = pt(r[0], r[1]), b = pt(r[2], r[3]);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    });
    var f = pt(24, 12);
    ctx.fillStyle = "#F6E8BE"; ctx.beginPath(); ctx.ellipse(f[0], f[1] - 24, 14, 22, 0, 0, Math.PI * 2); ctx.fill();

    ctx.textAlign = "center";
    ctx.fillStyle = "#D9B56B"; ctx.font = "700 27px Inter, sans-serif";
    ctx.fillText("WORD & FAITH NETWORK", cx, 362);

    ctx.fillStyle = "#F2EEE6"; ctx.font = "600 58px Fraunces, Georgia, serif";
    ctx.fillText("Certificate of the Climb", cx, 436);

    ctx.fillStyle = "#B8B2A6"; ctx.font = "400 28px Inter, sans-serif";
    ctx.fillText("This certifies a believer has completed", cx, 492);
    ctx.fillText("The Word Climb through:", cx, 528);

    ctx.fillStyle = "#D9B56B"; ctx.font = "600 46px Fraunces, Georgia, serif";
    ctx.fillText(String(s.rank).replace("·", "—"), cx, 600);

    ctx.fillStyle = "#F2EEE6"; ctx.font = "italic 500 33px Fraunces, Georgia, serif";
    var verseLines = wrapLines(ctx, s.verse, 800);
    var vy = 690;
    verseLines.forEach(function (l, i) { ctx.fillText(l, cx, vy + i * 44); });

    ctx.fillStyle = "#A9824F"; ctx.font = "700 24px Inter, sans-serif";
    ctx.fillText(s.ref, cx, vy + verseLines.length * 44 + 30);

    var dividerY = vy + verseLines.length * 44 + 80;
    ctx.strokeStyle = "rgba(242,238,230,0.15)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 210, dividerY); ctx.lineTo(cx + 210, dividerY); ctx.stroke();

    ctx.fillStyle = "#F2EEE6"; ctx.font = "600 29px Inter, sans-serif";
    ctx.fillText("Play The Word Climb", cx, dividerY + 56);
    ctx.fillStyle = "#B8B2A6"; ctx.font = "400 25px Inter, sans-serif";
    ctx.fillText("wfnglobal.org/app", cx, dividerY + 92);

    ctx.fillStyle = "#6E6A5C"; ctx.font = "400 21px Inter, sans-serif";
    ctx.fillText(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), cx, H - 70);

    try {
      var dataUrl = canvas.toDataURL("image/png");
      var dlBtn = el("downloadCertBtn");
      if (dlBtn) dlBtn.href = dataUrl;
    } catch (e) {}

    var shareBtn = el("shareCertBtn");
    if (shareBtn) shareBtn.hidden = !(navigator.share && navigator.canShare && window.File);
  }

  function renderCertificate(s) {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { drawCertificate(s); }).catch(function () { drawCertificate(s); });
    } else {
      drawCertificate(s);
    }
  }

  function shareCertificate() {
    var canvas = el("certCanvas");
    if (!canvas) return;
    canvas.toBlob(function (blob) {
      if (!blob) return;
      try {
        var file = new File([blob], "the-word-climb-certificate.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: "The Word Climb",
            text: "I just climbed The Word Climb on the Word and Faith Network app — come play: wfnglobal.org/app",
          }).catch(function () {});
        }
      } catch (e) {}
    }, "image/png");
  }

  function openModal(opts) {
    el("modalBadge").textContent = opts.badge;
    el("modalTitle").textContent = opts.title;
    el("modalBody").textContent = opts.body;
    var row = el("modalButtons");
    row.innerHTML = "";
    opts.buttons.forEach(function (b) {
      var btn = document.createElement("button");
      btn.className = "wc-btn " + (b.gold ? "wc-btn-gold" : "wc-btn-ghost");
      btn.textContent = b.label;
      btn.addEventListener("click", b.action);
      row.appendChild(btn);
    });
    el("modalWrap").classList.add("wc-show");
  }
  function closeModal() { el("modalWrap").classList.remove("wc-show"); }

  function useFifty() {
    if (state.usedFifty || state.locked) return;
    Sound.blip();
    state.usedFifty = true;
    el("lifeFifty").disabled = true;
    var q = state.drawn[state.levelIdx][state.qIdx];
    var wrongIdxs = q.opts.map(function (_, i) { return i; }).filter(function (i) { return i !== q.a; });
    wrongIdxs = shuffle(wrongIdxs).slice(0, 2);
    wrongIdxs.forEach(function (i) {
      var b = root.querySelector('.wc-opt[data-opt="' + i + '"]');
      if (b) b.classList.add("wc-faded");
    });
  }
  function useElder() {
    if (state.usedElder || state.locked) return;
    Sound.blip();
    state.usedElder = true;
    el("lifeElder").disabled = true;
    var q = state.drawn[state.levelIdx][state.qIdx];
    var b = root.querySelector('.wc-opt[data-opt="' + q.a + '"]');
    if (b) b.style.boxShadow = "0 0 0 2px var(--wc-sage) inset";
  }

  function resetGame() {
    state = newState();
    show("start");
  }

  function bindOnce() {
    root.addEventListener("click", function (e) {
      var toggle = e.target.closest(".wc-sound-toggle");
      if (toggle) { Sound.toggle(root); return; }
      var actionEl = e.target.closest("[data-action]");
      if (!actionEl) return;
      var action = actionEl.getAttribute("data-action");
      if (action === "begin") goLadder();
      else if (action === "startLevel") startLevel();
      else if (action === "fifty") useFifty();
      else if (action === "elder") useElder();
      else if (action === "reset") resetGame();
      else if (action === "shareCert") shareCertificate();
    });
  }

  // -----------------------------------------------------------------
  // Verse strip: each verse enters from the right and, a few seconds
  // later, exits back out the same side — never crossing left — with a
  // soft twinkle riding along for a touch of showmanship.
  // -----------------------------------------------------------------
  var tickerTimer = null, tickerIdx = -1;
  function stepTicker() {
    var inner = el("verseStripInner"), textEl = el("verseStripText"), refEl = el("verseStripRef");
    if (!inner || !textEl) return;
    inner.classList.add("wc-exit"); // glide out through the right
    setTimeout(function () {
      tickerIdx = (tickerIdx + 1) % TICKER_VERSES.length;
      var v = TICKER_VERSES[tickerIdx];
      textEl.textContent = v.text;
      if (refEl) { refEl.textContent = v.ref; refEl.style.color = v.color; }
      inner.classList.remove("wc-exit");
      inner.classList.add("wc-enter-start"); // snap to the right, no transition
      void inner.offsetWidth; // force reflow so the next class change animates
      inner.classList.remove("wc-enter-start"); // glide back in from the right
    }, 430);
  }
  function startTicker() {
    stopTicker();
    tickerIdx = -1;
    stepTicker();
    tickerTimer = setInterval(stepTicker, 5500);
  }
  function stopTicker() {
    if (tickerTimer) clearInterval(tickerTimer);
    tickerTimer = null;
  }

  // -----------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------
  function mount(container) {
    if (!container) return;
    root = container;
    root.innerHTML = TEMPLATE;
    state = newState();
    Sound.paint(root);
    bindOnce();
    show("start");
    startTicker();
  }
  function unmount() {
    if (state && state.timer) clearInterval(state.timer);
    stopTicker();
    if (root) root.innerHTML = "";
    root = null; state = null;
  }

  window.WFNGame = { mount: mount, unmount: unmount, ICON: CLIMB_ICON };
})();
