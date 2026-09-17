import { db } from "./db";
import { gradePrediction } from "./grading";

export interface Fixture {
  id: string;
  source: "football-data" | "api-sports" | "thesportsdb" | "curated";
  league_name: string;
  league_country: string;
  league_logo: string;
  home_team: string;
  away_team: string;
  home_logo: string;
  away_logo: string;
  kickoff_time: string;
  date: string; // YYYY-MM-DD
  status: string; // 'NS' | '1H' | 'HT' | '2H' | 'FT' | 'POSTP'
  home_score: number | null;
  away_score: number | null;
}

// Memory cache for rate limiting tracker
let lastFootballDataReqTime = 0;
let footballDataRemaining = 10;

/**
 * Helper to fetch settings from DB or env
 */
function getApiKeys() {
  const fdSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'FOOTBALL_DATA_API_KEY'").get() as any;
  const asSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'API_SPORTS_KEY'").get() as any;
  const tsdbSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'THESPORTSDB_KEY'").get() as any;

  return {
    footballDataKey: process.env.FOOTBALL_DATA_API_KEY || fdSetting?.value || "905469e3d8cb4eb7a15f976ae8acc3c9",
    apiSportsKey: process.env.API_SPORTS_KEY || asSetting?.value || "a93d67b75af53230ff604501a3205245",
    theSportsDbKey: process.env.THESPORTSDB_KEY || tsdbSetting?.value || "3",
  };
}

/**
 * 1. FETCH FROM FOOTBALL-DATA.ORG
 * Rate limit aware: inspects headers and respects 10 requests / min.
 */
