const fs = require('fs');

const FILE = 'C:\\Users\\Derek\\WebstormProjects\\TradinAI\\lib\\services\\candleAnalysisService.ts';
let content = fs.readFileSync(FILE, 'utf8');
const original = content;
let totalReplacements = 0;
const notFound = [];

function esc(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---- SIMPLE exact-match string replacements (keep single quotes) ----
const simpleMap = {
  "'At least 20 candles are required for a reliable analysis'": "'candle.errorNotEnoughCandles'",
  "'Technical analysis is probabilistic, not certainty'": "'candle.warning1'",
  "'Past performance does not guarantee future results'": "'candle.warning2'",
  "'Appropriate risk management is recommended'": "'candle.warning3'",
  "'Consider macroeconomic events and breaking news'": "'candle.warning4'",
  "'Higher Highs and Higher Lows - Clear bullish trend'": "'candle.trendBullishClear'",
  "'Lower Highs and Lower Lows - Clear bearish trend'": "'candle.trendBearishClear'",
  "'Lateral structure - Market without defined trend'": "'candle.trendLateral'",
  "'Moderate bullish trend'": "'candle.trendBullishModerate'",
  "'Moderate bearish trend'": "'candle.trendBearishModerate'",
  "'Market indecision. Forms when open ≈ close'": "'candle.dojiDesc'",
  "'Indecision. Small body with long wicks above and below. Possible upcoming change'": "'candle.spinningTopDesc'",
  "'Bullish harami. Second green candle completely contained within the red one. Possible reversal'": "'candle.bullishHaramiDesc'",
  "'Bearish harami. Second red candle completely contained within the green one. Possible reversal'": "'candle.bearishHaramiDesc'",
  "'Strong bullish signal. Bullish gap with second green candle opening above the previous one'": "'candle.bullishKickerDesc'",
  "'Strong bearish signal. Bearish gap with second red candle opening below the previous one'": "'candle.bearishKickerDesc'",
  "'Bullish continuation. Long green candle followed by small corrective red candles within range'": "'candle.risingThreeMethodsDesc'",
  "'Bearish continuation. Long red candle followed by small corrective green candles within range'": "'candle.fallingThreeMethodsDesc'",
  "'Strongly bullish'": "'candle.sentimentStronglyBullish'",
  "'Moderately bullish'": "'candle.sentimentModeratelyBullish'",
  "'Strongly bearish'": "'candle.sentimentStronglyBearish'",
  "'Moderately bearish'": "'candle.sentimentModeratelyBearish'",
  "'Neutral - No clear bias'": "'candle.sentimentNeutral'",
  "'RSI in overbought zone - Possible correction'": "'candle.riskOverbought'",
  "'RSI in oversold zone - Possible bounce'": "'candle.riskOversold'",
  "'Weak trend - Higher probability of change'": "'candle.riskWeakTrend'",
  "'Low volume - Less reliable moves'": "'candle.riskLowVolume'",
  "'Multiple bearish reversal patterns - Increased selling pressure'": "'candle.riskBearishPatterns'",
  "'Negative news sentiment - Additional bearish pressure from fundamental factors'": "'candle.riskNewsNegative'",
  "'Positive news sentiment - Fundamental backing that may reinforce current trend'": "'candle.riskNewsPositive'",
  "'aligns with'": "'candle.justifyAlignsWith'",
  "'diverges from'": "'candle.justifyDivergesFrom'",
  "'Confirmatory patterns identified.'": "'candle.justifyConfirmed'",
  "'Patterns show mixed signals.'": "'candle.justifyMixed'",
  "'show no extremes'": "'candle.justifyNoExtremes'",
  "'show extreme conditions'": "'candle.justifyExtremeConditions'",
  "'no specific pattern'": "'candle.shortNoPattern'",
  "'15-30 minutes'": "'candle.timeShort'",
  "'30-60 minutes'": "'candle.timeMedium'",
  "'1-2 hours'": "'candle.timeLong'",
  "'1-2 days'": "'candle.timeDaily'",
  "'1-2 weeks'": "'candle.timeWeekly'",
  "'1-3 months'": "'candle.timeMonthly'",
};

console.log('=== Simple string replacements ===');
for (const [oldStr, newStr] of Object.entries(simpleMap)) {
  if (content.includes(oldStr)) {
    const escaped = esc(oldStr);
    const regex = new RegExp(escaped, 'g');
    const matches = content.match(regex);
    content = content.replace(regex, newStr);
    totalReplacements += matches.length;
    console.log(`[OK] ${oldStr.substring(0, 60)}... -> ${newStr}: ${matches.length}`);
  } else {
    notFound.push('SIMPLE: ' + oldStr.substring(0, 60));
    console.log(`[NF] ${oldStr.substring(0, 60)}...`);
  }
}

// ---- Template literal → key replacements (entire template becomes plain string key) ----
console.log('\n=== Template literal → key replacements ===');

function replaceTemplateLiteral(betweenBackticks, newKey, label) {
  // Match from opening backtick, through content (with flexible ${...} matching), to closing backtick
  const parts = betweenBackticks.split(/\$\{[^}]+\}/);
  const interpCount = parts.length - 1;
  let pattern = esc(parts[0]);
  for (let i = 0; i < interpCount; i++) {
    pattern += '\\$\\{[^}]+\\}';
    pattern += esc(parts[i + 1]);
  }
  // Make whitespace flexible
  const flexPattern = pattern.replace(/\\ /g, '\\s+');
  const regex = new RegExp('`' + flexPattern + '`', 'gs');
  const match = content.match(regex);
  if (match) {
    content = content.replace(regex, `'${newKey}'`);
    totalReplacements += match.length;
    console.log(`[OK] ${label}: ${match.length}`);
  } else {
    // Try exact (non-flexible)
    const exactRegex = new RegExp('`' + pattern + '`', 'gs');
    const exactMatch = content.match(exactRegex);
    if (exactMatch) {
      content = content.replace(exactRegex, `'${newKey}'`);
      totalReplacements += exactMatch.length;
      console.log(`[OK] ${label}: ${exactMatch.length} [exact]`);
    } else {
      notFound.push('TEMPLATE: ' + label);
      console.log(`[NF] ${label}`);
    }
  }
}

