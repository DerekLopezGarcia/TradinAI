const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'lib', 'services', 'candleAnalysisService.ts');
let content = fs.readFileSync(file, 'utf8');

// ============================================================
// Add import for t()
// ============================================================
content = content.replace(
  "import { BaseService } from '@/lib/core/services';",
  "import { BaseService } from '@/lib/core/services';\nimport { t } from '@/lib/i18n/t';"
);

// ============================================================
// ERROR MESSAGE
// ============================================================
content = content.replace(
  "'At least 20 candles are required for a reliable analysis'",
  "t('analysis.errorMinCandles')"
);

// ============================================================
// WARNINGS
// ============================================================
content = content.replace(
  "'Technical analysis is probabilistic, not certainty'",
  "t('analysis.warningProbabilistic')"
);
content = content.replace(
  "'Past performance does not guarantee future results'",
  "t('analysis.warningPastPerf')"
);
content = content.replace(
  "'Appropriate risk management is recommended'",
  "t('analysis.warningRiskMgmt')"
);
content = content.replace(
  "'Consider macroeconomic events and breaking news'",
  "t('analysis.warningMacroEvents')"
);

// ============================================================
// TREND DESCRIPTIONS
// ============================================================
content = content.replace(
  "'Higher Highs and Higher Lows - Clear bullish trend'",
  "t('analysis.trendClearBullish')"
);
content = content.replace(
  "'Lower Highs and Lower Lows - Clear bearish trend'",
  "t('analysis.trendClearBearish')"
);
content = content.replace(
  "'Lateral structure - Market without defined trend'",
  "t('analysis.trendLateral')"
);
content = content.replace(
  "'Moderate bullish trend'",
  "t('analysis.trendModerateBullish')"
);
content = content.replace(
  "'Moderate bearish trend'",
  "t('analysis.trendModerateBearish')"
);

// ============================================================
// SENTIMENT LABELS
// ============================================================
content = content.replace(
  "'Strongly bullish'",
  "t('analysis.sentimentStrongBullish')"
);
content = content.replace(
  "'Moderately bullish'",
  "t('analysis.sentimentModerateBullish')"
);
content = content.replace(
  "'Strongly bearish'",
  "t('analysis.sentimentStrongBearish')"
);
content = content.replace(
  "'Moderately bearish'",
  "t('analysis.sentimentModerateBearish')"
);
content = content.replace(
  "'Neutral - No clear bias'",
  "t('analysis.sentimentNeutral')"
);

// ============================================================
// RISK FACTORS
// ============================================================
content = content.replace(
  "'RSI in overbought zone - Possible correction'",
  "t('analysis.riskOverbought')"
);
content = content.replace(
  "'RSI in oversold zone - Possible bounce'",
  "t('analysis.riskOversold')"
);
content = content.replace(
  "'Weak trend - Higher probability of change'",
  "t('analysis.riskWeakTrend')"
);
content = content.replace(
  "'Low volume - Less reliable moves'",
  "t('analysis.riskLowVolume')"
);
content = content.replace(
  "'Multiple bearish reversal patterns - Increased selling pressure'",
  "t('analysis.riskMultiBearish')"
);
content = content.replace(
  "'Negative news sentiment - Additional bearish pressure from fundamental factors'",
  "t('analysis.riskNegativeNews')"
);
content = content.replace(
  "'Positive news sentiment - Fundamental backing that may reinforce current trend'",
  "t('analysis.riskPositiveNews')"
);

// ============================================================
// PATTERN DESCRIPTIONS (simple single-line)
// ============================================================
content = content.replace(
  "description: 'Market indecision. Forms when open ~ close'",
  "description: t('analysis.patternDoji')"
);
content = content.replace(
  "description: 'Indecision. Small body with long wicks above and below. Possible upcoming change'",
  "description: t('analysis.patternSpinningTop')"
);

// Harami patterns
content = content.replace(
  "description: 'Bullish harami. Second green candle completely contained within the red one. Possible reversal'",
  "description: t('analysis.patternBullishHarami')"
);
content = content.replace(
  "description: 'Bearish harami. Second red candle completely contained within the green one. Possible reversal'",
  "description: t('analysis.patternBearishHarami')"
);

// Kicker patterns
content = content.replace(
  "description: 'Strong bullish signal. Bullish gap with second green candle opening above the previous one'",
  "description: t('analysis.patternBullishKicker')"
);
content = content.replace(
  "description: 'Strong bearish signal. Bearish gap with second red candle opening below the previous one'",
  "description: t('analysis.patternBearishKicker')"
);

// Continuation patterns
content = content.replace(
  "description: 'Bullish continuation. Long green candle followed by small corrective red candles within the range'",
  "description: t('analysis.patternRisingThree')"
);
content = content.replace(
  "description: 'Bearish continuation. Long red candle followed by small corrective green candles within the range'",
  "description: t('analysis.patternFallingThree')"
);

// ============================================================
// PREDICTION JUSTIFICATION
// ============================================================
content = content.replace(
  "'aligns with'",
  "t('analysis.justificationAligns')"
);
content = content.replace(
  "'diverges from'",
  "t('analysis.justificationDiverges')"
);
content = content.replace(
  "'Confirmatory patterns identified.'",
  "t('analysis.justificationConfirmPatterns')"
);
content = content.replace(
  "'Patterns show mixed signals.'",
  "t('analysis.justificationMixedSignals')"
);

// ============================================================
// SHORT ANALYSIS
// ============================================================
content = content.replace(
  "'no specific pattern'",
  "t('analysis.noSpecificPattern')"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done: candleAnalysisService.ts updated with i18n keys');
