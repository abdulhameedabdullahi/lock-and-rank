// One-time script: appends 32 topic-seeded rounds to rounds.json.
// Run: node tools/add-seed-rounds.js
'use strict';
const fs = require('fs');
const path = require('path');

const ROUNDS_PATH = path.join(__dirname, '../src/server/data/rounds.json');
const existing = JSON.parse(fs.readFileSync(ROUNDS_PATH, 'utf8'));

const NEW_ROUNDS = [
  // ── TECH ────────────────────────────────────────────────────────────────────
  {
    "topicId": "tech",
    "category": "Social media launch years",
    "rule": "Oldest to newest launch year",
    "unit": "year",
    "difficulty": "easy",
    "verified": false,
    "items": [
      { "id": "t-facebook", "name": "Facebook", "emoji": "📘", "value": 2004, "source": "thefacebook.com launched February 4, 2004 by Mark Zuckerberg." },
      { "id": "t-twitter", "name": "Twitter", "emoji": "🐦", "value": 2006, "source": "First tweet sent March 21, 2006. Public launch July 2006." },
      { "id": "t-instagram", "name": "Instagram", "emoji": "📸", "value": 2010, "source": "Launched October 6, 2010 on iOS by Kevin Systrom and Mike Krieger." },
      { "id": "t-snapchat", "name": "Snapchat", "emoji": "👻", "value": 2011, "source": "Launched as Picaboo in July 2011, renamed Snapchat in September 2011." },
      { "id": "t-tiktok", "name": "TikTok", "emoji": "🎵", "value": 2016, "source": "ByteDance launched Douyin (Chinese version) September 2016. International TikTok: 2017." }
    ]
  },
  {
    "topicId": "tech",
    "category": "Big tech IPO years",
    "rule": "Oldest to newest stock market debut",
    "unit": "year",
    "difficulty": "medium",
    "verified": false,
    "items": [
      { "id": "ipo-apple", "name": "Apple", "emoji": "🍎", "value": 1980, "source": "Apple IPO on NASDAQ: December 12, 1980." },
      { "id": "ipo-amazon", "name": "Amazon", "emoji": "📦", "value": 1997, "source": "Amazon IPO on NASDAQ: May 15, 1997." },
      { "id": "ipo-google", "name": "Google", "emoji": "🔍", "value": 2004, "source": "Google IPO on NASDAQ: August 19, 2004." },
      { "id": "ipo-alibaba", "name": "Alibaba", "emoji": "🛒", "value": 2014, "source": "Alibaba IPO on NYSE: September 19, 2014. Largest IPO at the time." },
      { "id": "ipo-snap", "name": "Snap", "emoji": "🤳", "value": 2017, "source": "Snap Inc. IPO on NYSE: March 2, 2017." }
    ]
  },
  {
    "topicId": "tech",
    "category": "Programming language release years",
    "rule": "Oldest to newest first release",
    "unit": "year",
    "difficulty": "medium",
    "verified": false,
    "items": [
      { "id": "lang-fortran", "name": "FORTRAN", "emoji": "💾", "value": 1957, "source": "IBM FORTRAN I delivered to users in April 1957. First high-level language." },
      { "id": "lang-c", "name": "C", "emoji": "⌨️", "value": 1972, "source": "Dennis Ritchie developed C at Bell Labs in 1972." },
      { "id": "lang-python", "name": "Python", "emoji": "🐍", "value": 1991, "source": "Python 0.9.0 released by Guido van Rossum on February 20, 1991." },
      { "id": "lang-java", "name": "Java", "emoji": "☕", "value": 1995, "source": "Java first announced by Sun Microsystems on May 23, 1995. JDK 1.0 released January 1996." },
      { "id": "lang-rust", "name": "Rust", "emoji": "⚙️", "value": 2015, "source": "Rust 1.0 (stable) released by Mozilla on May 15, 2015." }
    ]
  },
  {
    "topicId": "tech",
    "category": "Web browser launch years",
    "rule": "Oldest to newest first stable release",
    "unit": "year",
    "difficulty": "hard",
    "verified": false,
    "items": [
      { "id": "browser-netscape", "name": "Netscape Navigator", "emoji": "🌐", "value": 1994, "source": "Netscape Navigator 1.0 released October 1994 by Netscape Communications." },
      { "id": "browser-ie", "name": "Internet Explorer", "emoji": "🔵", "value": 1995, "source": "Internet Explorer 1.0 released August 1995, bundled with Windows 95 Plus!." },
      { "id": "browser-safari", "name": "Safari", "emoji": "🧭", "value": 2003, "source": "Apple released Safari 1.0 on June 23, 2003." },
      { "id": "browser-firefox", "name": "Firefox", "emoji": "🦊", "value": 2004, "source": "Mozilla Firefox 1.0 released November 9, 2004." },
      { "id": "browser-chrome", "name": "Google Chrome", "emoji": "🌈", "value": 2008, "source": "Google Chrome 1.0 released December 11, 2008." }
    ]
  },

  // ── ANIME ────────────────────────────────────────────────────────────────────
  {
    "topicId": "anime",
    "category": "Anime TV premiere years",
    "rule": "Oldest to newest premiere year",
    "unit": "year",
    "difficulty": "easy",
    "verified": false,
    "items": [
      { "id": "an-astroboy", "name": "Astro Boy", "emoji": "🤖", "value": 1963, "source": "Tetsuwan Atom premiered January 1, 1963 on Fuji TV, Japan." },
      { "id": "an-dragonball", "name": "Dragon Ball", "emoji": "⭐", "value": 1986, "source": "Dragon Ball premiered February 26, 1986 on Fuji TV, Japan." },
      { "id": "an-sailormoon", "name": "Sailor Moon", "emoji": "🌙", "value": 1992, "source": "Bishoujo Senshi Sailor Moon premiered March 7, 1992 on TV Asahi, Japan." },
      { "id": "an-naruto", "name": "Naruto", "emoji": "🍥", "value": 2002, "source": "Naruto premiered October 3, 2002 on TV Tokyo, Japan." },
      { "id": "an-aot", "name": "Attack on Titan", "emoji": "⚔️", "value": 2013, "source": "Shingeki no Kyojin premiered April 7, 2013 on MBS, Japan." }
    ]
  },
  {
    "topicId": "anime",
    "category": "Anime original episode counts",
    "rule": "Fewest to most episodes in original TV run",
    "unit": "episodes",
    "difficulty": "medium",
    "verified": false,
    "items": [
      { "id": "ep-bebop", "name": "Cowboy Bebop", "emoji": "🚀", "value": 26, "source": "Cowboy Bebop original run: 26 episodes (1998–1999, Space Shower TV/WOWOW)." },
      { "id": "ep-deathnote", "name": "Death Note", "emoji": "📓", "value": 37, "source": "Death Note: 37 episodes (2006–2007, NTV)." },
      { "id": "ep-fmab", "name": "FMA: Brotherhood", "emoji": "⚗️", "value": 64, "source": "Fullmetal Alchemist: Brotherhood: 64 episodes (2009–2010, MBS/TBS)." },
      { "id": "ep-naruto", "name": "Naruto", "emoji": "🍥", "value": 220, "source": "Naruto original series: 220 episodes (2002–2007, TV Tokyo). Excludes Shippuden." },
      { "id": "ep-dbz", "name": "Dragon Ball Z", "emoji": "💥", "value": 291, "source": "Dragon Ball Z: 291 episodes (1989–1996, Fuji TV)." }
    ]
  },
  {
    "topicId": "anime",
    "category": "Completed manga volumes",
    "rule": "Fewest to most volumes in completed series",
    "unit": "volumes",
    "difficulty": "hard",
    "verified": false,
    "items": [
      { "id": "mg-deathnote", "name": "Death Note", "emoji": "📓", "value": 12, "source": "Death Note: 12 tankōbon volumes (Shueisha, 2003–2006)." },
      { "id": "mg-fma", "name": "Fullmetal Alchemist", "emoji": "⚗️", "value": 27, "source": "Fullmetal Alchemist: 27 tankōbon volumes (Square Enix, 2001–2010)." },
      { "id": "mg-dragonball", "name": "Dragon Ball", "emoji": "⭐", "value": 42, "source": "Dragon Ball manga: 42 volumes (Shueisha, 1984–1995). Covers both original and Z arcs." },
      { "id": "mg-naruto", "name": "Naruto", "emoji": "🍥", "value": 72, "source": "Naruto: 72 tankōbon volumes (Shueisha, 1999–2015)." },
      { "id": "mg-bleach", "name": "Bleach", "emoji": "🌙", "value": 74, "source": "Bleach: 74 tankōbon volumes (Shueisha, 2001–2016)." }
    ]
  },
  {
    "topicId": "anime",
    "category": "Anime film release years",
    "rule": "Oldest to newest theatrical release year",
    "unit": "year",
    "difficulty": "easy",
    "verified": false,
    "items": [
      { "id": "af-akira", "name": "Akira", "emoji": "🏍️", "value": 1988, "source": "Akira theatrical release: July 16, 1988 (Japan, Toho)." },
      { "id": "af-gits", "name": "Ghost in the Shell", "emoji": "🤖", "value": 1995, "source": "Ghost in the Shell theatrical release: November 18, 1995 (Japan, Toho)." },
      { "id": "af-spirited", "name": "Spirited Away", "emoji": "🏮", "value": 2001, "source": "Sen to Chihiro theatrical release: July 20, 2001 (Japan, Studio Ghibli / Toho)." },
      { "id": "af-yourname", "name": "Your Name", "emoji": "☄️", "value": 2016, "source": "Kimi no Na wa theatrical release: August 26, 2016 (Japan, CoMix Wave Films)." },
      { "id": "af-mugen", "name": "Demon Slayer: Mugen Train", "emoji": "🚂", "value": 2020, "source": "Kimetsu no Yaiba: Mugen Ressha-Hen theatrical release: October 16, 2020 (Japan, Ufotable)." }
    ]
  },

  // ── MOVIES ──────────────────────────────────────────────────────────────────
  {
    "topicId": "movies",
    "category": "Oscar Best Picture winner years",
    "rule": "Oldest to newest US release year",
    "unit": "year",
    "difficulty": "medium",
    "verified": false,
    "items": [
      { "id": "mv-casablanca", "name": "Casablanca", "emoji": "🎬", "value": 1942, "source": "Casablanca (1942) won Best Picture at the 16th Academy Awards (March 1944)." },
      { "id": "mv-godfather", "name": "The Godfather", "emoji": "🌹", "value": 1972, "source": "The Godfather (1972) won Best Picture at the 45th Academy Awards (March 1973)." },
      { "id": "mv-schindlers", "name": "Schindler's List", "emoji": "🕯️", "value": 1993, "source": "Schindler's List (1993) won Best Picture at the 66th Academy Awards (March 1994)." },
      { "id": "mv-rotk", "name": "The Return of the King", "emoji": "💍", "value": 2003, "source": "The Lord of the Rings: The Return of the King (2003) won Best Picture at the 76th Academy Awards (2004)." },
      { "id": "mv-parasite", "name": "Parasite", "emoji": "🏠", "value": 2019, "source": "Parasite (2019) won Best Picture at the 92nd Academy Awards (2020), first non-English film to win." }
    ]
  },
  {
    "topicId": "movies",
    "category": "Film runtimes",
    "rule": "Shortest to longest runtime",
    "unit": "min",
    "difficulty": "medium",
    "verified": false,
    "items": [
      { "id": "rt-toystory", "name": "Toy Story", "emoji": "🤠", "value": 81, "source": "Toy Story (1995): 81 minutes. Source: Pixar/Disney press materials." },
      { "id": "rt-homealone", "name": "Home Alone", "emoji": "😱", "value": 103, "source": "Home Alone (1990): 103 minutes." },
      { "id": "rt-darkknight", "name": "The Dark Knight", "emoji": "🦇", "value": 152, "source": "The Dark Knight (2008): 152 minutes." },
      { "id": "rt-endgame", "name": "Avengers: Endgame", "emoji": "⏱️", "value": 181, "source": "Avengers: Endgame (2019): 181 minutes." },
      { "id": "rt-rotk", "name": "The Return of the King", "emoji": "💍", "value": 201, "source": "The Lord of the Rings: The Return of the King (2003): 201 minutes theatrical cut." }
    ]
  },
  {
    "topicId": "movies",
    "category": "Academy Award wins",
    "rule": "Fewest to most total Oscars won",
    "unit": "Oscars",
    "difficulty": "hard",
    "verified": false,
    "items": [
      { "id": "os-parasite", "name": "Parasite", "emoji": "🏠", "value": 4, "source": "Parasite (2019): 4 wins (Best Picture, Director, Original Screenplay, International Feature Film)." },
      { "id": "os-silencelambs", "name": "The Silence of the Lambs", "emoji": "🐑", "value": 5, "source": "The Silence of the Lambs (1991): 5 wins (Picture, Director, Actor, Actress, Adapted Screenplay). The 'Big Five' sweep." },
      { "id": "os-schindlers", "name": "Schindler's List", "emoji": "🕯️", "value": 7, "source": "Schindler's List (1993): 7 wins at the 66th Academy Awards (1994)." },
      { "id": "os-westsidestory", "name": "West Side Story", "emoji": "🕺", "value": 10, "source": "West Side Story (1961): 10 wins at the 34th Academy Awards (1962)." },
      { "id": "os-titanic", "name": "Titanic", "emoji": "🚢", "value": 11, "source": "Titanic (1997): 11 wins at the 70th Academy Awards (1998). Tied the all-time record." }
    ]
  },
  {
    "topicId": "movies",
    "category": "Disney animated film release years",
    "rule": "Oldest to newest US theatrical release year",
    "unit": "year",
    "difficulty": "easy",
    "verified": false,
    "items": [
      { "id": "dis-snowwhite", "name": "Snow White", "emoji": "🍎", "value": 1937, "source": "Snow White and the Seven Dwarfs premiered December 21, 1937 (US, Walt Disney Productions)." },
      { "id": "dis-cinderella", "name": "Cinderella", "emoji": "👠", "value": 1950, "source": "Cinderella (Disney): wide release March 4, 1950." },
      { "id": "dis-littlemermaid", "name": "The Little Mermaid", "emoji": "🧜", "value": 1989, "source": "The Little Mermaid (Disney): US release November 15, 1989." },
      { "id": "dis-lionking", "name": "The Lion King", "emoji": "🦁", "value": 1994, "source": "The Lion King (Disney): US wide release June 24, 1994." },
      { "id": "dis-frozen", "name": "Frozen", "emoji": "❄️", "value": 2013, "source": "Frozen (Disney): US release November 27, 2013." }
    ]
  },

  // ── GAMES ───────────────────────────────────────────────────────────────────
  {
    "topicId": "games",
    "category": "Classic game release years",
    "rule": "Oldest to newest original release year",
    "unit": "year",
    "difficulty": "easy",
    "verified": false,
    "items": [
      { "id": "gm-pacman", "name": "Pac-Man", "emoji": "🟡", "value": 1980, "source": "Pac-Man arcade release: May 22, 1980 (Japan, Namco)." },
      { "id": "gm-smb", "name": "Super Mario Bros.", "emoji": "🍄", "value": 1985, "source": "Super Mario Bros.: September 13, 1985 (Japan, NES, Nintendo)." },
      { "id": "gm-zelda", "name": "The Legend of Zelda", "emoji": "🗡️", "value": 1986, "source": "The Legend of Zelda: February 21, 1986 (Japan, Famicom Disk System, Nintendo)." },
      { "id": "gm-sf2", "name": "Street Fighter II", "emoji": "👊", "value": 1991, "source": "Street Fighter II: The World Warrior arcade release: March 1991 (Capcom)." },
      { "id": "gm-doom", "name": "Doom", "emoji": "👹", "value": 1993, "source": "Doom: December 10, 1993 (PC, id Software). Shareware release via download." }
    ]
  },
  {
    "topicId": "games",
    "category": "Iconic multiplayer game release years",
    "rule": "Oldest to newest original release year",
    "unit": "year",
    "difficulty": "medium",
    "verified": false,
    "items": [
      { "id": "gm-halflife", "name": "Half-Life", "emoji": "⚡", "value": 1998, "source": "Half-Life: November 19, 1998 (PC, Valve)." },
      { "id": "gm-vice-city", "name": "GTA: Vice City", "emoji": "🌴", "value": 2002, "source": "Grand Theft Auto: Vice City: October 29, 2002 (PS2, Rockstar Games)." },
      { "id": "gm-halo2", "name": "Halo 2", "emoji": "🪖", "value": 2004, "source": "Halo 2: November 9, 2004 (Xbox, Bungie / Microsoft)." },
      { "id": "gm-skyrim", "name": "Skyrim", "emoji": "🐉", "value": 2011, "source": "The Elder Scrolls V: Skyrim: November 11, 2011 (PC/PS3/Xbox 360, Bethesda)." },
      { "id": "gm-witcher3", "name": "The Witcher 3", "emoji": "🗺️", "value": 2015, "source": "The Witcher 3: Wild Hunt: May 19, 2015 (PC/PS4/Xbox One, CD Projekt Red)." }
    ]
  },
  {
    "topicId": "games",
    "category": "Nintendo console launch years",
    "rule": "Oldest to newest US launch year",
    "unit": "year",
    "difficulty": "easy",
    "verified": false,
    "items": [
      { "id": "gc-nes", "name": "NES", "emoji": "🕹️", "value": 1985, "source": "NES (Nintendo Entertainment System): US launch October 18, 1985." },
      { "id": "gc-snes", "name": "Super NES", "emoji": "🎮", "value": 1991, "source": "Super Nintendo Entertainment System: US launch August 23, 1991." },
      { "id": "gc-n64", "name": "Nintendo 64", "emoji": "🎲", "value": 1996, "source": "Nintendo 64: US launch September 29, 1996." },
      { "id": "gc-gamecube", "name": "GameCube", "emoji": "💿", "value": 2001, "source": "Nintendo GameCube: US launch November 18, 2001." },
      { "id": "gc-wii", "name": "Wii", "emoji": "🏓", "value": 2006, "source": "Nintendo Wii: US launch November 19, 2006." }
    ]
  },
  {
    "topicId": "games",
    "category": "Classic RPG release years",
    "rule": "Oldest to newest original release year",
    "unit": "year",
    "difficulty": "hard",
    "verified": false,
    "items": [
      { "id": "rpg-ff7", "name": "Final Fantasy VII", "emoji": "🌌", "value": 1997, "source": "Final Fantasy VII: January 31, 1997 (Japan, PlayStation, Square)." },
      { "id": "rpg-bg2", "name": "Baldur's Gate II", "emoji": "🧙", "value": 2000, "source": "Baldur's Gate II: Shadows of Amn: September 21, 2000 (PC, BioWare / Interplay)." },
      { "id": "rpg-wow", "name": "World of Warcraft", "emoji": "🌍", "value": 2004, "source": "World of Warcraft: November 23, 2004 (PC, Blizzard Entertainment)." },
      { "id": "rpg-darksouls", "name": "Dark Souls", "emoji": "💀", "value": 2011, "source": "Dark Souls: September 22, 2011 (Japan, PS3/Xbox 360, FromSoftware)." },
      { "id": "rpg-eldenring", "name": "Elden Ring", "emoji": "🌑", "value": 2022, "source": "Elden Ring: February 25, 2022 (PS4/5, Xbox, PC, FromSoftware / Bandai Namco)." }
    ]
  },

  // ── SOCCER ──────────────────────────────────────────────────────────────────
  {
    "topicId": "soccer",
    "category": "FIFA World Cup wins",
    "rule": "Fewest to most World Cup wins",
    "unit": "World Cups",
    "difficulty": "easy",
    "verified": false,
    "items": [
      { "id": "wc-england", "name": "England", "emoji": "🦁", "value": 1, "source": "England: 1 World Cup win (1966, as host nation)." },
      { "id": "wc-france", "name": "France", "emoji": "⚜️", "value": 2, "source": "France: 2 World Cup wins (1998, 2018)." },
      { "id": "wc-argentina", "name": "Argentina", "emoji": "🌟", "value": 3, "source": "Argentina: 3 World Cup wins (1978, 1986, 2022)." },
      { "id": "wc-germany", "name": "Germany", "emoji": "🦅", "value": 4, "source": "Germany (inc. West Germany): 4 World Cup wins (1954, 1974, 1990, 2014)." },
      { "id": "wc-brazil", "name": "Brazil", "emoji": "💚", "value": 5, "source": "Brazil: 5 World Cup wins (1958, 1962, 1970, 1994, 2002). Most all time." }
    ]
  },
  {
    "topicId": "soccer",
    "category": "Career Ballon d'Or wins",
    "rule": "Fewest to most career Ballon d'Or awards",
    "unit": "Ballon d'Ors",
    "difficulty": "medium",
    "verified": false,
    "items": [
      { "id": "bd-zidane", "name": "Zinedine Zidane", "emoji": "👑", "value": 1, "source": "Zidane: 1 Ballon d'Or (1998)." },
      { "id": "bd-r9", "name": "Ronaldo Nazário", "emoji": "⚡", "value": 2, "source": "Ronaldo Nazário (R9): 2 Ballon d'Ors (1997, 2002)." },
      { "id": "bd-cruyff", "name": "Johan Cruyff", "emoji": "🌷", "value": 3, "source": "Johan Cruyff: 3 Ballon d'Ors (1971, 1973, 1974)." },
      { "id": "bd-cr7", "name": "Cristiano Ronaldo", "emoji": "💪", "value": 5, "source": "Cristiano Ronaldo: 5 Ballon d'Ors (2008, 2011, 2013, 2014, 2017)." },
      { "id": "bd-messi", "name": "Lionel Messi", "emoji": "🐐", "value": 8, "source": "Lionel Messi: 8 Ballon d'Ors (2009, 2010, 2011, 2012, 2015, 2019, 2021, 2023)." }
    ]
  },
  {
    "topicId": "soccer",
    "category": "Football club founding years",
    "rule": "Oldest to newest founding year",
    "unit": "year",
    "difficulty": "medium",
    "verified": false,
    "items": [
      { "id": "cl-manutd", "name": "Manchester United", "emoji": "🔴", "value": 1878, "source": "Founded as Newton Heath LYR FC in 1878. Renamed Manchester United in 1902." },
      { "id": "cl-arsenal", "name": "Arsenal", "emoji": "💣", "value": 1886, "source": "Founded as Dial Square FC in 1886 by workers at the Royal Arsenal, Woolwich." },
      { "id": "cl-barcelona", "name": "FC Barcelona", "emoji": "🔵", "value": 1899, "source": "FC Barcelona founded October 29, 1899 by Joan Gamper." },
      { "id": "cl-bayernmunich", "name": "Bayern Munich", "emoji": "⚽", "value": 1900, "source": "FC Bayern München founded February 27, 1900." },
      { "id": "cl-realmadrid", "name": "Real Madrid", "emoji": "👑", "value": 1902, "source": "Real Madrid Club de Fútbol founded March 6, 1902." }
    ]
  },
  {
    "topicId": "soccer",
    "category": "Career World Cup goals",
    "rule": "Fewest to most World Cup goals scored",
    "unit": "goals",
    "difficulty": "hard",
    "verified": false,
    "items": [
      { "id": "wcg-klinsmann", "name": "Jürgen Klinsmann", "emoji": "🇩🇪", "value": 11, "source": "Jürgen Klinsmann: 11 World Cup goals across 1990, 1994, 1998." },
      { "id": "wcg-fontaine", "name": "Just Fontaine", "emoji": "🇫🇷", "value": 13, "source": "Just Fontaine: 13 goals in just one World Cup (1958). Still the single-tournament record." },
      { "id": "wcg-muller", "name": "Gerd Müller", "emoji": "🎯", "value": 14, "source": "Gerd Müller: 14 World Cup goals across 1970 and 1974." },
      { "id": "wcg-r9", "name": "Ronaldo Nazário", "emoji": "🏆", "value": 15, "source": "Ronaldo Nazário (R9): 15 World Cup goals across 1994, 1998, 2002, 2006." },
      { "id": "wcg-klose", "name": "Miroslav Klose", "emoji": "🥇", "value": 16, "source": "Miroslav Klose: 16 World Cup goals across 2002, 2006, 2010, 2014. All-time record." }
    ]
  },

  // ── MUSIC ───────────────────────────────────────────────────────────────────
  {
    "topicId": "music",
    "category": "Pop and R&B album release years",
    "rule": "Oldest to newest release year",
    "unit": "year",
    "difficulty": "easy",
    "verified": false,
    "items": [
      { "id": "mu-thriller", "name": "Thriller", "emoji": "🕺", "value": 1982, "source": "Thriller (Michael Jackson): released November 30, 1982 (Epic Records)." },
      { "id": "mu-purplerain", "name": "Purple Rain", "emoji": "🎸", "value": 1984, "source": "Purple Rain (Prince): released June 25, 1984 (Warner Bros.)." },
      { "id": "mu-miseducation", "name": "The Miseducation of Lauryn Hill", "emoji": "🎤", "value": 1998, "source": "The Miseducation of Lauryn Hill: released August 25, 1998 (Ruffhouse / Columbia)." },
      { "id": "mu-21adele", "name": "21", "emoji": "🎼", "value": 2011, "source": "21 (Adele): released January 24, 2011 (XL Recordings / Columbia)." },
      { "id": "mu-lemonade", "name": "Lemonade", "emoji": "🍋", "value": 2016, "source": "Lemonade (Beyoncé): released April 23, 2016 (Parkwood / Columbia)." }
    ]
  },
  {
    "topicId": "music",
    "category": "Rock album release years",
    "rule": "Oldest to newest release year",
    "unit": "year",
    "difficulty": "medium",
    "verified": false,
    "items": [
      { "id": "ro-sgtpepper", "name": "Sgt. Pepper's", "emoji": "🎺", "value": 1967, "source": "Sgt. Pepper's Lonely Hearts Club Band (The Beatles): released June 1, 1967 (Parlophone)." },
      { "id": "ro-ledzep4", "name": "Led Zeppelin IV", "emoji": "🔔", "value": 1971, "source": "Led Zeppelin IV: released November 8, 1971 (Atlantic Records)." },
      { "id": "ro-rumours", "name": "Rumours", "emoji": "💨", "value": 1977, "source": "Rumours (Fleetwood Mac): released February 4, 1977 (Warner Bros.)." },
      { "id": "ro-backinblack", "name": "Back in Black", "emoji": "🖤", "value": 1980, "source": "Back in Black (AC/DC): released July 25, 1980 (Albert Productions / Atlantic)." },
      { "id": "ro-nevermind", "name": "Nevermind", "emoji": "👶", "value": 1991, "source": "Nevermind (Nirvana): released September 24, 1991 (DGC Records)." }
    ]
  },
  {
    "topicId": "music",
    "category": "Hip-hop album release years",
    "rule": "Oldest to newest release year",
    "unit": "year",
    "difficulty": "medium",
    "verified": false,
    "items": [
      { "id": "hh-soc", "name": "Straight Outta Compton", "emoji": "🎙️", "value": 1988, "source": "Straight Outta Compton (N.W.A): released August 8, 1988 (Ruthless Records)." },
      { "id": "hh-illmatic", "name": "Illmatic", "emoji": "🗽", "value": 1994, "source": "Illmatic (Nas): released April 19, 1994 (Columbia Records)." },
      { "id": "hh-blueprint", "name": "The Blueprint", "emoji": "📐", "value": 2001, "source": "The Blueprint (Jay-Z): released September 11, 2001 (Roc-A-Fella / Def Jam)." },
      { "id": "hh-gkmc", "name": "good kid, m.A.A.d city", "emoji": "🏙️", "value": 2012, "source": "good kid, m.A.A.d city (Kendrick Lamar): released October 22, 2012 (Aftermath / Interscope)." },
      { "id": "hh-clb", "name": "Certified Lover Boy", "emoji": "🌹", "value": 2021, "source": "Certified Lover Boy (Drake): released September 3, 2021 (OVO Sound / Republic)." }
    ]
  },
  {
    "topicId": "music",
    "category": "Rock act formation years",
    "rule": "Oldest to newest formation year",
    "unit": "year",
    "difficulty": "hard",
    "verified": false,
    "items": [
      { "id": "rf-beatles", "name": "The Beatles", "emoji": "🎸", "value": 1960, "source": "The Beatles formed in Liverpool in August 1960 (evolved from The Quarrymen, 1956)." },
      { "id": "rf-ledzep", "name": "Led Zeppelin", "emoji": "🔔", "value": 1968, "source": "Led Zeppelin formed in London in July 1968 by Jimmy Page." },
      { "id": "rf-queen", "name": "Queen", "emoji": "👑", "value": 1970, "source": "Queen formed in London in 1970 when Freddie Mercury joined Brian May and Roger Taylor." },
      { "id": "rf-metallica", "name": "Metallica", "emoji": "🤘", "value": 1981, "source": "Metallica formed in Los Angeles in October 1981 by Lars Ulrich and James Hetfield." },
      { "id": "rf-nirvana", "name": "Nirvana", "emoji": "🌊", "value": 1987, "source": "Nirvana formed in Aberdeen, Washington in 1987 by Kurt Cobain and Krist Novoselic." }
    ]
  },

  // ── SCIENCE ─────────────────────────────────────────────────────────────────
  {
    "topicId": "science",
    "category": "Scientific milestone years",
    "rule": "Oldest to newest milestone year",
    "unit": "year",
    "difficulty": "medium",
    "verified": false,
    "items": [
      { "id": "sc-principia", "name": "Newton's Principia", "emoji": "🍎", "value": 1687, "source": "Isaac Newton published Philosophiæ Naturalis Principia Mathematica in July 1687." },
      { "id": "sc-periodic", "name": "Periodic Table", "emoji": "🧪", "value": 1869, "source": "Dmitri Mendeleev published his periodic table in March 1869." },
      { "id": "sc-relativity", "name": "Special Relativity", "emoji": "💡", "value": 1905, "source": "Albert Einstein published 'On the Electrodynamics of Moving Bodies' (special relativity) in June 1905." },
      { "id": "sc-dna", "name": "DNA Double Helix", "emoji": "🧬", "value": 1953, "source": "Watson & Crick published the DNA double-helix structure in Nature on April 25, 1953." },
      { "id": "sc-higgs", "name": "Higgs Boson", "emoji": "⚛️", "value": 2012, "source": "CERN confirmed the Higgs boson discovery on July 4, 2012." }
    ]
  },
  {
    "topicId": "science",
    "category": "Human spaceflight milestone years",
    "rule": "Oldest to newest milestone year",
    "unit": "year",
    "difficulty": "easy",
    "verified": false,
    "items": [
      { "id": "sf-gagarin", "name": "Gagarin (first human in space)", "emoji": "🚀", "value": 1961, "source": "Yuri Gagarin became the first human in space on April 12, 1961 (Vostok 1, USSR)." },
      { "id": "sf-tereshkova", "name": "Tereshkova (first woman in space)", "emoji": "👩‍🚀", "value": 1963, "source": "Valentina Tereshkova became the first woman in space on June 16, 1963 (Vostok 6, USSR)." },
      { "id": "sf-leonov", "name": "Leonov (first spacewalk)", "emoji": "🌌", "value": 1965, "source": "Alexei Leonov performed the first spacewalk on March 18, 1965 (Voskhod 2, USSR)." },
      { "id": "sf-columbia", "name": "Columbia STS-1 (first Space Shuttle)", "emoji": "🛸", "value": 1981, "source": "Space Shuttle Columbia (STS-1) launched April 12, 1981. First Space Shuttle flight." },
      { "id": "sf-tito", "name": "Tito (first space tourist)", "emoji": "🎟️", "value": 2001, "source": "Dennis Tito became the first paying space tourist on April 28, 2001 (ISS via Soyuz TM-32)." }
    ]
  },
  {
    "topicId": "science",
    "category": "Chemical element discovery years",
    "rule": "Oldest to newest discovery year",
    "unit": "year",
    "difficulty": "hard",
    "verified": false,
    "items": [
      { "id": "el-hydrogen", "name": "Hydrogen", "emoji": "🫧", "value": 1766, "source": "Henry Cavendish described hydrogen as a distinct substance in 1766." },
      { "id": "el-oxygen", "name": "Oxygen", "emoji": "💨", "value": 1774, "source": "Joseph Priestley isolated oxygen in August 1774. Carl Wilhelm Scheele discovered it independently." },
      { "id": "el-aluminium", "name": "Aluminium", "emoji": "🥤", "value": 1825, "source": "Hans Christian Ørsted isolated aluminium for the first time in 1825." },
      { "id": "el-neon", "name": "Neon", "emoji": "🌟", "value": 1898, "source": "Neon discovered by William Ramsay and Morris Travers in June 1898." },
      { "id": "el-plutonium", "name": "Plutonium", "emoji": "☢️", "value": 1940, "source": "Plutonium first synthesised by Glenn T. Seaborg et al. on December 14, 1940 (Berkeley)." }
    ]
  },
  {
    "topicId": "science",
    "category": "Space probe milestone years",
    "rule": "Oldest to newest mission milestone year",
    "unit": "year",
    "difficulty": "medium",
    "verified": false,
    "items": [
      { "id": "sp-voyager1", "name": "Voyager 1 launched", "emoji": "🛸", "value": 1977, "source": "Voyager 1 launched by NASA on September 5, 1977. Now in interstellar space." },
      { "id": "sp-cassini", "name": "Cassini launched", "emoji": "🪐", "value": 1997, "source": "Cassini–Huygens spacecraft launched October 15, 1997 (NASA/ESA). Reached Saturn 2004." },
      { "id": "sp-opportunity", "name": "Opportunity rover landed", "emoji": "🤖", "value": 2004, "source": "Mars Exploration Rover Opportunity landed on Mars on January 25, 2004 (NASA)." },
      { "id": "sp-curiosity", "name": "Curiosity rover landed", "emoji": "🔬", "value": 2012, "source": "Mars Science Laboratory Curiosity rover landed on Mars on August 6, 2012 (NASA)." },
      { "id": "sp-jwst", "name": "James Webb Space Telescope launched", "emoji": "🔭", "value": 2021, "source": "James Webb Space Telescope launched December 25, 2021 (NASA/ESA/CSA)." }
    ]
  },

  // ── GEOGRAPHY ───────────────────────────────────────────────────────────────
  {
    "topicId": "geography",
    "category": "Waterfall heights",
    "rule": "Shortest to tallest waterfall drop",
    "unit": "m",
    "difficulty": "medium",
    "verified": false,
    "items": [
      { "id": "wf-niagara", "name": "Niagara (Horseshoe)", "emoji": "💧", "value": 57, "source": "Horseshoe Falls (Niagara): ~57 m drop. Tallest of the three Niagara waterfalls." },
      { "id": "wf-iguazu", "name": "Iguazú Falls", "emoji": "🌿", "value": 82, "source": "Iguazú Falls (Argentina/Brazil): main drop ~82 m. Total system spans ~2.7 km wide." },
      { "id": "wf-victoria", "name": "Victoria Falls", "emoji": "🌊", "value": 108, "source": "Victoria Falls (Zimbabwe/Zambia): 108 m high, widest curtain of falling water on Earth." },
      { "id": "wf-tugela", "name": "Tugela Falls", "emoji": "🏔️", "value": 948, "source": "Tugela Falls (South Africa, Drakensberg): 948 m total height across five drops. Second tallest in the world." },
      { "id": "wf-angel", "name": "Angel Falls", "emoji": "☁️", "value": 979, "source": "Angel Falls (Venezuela, Canaima NP): 979 m total height, 807 m longest single drop. World's highest waterfall." }
    ]
  },
  {
    "topicId": "geography",
    "category": "Desert areas",
    "rule": "Smallest to largest desert area",
    "unit": "km²",
    "difficulty": "medium",
    "verified": false,
    "items": [
      { "id": "ds-patagonian", "name": "Patagonian Desert", "emoji": "🌵", "value": 673000, "source": "Patagonian Desert (Argentina/Chile): ~673,000 km². Largest desert in South America." },
      { "id": "ds-gobi", "name": "Gobi Desert", "emoji": "🏜️", "value": 1295000, "source": "Gobi Desert (China/Mongolia): ~1,295,000 km²." },
      { "id": "ds-arabian", "name": "Arabian Desert", "emoji": "☀️", "value": 2330000, "source": "Arabian Desert (Arabian Peninsula): ~2,330,000 km². Largest hot desert outside Africa." },
      { "id": "ds-sahara", "name": "Sahara", "emoji": "🌞", "value": 9200000, "source": "Sahara Desert (North Africa): ~9,200,000 km². World's largest hot desert." },
      { "id": "ds-antarctic", "name": "Antarctic Desert", "emoji": "🧊", "value": 14200000, "source": "Antarctic Desert: ~14,200,000 km². World's largest desert (cold desert)." }
    ]
  },
  {
    "topicId": "geography",
    "category": "Island areas",
    "rule": "Smallest to largest island area",
    "unit": "km²",
    "difficulty": "medium",
    "verified": false,
    "items": [
      { "id": "is-corsica", "name": "Corsica", "emoji": "🏝️", "value": 8680, "source": "Corsica (France, Mediterranean): 8,680 km²." },
      { "id": "is-srilanka", "name": "Sri Lanka", "emoji": "🌴", "value": 65610, "source": "Sri Lanka (South Asia): 65,610 km²." },
      { "id": "is-madagascar", "name": "Madagascar", "emoji": "🦎", "value": 587041, "source": "Madagascar: 587,041 km². 4th largest island in the world." },
      { "id": "is-borneo", "name": "Borneo", "emoji": "🌳", "value": 743330, "source": "Borneo (Southeast Asia, shared by Indonesia/Malaysia/Brunei): 743,330 km². 3rd largest island." },
      { "id": "is-greenland", "name": "Greenland", "emoji": "🧊", "value": 2130800, "source": "Greenland (Denmark/self-governing): 2,130,800 km². World's largest island." }
    ]
  },
  {
    "topicId": "geography",
    "category": "Ocean deepest points",
    "rule": "Shallowest to deepest ocean point",
    "unit": "m",
    "difficulty": "hard",
    "verified": false,
    "items": [
      { "id": "od-mediterranean", "name": "Mediterranean Sea", "emoji": "🌊", "value": 5267, "source": "Mediterranean deepest point: ~5,267 m (Calypso Deep, west of Peloponnese)." },
      { "id": "od-arctic", "name": "Arctic Ocean", "emoji": "🧊", "value": 5550, "source": "Arctic Ocean deepest point: ~5,550 m (Molloy Deep, Fram Strait)." },
      { "id": "od-indian", "name": "Indian Ocean", "emoji": "🐳", "value": 7187, "source": "Indian Ocean deepest point: ~7,187 m (Java/Sunda Trench). Note: depth estimates vary by survey." },
      { "id": "od-atlantic", "name": "Atlantic Ocean", "emoji": "🚢", "value": 8376, "source": "Atlantic Ocean deepest point: ~8,376 m (Milwaukee Deep, Puerto Rico Trench)." },
      { "id": "od-pacific", "name": "Pacific Ocean", "emoji": "🌏", "value": 10935, "source": "Pacific Ocean deepest point: ~10,935 m (Challenger Deep, Mariana Trench). Deepest on Earth." }
    ]
  }
];

const all = [...existing, ...NEW_ROUNDS];
fs.writeFileSync(ROUNDS_PATH, JSON.stringify(all, null, 2) + '\n');
console.log(`Done. Wrote ${all.length} rounds (${existing.length} existing + ${NEW_ROUNDS.length} new).`);

// Sanity check
const counts = {};
NEW_ROUNDS.forEach(r => { counts[r.topicId] = (counts[r.topicId] || 0) + 1; });
console.log('New rounds per topicId:', counts);