// 25. Marubozu
replaceTemplateLiteral(
  `Strong candle without wicks. Indicates market decision. Volume: \${candle.volume > avgVolume ? 'high' : 'normal'}`,
  'candle.marubozuDesc', 'marubozuDesc'
);

// 26. Hammer
replaceTemplateLiteral(
  `Potential bullish reversal. Long lower wick. \${volumeConfirming ? '\u2713 Confirming volume' : '\u26a0 Low volume'}`,
  'candle.hammerDesc', 'hammerDesc'
);

// 27. Shooting Star
replaceTemplateLiteral(
  `Potential bearish reversal. Long upper wick. \${volumeConfirming ? '\u2713 Confirming volume' : '\u26a0 Low volume'}`,
  'candle.shootingStarDesc', 'shootingStarDesc'
);

// 28. Inverted Hammer
replaceTemplateLiteral(
  `Inverted hammer. Potential bullish reversal. Long upper wick. \${volumeConfirming ? '\u2713 Confirming volume' : ''}`,
  'candle.invertedHammerDesc', 'invertedHammerDesc'
);

// 29. Bullish Engulfing
replaceTemplateLiteral(
  `Bullish reversal. Second green candle completely engulfs the first red one. \${volumeIncreasing ? '\u2713 Confirming volume' : ''}`,
  'candle.bullishEngulfingDesc', 'bullishEngulfingDesc'
);

// 30. Bearish Engulfing
replaceTemplateLiteral(
  `Bearish reversal. Second red candle completely engulfs the first green one. \${volumeIncreasing ? '\u2713 Confirming volume' : ''}`,
  'candle.bearishEngulfingDesc', 'bearishEngulfingDesc'
);

// 31. Piercing Line
replaceTemplateLiteral(
  `Piercing line. Red candle followed by green that penetrates past 50% of the red one. \${volumeConfirming ? '\u2713 Confirming volume' : ''}`,
  'candle.piercingLineDesc', 'piercingLineDesc'
);

// 32. Dark Cloud Cover
replaceTemplateLiteral(
  `Dark cloud cover. Green candle followed by red that penetrates past 50% of the green one. \${volumeConfirming ? '\u2713 Confirming volume' : ''}`,
  'candle.darkCloudCoverDesc', 'darkCloudCoverDesc'
);

// 33. Three White Soldiers
replaceTemplateLiteral(
  `Strong bullish reversal. Three consecutive green candles in ascending order. \${volumeTrend ? '\u2713 Confirming volume' : ''}`,
  'candle.threeWhiteSoldiersDesc', 'threeWhiteSoldiersDesc'
);

// 34. Three Black Crows
replaceTemplateLiteral(
  `Strong bearish reversal. Three consecutive red candles in descending order. \${volumeTrend ? '\u2713 Confirming volume' : ''}`,
  'candle.threeBlackCrowsDesc', 'threeBlackCrowsDesc'
);

// 35. Morning Star
replaceTemplateLiteral(
  `Morning star. Strong bullish reversal pattern. Red + small + green. \${momentumConfirming ? '\u2713 Confirming momentum' : ''}`,
  'candle.morningStarDesc', 'morningStarDesc'
);

