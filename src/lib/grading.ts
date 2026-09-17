export type PredictionStatus = 'PENDING' | 'WON' | 'LOST' | 'VOID';

export interface GradingInput {
  market: string; // '1X2' | 'DOUBLE_CHANCE' | 'OVER_UNDER' | 'BTTS'
  pick: string;
  homeScore: number | null;
  awayScore: number | null;
  matchStatus: string; // 'NS' | 'LIVE' | 'FT' | 'AET' | 'PEN' | 'POSTP' | 'CANC' | 'ABD'
}

export interface GradingResult {
  status: PredictionStatus;
  reason: string;
}

/**
 * Deterministically grades a football prediction based on the final match score
 */
export function gradePrediction(input: GradingInput): GradingResult {
  const { market, pick, homeScore, awayScore, matchStatus } = input;

  const normalizedStatus = matchStatus.toUpperCase().trim();

  // Handle cancelled or postponed matches
  if (['POSTP', 'CANC', 'ABD', 'INT', 'SUSP'].includes(normalizedStatus)) {
    return {
      status: 'VOID',
      reason: `Match was ${normalizedStatus} (postponed/cancelled/interrupted)`
    };
  }

  // If match is not finished, it remains PENDING
  if (!['FT', 'AET', 'PEN', 'FINISHED'].includes(normalizedStatus)) {
    return {
      status: 'PENDING',
      reason: 'Match has not concluded yet'
    };
  }

  if (homeScore === null || awayScore === null || isNaN(homeScore) || isNaN(awayScore)) {
    return {
      status: 'PENDING',
      reason: 'Final score not recorded'
    };
  }

  const cleanPick = pick.trim();
  const upperMarket = market.toUpperCase().trim();

  // 1X2 Market (Full Time Result)
  if (upperMarket === '1X2' || upperMarket === 'MATCH_RESULT') {
    if (cleanPick === '1' || cleanPick.toLowerCase().includes('home')) {
      return homeScore > awayScore
        ? { status: 'WON', reason: `Home win (${homeScore}-${awayScore}) matches pick 1` }
        : { status: 'LOST', reason: `Result (${homeScore}-${awayScore}) does not match Home win` };
    }
    if (cleanPick === 'X' || cleanPick.toLowerCase().includes('draw')) {
      return homeScore === awayScore
        ? { status: 'WON', reason: `Draw (${homeScore}-${awayScore}) matches pick X` }
        : { status: 'LOST', reason: `Result (${homeScore}-${awayScore}) was not a draw` };
    }
    if (cleanPick === '2' || cleanPick.toLowerCase().includes('away')) {
      return awayScore > homeScore
        ? { status: 'WON', reason: `Away win (${homeScore}-${awayScore}) matches pick 2` }
        : { status: 'LOST', reason: `Result (${homeScore}-${awayScore}) does not match Away win` };
    }
  }

  // Double Chance Market
  if (upperMarket === 'DOUBLE_CHANCE' || upperMarket === 'DC') {
    if (cleanPick === '1X' || cleanPick.toLowerCase().includes('home or draw')) {
      return homeScore >= awayScore
        ? { status: 'WON', reason: `Home win or Draw (${homeScore}-${awayScore}) matches 1X` }
        : { status: 'LOST', reason: `Away win (${homeScore}-${awayScore}) fails 1X` };
    }
    if (cleanPick === '12' || cleanPick.toLowerCase().includes('home or away')) {
      return homeScore !== awayScore
        ? { status: 'WON', reason: `Non-draw (${homeScore}-${awayScore}) matches 12` }
        : { status: 'LOST', reason: `Draw (${homeScore}-${awayScore}) fails 12` };
    }
    if (cleanPick === 'X2' || cleanPick.toLowerCase().includes('draw or away')) {
      return awayScore >= homeScore
        ? { status: 'WON', reason: `Draw or Away win (${homeScore}-${awayScore}) matches X2` }
        : { status: 'LOST', reason: `Home win (${homeScore}-${awayScore}) fails X2` };
    }
  }

  // Over / Under Goals Market
  if (upperMarket === 'OVER_UNDER' || upperMarket === 'GOALS' || upperMarket === 'TOTAL_GOALS') {
    const totalGoals = homeScore + awayScore;
    const match = cleanPick.match(/(Over|Under)\s*(\d+(\.\d+)?)/i);
    if (match) {
      const type = match[1].toLowerCase();
      const threshold = parseFloat(match[2]);

      if (type === 'over') {
        return totalGoals > threshold
          ? { status: 'WON', reason: `Total goals ${totalGoals} is over ${threshold}` }
          : { status: 'LOST', reason: `Total goals ${totalGoals} is not over ${threshold}` };
      } else {
        return totalGoals < threshold
          ? { status: 'WON', reason: `Total goals ${totalGoals} is under ${threshold}` }
          : { status: 'LOST', reason: `Total goals ${totalGoals} is not under ${threshold}` };
      }
    }
  }

  // BTTS (Both Teams To Score) Market
  if (upperMarket === 'BTTS' || upperMarket === 'BOTH_TEAMS_TO_SCORE') {
    const bothScored = homeScore > 0 && awayScore > 0;
    if (cleanPick.toLowerCase() === 'yes' || cleanPick.toLowerCase() === 'gg') {
      return bothScored
        ? { status: 'WON', reason: `Both teams scored (${homeScore}-${awayScore})` }
        : { status: 'LOST', reason: `At least one team failed to score (${homeScore}-${awayScore})` };
    }
    if (cleanPick.toLowerCase() === 'no' || cleanPick.toLowerCase() === 'ng') {
      return !bothScored
        ? { status: 'WON', reason: `Clean sheet or 0-0 achieved (${homeScore}-${awayScore})` }
        : { status: 'LOST', reason: `Both teams scored (${homeScore}-${awayScore})` };
    }
  }

  return {
    status: 'PENDING',
    reason: `Unrecognized market/pick combo: ${market} / ${pick}`
  };
}