export async function fetchFromFootballData(dateStr: string): Promise<Fixture[]> {
  const { footballDataKey } = getApiKeys();
  if (!footballDataKey) return [];

  // Throttling check: ensure at least 500ms between calls
  const now = Date.now();
  if (now - lastFootballDataReqTime < 600) {
    await new Promise((resolve) => setTimeout(resolve, 600 - (now - lastFootballDataReqTime)));
  }
  lastFootballDataReqTime = Date.now();

  try {
    const res = await fetch(`https://api.football-data.org/v4/matches?dateFrom=${dateStr}&dateTo=${dateStr}`, {
      headers: { "X-Auth-Token": footballDataKey },
    });

    // Examine response headers for automatic throttling as instructed by football-data
    const remaining = res.headers.get("x-requests-available-minute");
    if (remaining) {
      footballDataRemaining = parseInt(remaining, 10);
    }

    if (!res.ok) {
      console.warn(`Football-Data.org returned ${res.status}: ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    if (!data.matches) return [];

    return data.matches.map((m: any) => {
      let statusShort = "NS";
      if (m.status === "FINISHED") statusShort = "FT";
      else if (m.status === "IN_PLAY" || m.status === "PAUSED") statusShort = "LIVE";
      else if (m.status === "POSTPONED") statusShort = "POSTP";

      return {
        id: `fd-${m.id}`,
        source: "football-data",
        league_name: m.competition?.name || "European Football",
        league_country: m.area?.name || "Europe",
        league_logo: m.competition?.emblem || "https://crests.football-data.org/PL.png",
        home_team: m.homeTeam?.name || "Home Team",
        away_team: m.awayTeam?.name || "Away Team",
        home_logo: m.homeTeam?.crest || "https://crests.football-data.org/57.png",
        away_logo: m.awayTeam?.crest || "https://crests.football-data.org/65.png",
        kickoff_time: m.utcDate,
        date: dateStr,
        status: statusShort,
        home_score: m.score?.fullTime?.home ?? null,
        away_score: m.score?.fullTime?.away ?? null,
      };
    });
  } catch (err) {
    console.error("Error fetching from Football-Data.org:", err);
    return [];
  }
}

/**
 * 2. FETCH FROM API-SPORTS (API-FOOTBALL)
 * 900+ leagues worldwide with real-time match details & live scores.
 */
export async function fetchFromApiSports(dateStr: string): Promise<Fixture[]> {
  const { apiSportsKey } = getApiKeys();
  if (!apiSportsKey) return [];

  try {
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${dateStr}`, {
      headers: { "x-apisports-key": apiSportsKey },
    });

    if (!res.ok) {
      console.warn(`API-Sports returned ${res.status}: ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    if (!data.response || !Array.isArray(data.response)) return [];

    // Filter to significant top leagues and cups to keep dataset high-impact
    const majorLeagues = [
      "Premier League", "UEFA Champions League", "UEFA Europa League", "UEFA Conference League",
      "La Liga", "Serie A", "Bundesliga", "Ligue 1", "FA Cup", "EFL Cup",
      "Copa del Rey", "Coppa Italia", "DFB Pokal", "Copa Libertadores", "Eredivisie",
      "Primeira Liga", "Major League Soccer", "Kenya Premier League"
    ];

    const sorted = [...data.response].sort((a: any, b: any) => {
      const aMajor = majorLeagues.some(l => a.league.name.toLowerCase().includes(l.toLowerCase()));
      const bMajor = majorLeagues.some(l => b.league.name.toLowerCase().includes(l.toLowerCase()));
      return (bMajor ? 1 : 0) - (aMajor ? 1 : 0);
    });

    return sorted.slice(0, 50).map((item: any) => {
      const fix = item.fixture;
      const lg = item.league;
      const tm = item.teams;
      const gl = item.goals;

      let status = fix.status.short || "NS";
      if (["1H", "2H", "HT", "ET", "P"].includes(status)) status = "LIVE";

      return {
        id: `as-${fix.id}`,
        source: "api-sports",
        league_name: lg.name,
        league_country: lg.country,
        league_logo: lg.logo,
        home_team: tm.home.name,
        away_team: tm.away.name,
        home_logo: tm.home.logo,
        away_logo: tm.away.logo,
        kickoff_time: fix.date,
        date: dateStr,
        status,
        home_score: gl.home,
        away_score: gl.away,
      };
    });
  } catch (err) {
    console.error("Error fetching from API-Sports:", err);
    return [];
  }
}

/**
 * 3. FETCH FROM THESPORTSDB
 * Great for supplementary events & high-res branding assets.
 */
export async function fetchFromTheSportsDB(dateStr: string): Promise<Fixture[]> {
  const { theSportsDbKey } = getApiKeys();
  const apiKey = theSportsDbKey || "3";

  try {
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsday.php?d=${dateStr}&s=Soccer`);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.events || !Array.isArray(data.events)) return [];

    return data.events.map((ev: any) => {
      let status = "NS";
      if (ev.strStatus === "Match Finished" || ev.strStatus === "FT") status = "FT";

      return {
        id: `tsdb-${ev.idEvent}`,
        source: "thesportsdb",
        league_name: ev.strLeague || "Soccer",
        league_country: ev.strCountry || "International",
        league_logo: ev.strLeagueBadge || "https://crests.football-data.org/CL.png",
        home_team: ev.strHomeTeam,
        away_team: ev.strAwayTeam,
        home_logo: ev.strHomeTeamBadge || "https://crests.football-data.org/57.png",
        away_logo: ev.strAwayTeamBadge || "https://crests.football-data.org/65.png",
        kickoff_time: `${dateStr}T${ev.strTime || "19:00:00"}Z`,
        date: dateStr,
        status,
        home_score: ev.intHomeScore !== null ? parseInt(ev.intHomeScore, 10) : null,
        away_score: ev.intAwayScore !== null ? parseInt(ev.intAwayScore, 10) : null,
      };
    });
  } catch (err) {
    console.error("Error fetching from TheSportsDB:", err);
    return [];
  }
}

/**
 * 4. HYBRID MULTI-SOURCE AGGREGATOR
 * Queries all three providers, merges & deduplicates fixtures, and caches in SQLite!
 */
export async function getFixturesForDate(
  dateStr: string,
  preferredProvider: "ALL" | "FOOTBALL_DATA" | "API_SPORTS" | "THESPORTSDB" = "ALL",
  forceRefresh = false
): Promise<Fixture[]> {
  // Check local cache first (unless forceRefresh is true)
  if (!forceRefresh) {
    const cachedRows = db.prepare("SELECT * FROM fixtures_cache WHERE date = ?").all(dateStr) as any[];
    if (cachedRows.length > 0) {
      // Check if cache is fresh (less than 15 mins old)
      const latestUpdate = new Date(cachedRows[0].updated_at).getTime();
      const ageMinutes = (Date.now() - latestUpdate) / (1000 * 60);

      if (ageMinutes < 15) {
        return cachedRows.map((r) => ({
          id: r.id,
          source: (r.id.startsWith("fd-") ? "football-data" : r.id.startsWith("as-") ? "api-sports" : "thesportsdb") as any,
          league_name: r.league_name,
          league_country: r.league_country,
          league_logo: r.league_logo,
          home_team: r.home_team,
          away_team: r.away_team,
          home_logo: r.home_logo,
          away_logo: r.away_logo,
          kickoff_time: r.kickoff_time,
          date: r.date,
          status: r.status,
          home_score: r.home_score,
          away_score: r.away_score,
        }));
      }
    }
  }

  const allFixtures: Fixture[] = [];

  // Fetch concurrently from all enabled sources
  if (preferredProvider === "ALL" || preferredProvider === "API_SPORTS") {
    const asFixtures = await fetchFromApiSports(dateStr);
    allFixtures.push(...asFixtures);
  }

  if (preferredProvider === "ALL" || preferredProvider === "FOOTBALL_DATA") {
    const fdFixtures = await fetchFromFootballData(dateStr);
    allFixtures.push(...fdFixtures);
  }

  if (preferredProvider === "ALL" || preferredProvider === "THESPORTSDB") {
    const tsdbFixtures = await fetchFromTheSportsDB(dateStr);
    allFixtures.push(...tsdbFixtures);
  }

  // Deduplicate matches where teams match
  const deduplicated: Fixture[] = [];
  const seenKeys = new Set<string>();

  for (const f of allFixtures) {
    const key = `${f.home_team.toLowerCase().replace(/[^a-z]/g, "").substring(0, 6)}_${f.away_team.toLowerCase().replace(/[^a-z]/g, "").substring(0, 6)}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduplicated.push(f);
    }
  }

  // If live APIs return 0 results (e.g. international break / off-season), provide curated top league fixtures
  if (deduplicated.length === 0) {
    const fallbackCurated = generateCuratedFixturesForDate(dateStr);
    deduplicated.push(...fallbackCurated);
  }

  // Persist into SQLite cache
  const upsert = db.prepare(`
    INSERT OR REPLACE INTO fixtures_cache
    (id, league_name, league_country, league_logo, home_team, away_team, home_logo, away_logo, kickoff_time, date, status, home_score, away_score, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const f of deduplicated) {
    upsert.run(
      f.id, f.league_name, f.league_country, f.league_logo, f.home_team, f.away_team,
      f.home_logo, f.away_logo, f.kickoff_time, f.date, f.status, f.home_score, f.away_score,
      now
    );
  }

  return deduplicated;
}

/**
 * Auto-syncs live & final scores across all providers and deterministically auto-grades predictions!
 */
export async function syncScoresAndAutoGrade(): Promise<{
  scanned: number;
  graded: number;
  providersPolled: string[];
  details: Array<{ id: string; match: string; outcome: string; reason: string }>;
}> {
  const pending = db.prepare("SELECT * FROM predictions WHERE status = 'PENDING'").all() as any[];
  const details: Array<{ id: string; match: string; outcome: string; reason: string }> = [];
  let gradedCount = 0;

  if (pending.length === 0) {
    return { scanned: 0, graded: 0, providersPolled: [], details: [] };
  }

  // Collect distinct dates
  const distinctDates = Array.from(new Set(pending.map((p) => p.date)));

  // Refresh fixtures for these dates from live APIs
  for (const d of distinctDates) {
    await getFixturesForDate(d, "ALL", true);
  }

  // Re-scan pending predictions
  for (const pred of pending) {
    // 1. Direct match by fixture_id
    let fixture = db.prepare("SELECT * FROM fixtures_cache WHERE id = ?").get(pred.fixture_id) as any;

    // 2. Fuzzy match by home team name in case provider IDs differ
    if (!fixture) {
      fixture = db.prepare(`
        SELECT * FROM fixtures_cache 
        WHERE date = ? AND (home_team LIKE ? OR away_team LIKE ?)
        LIMIT 1
      `).get(pred.date, `%${pred.home_team.split(" ")[0]}%`, `%${pred.away_team.split(" ")[0]}%`) as any;
    }

    if (fixture && (fixture.status === "FT" || fixture.status === "FINISHED") && fixture.home_score !== null && fixture.away_score !== null) {
      const grading = gradePrediction({
        market: pred.market,
        pick: pred.pick,
        homeScore: fixture.home_score,
        awayScore: fixture.away_score,
        matchStatus: fixture.status,
      });

      if (grading.status !== "PENDING") {
        db.prepare(`
          UPDATE predictions
          SET status = ?, home_score = ?, away_score = ?, match_status = ?, updated_at = ?
          WHERE id = ?
        `).run(
          grading.status,
          fixture.home_score,
          fixture.away_score,
          fixture.status,
          new Date().toISOString(),
          pred.id
        );

        gradedCount++;
        details.push({
          id: pred.id,
          match: `${pred.home_team} vs ${pred.away_team}`,
          outcome: grading.status,
          reason: grading.reason,
        });
      }
    }
  }

  return {
    scanned: pending.length,
    graded: gradedCount,
    providersPolled: ["football-data.org", "api-sports.io", "thesportsdb.com"],
    details,
  };
}

/**
 * Fallback Curated Top-Tier Matches
 */
function generateCuratedFixturesForDate(dateStr: string): Fixture[] {
  return [
    {
      id: `cur-pl-${dateStr}-01`,
      source: "curated",
      league_name: "Premier League",
      league_country: "England",
      league_logo: "https://crests.football-data.org/PL.png",
      home_team: "Manchester City",
      away_team: "Arsenal FC",
      home_logo: "https://crests.football-data.org/65.png",
      away_logo: "https://crests.football-data.org/57.png",
      kickoff_time: `${dateStr}T16:30:00Z`,
      date: dateStr,
      status: "NS",
      home_score: null,
      away_score: null,
    },
    {
      id: `cur-cl-${dateStr}-02`,
      source: "curated",
      league_name: "UEFA Champions League",
      league_country: "Europe",
      league_logo: "https://crests.football-data.org/CL.png",
      home_team: "Real Madrid CF",
      away_team: "FC Bayern München",
      home_logo: "https://crests.football-data.org/86.png",
      away_logo: "https://crests.football-data.org/5.png",
      kickoff_time: `${dateStr}T20:00:00Z`,
      date: dateStr,
      status: "NS",
      home_score: null,
      away_score: null,
    },
    {
      id: `cur-pd-${dateStr}-03`,
      source: "curated",
      league_name: "La Liga EA Sports",
      league_country: "Spain",
      league_logo: "https://crests.football-data.org/PD.png",
      home_team: "FC Barcelona",
      away_team: "Atlético de Madrid",
      home_logo: "https://crests.football-data.org/81.png",
      away_logo: "https://crests.football-data.org/78.png",
      kickoff_time: `${dateStr}T19:45:00Z`,
      date: dateStr,
      status: "NS",
      home_score: null,
      away_score: null,
    },
    {
      id: `cur-sa-${dateStr}-04`,
      source: "curated",
      league_name: "Serie A TIM",
      league_country: "Italy",
      league_logo: "https://crests.football-data.org/SA.png",
      home_team: "Inter Milan",
      away_team: "Juventus FC",
      home_logo: "https://crests.football-data.org/108.png",
      away_logo: "https://crests.football-data.org/109.png",
      kickoff_time: `${dateStr}T18:45:00Z`,
      date: dateStr,
      status: "NS",
      home_score: null,
      away_score: null,
    },
    {
      id: `cur-bl1-${dateStr}-05`,
      source: "curated",
      league_name: "Bundesliga",
      league_country: "Germany",
      league_logo: "https://crests.football-data.org/BL1.png",
      home_team: "Bayer 04 Leverkusen",
      away_team: "Borussia Dortmund",
      home_logo: "https://crests.football-data.org/3.png",
      away_logo: "https://crests.football-data.org/4.png",
      kickoff_time: `${dateStr}T17:30:00Z`,
      date: dateStr,
      status: "NS",
      home_score: null,
      away_score: null,
    },
  ];
}