// 36. Evening Star
replaceTemplateLiteral(
  `Evening star. Strong bearish reversal pattern. Green + small + red. \${momentumConfirming ? '\u2713 Confirming momentum' : ''}`,
  'candle.eveningStarDesc', 'eveningStarDesc'
);

// 37. justifyScenario (multi-line return)
{
  const oldPattern = `The \${direction} scenario \${trend} the current trend. \${patternMatch ? 'Confirmatory patterns identified.' : 'Patterns show mixed signals.'} Indicators \${indicators.rsi.status === 'neutral' ? 'show no extremes' : 'show extreme conditions'}.`;
  const parts37 = oldPattern.split(/\$\{[^}]+\}/);
  const ip37 = parts37.length - 1;
  let pat37 = esc(parts37[0]);
  for (let i = 0; i < ip37; i++) {
    pat37 += '\\$\\{[^}]+\\}';
    pat37 += esc(parts37[i + 1]);
  }
  // Multi-line: allow any whitespace including newlines between tokens
  const flex37 = pat37.replace(/\\ /g, '[\\s\\n]*');
  const regex37 = new RegExp('`' + flex37 + '`', 'gs');
  const match37 = content.match(regex37);
  if (match37) {
    content = content.replace(regex37, `'candle.justifyScenario'`);
    totalReplacements += match37.length;
    console.log(`[OK] justifyScenario: ${match37.length}`);
  } else {
    notFound.push('TEMPLATE: justifyScenario');
    console.log('[NF] justifyScenario');
  }
}

// 38. justifyAlternative
replaceTemplateLiteral(
  `Alternative scenario considering changing market conditions.`,
  'candle.justifyAlternative', 'justifyAlternative'
);

// 39. shortTemplate
replaceTemplateLiteral(
  `The market shows a \${trend} trend with \${pattern} identified. The primary prediction is \${prediction.direction} with \${prediction.probability}% probability.`,
  'candle.shortTemplate', 'shortTemplate'
);

// 40. riskNewsHigh
replaceTemplateLiteral(
  `High news impact (\${this.newsImpact.articleCount} articles) - Significant market events unfolding`,
  'candle.riskNewsHigh', 'riskNewsHigh'
);

// 41. supportAt / resistanceAt
replaceTemplateLiteral(
  `Support at \${level.toFixed(2)}`,
  'candle.supportAt', 'supportAt'
);
replaceTemplateLiteral(
  `Resistance at \${level.toFixed(2)}`,
  'candle.resistanceAt', 'resistanceAt'
);

// ---- Partial replacements inside template literals (keep template structure) ----
console.log('\n=== Partial in-template replacements ===');

const partialMap = {
  '`## DETAILED ANALYSIS\\n\\n`': "`candle.detailedHeader\\n\\n`",
  '`### Trend\\n`': '`candle.detailedTrend\\n`',
  'Strength: ': 'candle.detailedStrength',
  '`### Identified Patterns\\n`': '`candle.detailedPatterns\\n`',
  '\\n### Indicators\\n': '\\ncandle.detailedIndicators\\n',
  '\\n### Key Levels\\n': '\\ncandle.detailedLevels\\n',
  'Supports: ': 'candle.detailedSupports',
  'Resistances: ': 'candle.detailedResistances',
  '\\n### News Impact\\n': '\\ncandle.detailedNews\\n',
  'Overall sentiment: ': 'candle.detailedSentiment',
  'Confidence: ': 'candle.detailedConfidence',
  'Articles analyzed: ': 'candle.detailedArticles',
};

for (const [oldStr, newStr] of Object.entries(partialMap)) {
  // Unescape for actual matching
  const unescOld = oldStr.replace(/\\\\/g, '\\');
  const unescNew = newStr.replace(/\\\\/g, '\\');
  if (content.includes(unescOld)) {
    const idx = content.indexOf(unescOld);
    // Count
    let count = 0;
    let pos = 0;
    while ((pos = content.indexOf(unescOld, pos)) !== -1) {
      count++;
      pos += unescOld.length;
    }
    content = content.split(unescOld).join(unescNew);
    totalReplacements += count;
    console.log(`[OK] ${unescOld.substring(0, 50)}...: ${count}`);
  } else {
    console.log(`[NF] ${unescOld.substring(0, 50)}...`);
    notFound.push('PARTIAL: ' + unescOld.substring(0, 50));
  }
}

// ---- Write result ----
console.log(`\n=== SUMMARY ===`);
console.log(`Total strings replaced: ${totalReplacements}`);
if (notFound.length > 0) {
  console.log(`Not found (${notFound.length}):`);
  notFound.forEach(nf => console.log(`  - ${nf}`));
}

fs.writeFileSync(FILE, content, 'utf8');
console.log(`\nFile written: ${FILE}`);
