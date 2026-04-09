/**
 * Servicio de Analisis de Sentimiento de Noticias - T2.2 MULTIIDIOMA
 * 
 * Analisis avanzado de sentimiento para noticias financieras:
 * - Soporte multiidioma: Ingles (principal), Espanol, y traduccion automatica
 * - Analisis de palabras clave ponderadas
 * - Scores normalizados (-1 a 1)
 * - Confiabilidad del sentimiento (0-100)
 * - Deteccion de idioma automatica
 * - Traduccion basica para idiomas no soportados
 */

export interface SentimentAnalysis {
  score: number;              // -1 (muy negativo) a 1 (muy positivo), 0 neutral
  confidence: number;         // 0-100, confianza en el analisis
  sentiment: 'negative' | 'neutral' | 'positive';
  keywords: {
    positive: string[];
    negative: string[];
  };
  strength: 'strong' | 'moderate' | 'weak';
  reasoning: string;
  detectedLanguage: string;   // Idioma detectado
}

export class NewsSentimentService {
  // PALABRAS CLAVE EN INGLES (Principal - Mayoria de noticias)
  private readonly POSITIVE_WORDS_EN: Record<string, number> = {
    // Muy positivo (+3)
    'surge': 3, 'soar': 3, 'rally': 3, 'explosive': 3, 'record': 3,
    'boom': 3, 'bullish': 3, 'excellent': 3, 'extraordinary': 3, 'outperform': 3,
    'gains': 3, 'profit': 3, 'growth': 3, 'up': 3, 'bull': 3,
    
    // Positivo (+2)
    'gain': 2, 'grow': 2, 'advance': 2, 'improve': 2, 'positive': 2,
    'agreement': 2, 'approval': 2, 'success': 2, 'prosperity': 2, 'optimism': 2,
    'buy': 2, 'investment': 2, 'opportunity': 2, 'strength': 2, 'benefit': 2,
    'advantage': 2, 'earnings': 2, 'revenue': 2, 'expansion': 2, 'recovery': 2,
    'rise': 2, 'jump': 2, 'climb': 2, 'strong': 2, 'solid': 2,
    
    // Ligeramente positivo (+1)
    'good': 1, 'well': 1, 'stable': 1, 'confidence': 1, 'security': 1,
    'progress': 1, 'development': 1, 'better': 1, 'upgrade': 1, 'beat': 1,
  };

  private readonly NEGATIVE_WORDS_EN: Record<string, number> = {
    // Muy negativo (-3)
    'collapse': 3, 'crash': 3, 'panic': 3, 'disaster': 3,
    'crisis': 3, 'bankruptcy': 3, 'plunge': 3, 'catastrophic': 3, 'drop': 3,
    'bearish': 3, 'critical': 3, 'urgent': 3, 'risk': 3, 'loss': 3,
    'down': 3, 'fall': 3, 'bear': 3, 'slump': 3, 'tank': 3,
    
    // Negativo (-2)
    'lose': 2, 'failure': 2, 'decline': 2, 'rejection': 2, 'pessimism': 2,
    'negative': 2, 'conflict': 2, 'uncertainty': 2, 'problem': 2,
    'sell': 2, 'threat': 2, 'weakness': 2, 'disadvantage': 2,
    'pressure': 2, 'stress': 2, 'contraction': 2, 'recession': 2,
    'miss': 2, 'weak': 2, 'poor': 2,
    
    // Ligeramente negativo (-1)
    'bad': 1, 'decrease': 1,
    'unstable': 1, 'doubt': 1, 'concern': 1, 'delay': 1, 'deteriorate': 1,
  };

  // PALABRAS CLAVE EN ESPANOL
  private readonly POSITIVE_WORDS_ES: Record<string, number> = {
    'sube': 3, 'rally': 3, 'explosivo': 3, 'record': 3,
    'boom': 3, 'alcista': 3, 'bullish': 3, 'excelente': 3, 'extraordinario': 3,
    'gana': 2, 'crece': 2, 'avance': 2, 'mejora': 2, 'positivo': 2,
    'acuerdo': 2, 'aprobado': 2, 'exito': 2, 'prosperidad': 2, 'optimismo': 2,
    'compra': 2, 'inversion': 2, 'oportunidad': 2, 'fortaleza': 2, 'beneficio': 2,
    'ventaja': 2, 'utilidades': 2, 'ingresos': 2, 'expansion': 2, 'crecimiento': 2,
    'bueno': 1, 'bien': 1, 'positiva': 1, 'recuperacion': 1, 'repunte': 1,
    'estable': 1, 'confianza': 1, 'seguridad': 1, 'progreso': 1, 'desarrollo': 1,
  };

  private readonly NEGATIVE_WORDS_ES: Record<string, number> = {
    'baja': 3, 'colapso': 3, 'crash': 3, 'panico': 3, 'desastre': 3,
    'crisis': 3, 'quiebra': 3, 'desplome': 3, 'catastrofico': 3, 'caida': 3,
    'bajista': 3, 'bearish': 3, 'critico': 3, 'urgente': 3, 'riesgo': 3,
    'pierde': 2, 'fracaso': 2, 'declive': 2, 'rechazo': 2, 'pesimismo': 2,
    'negativo': 2, 'conflicto': 2, 'inseguridad': 2, 'incertidumbre': 2, 'problema': 2,
    'venta': 2, 'perdida': 2, 'amenaza': 2, 'debilidad': 2,
    'desventaja': 2, 'presion': 2, 'estres': 2, 'contraccion': 2, 'recesion': 2,
    'malo': 1, 'negativa': 1, 'disminucion': 1,
    'inestable': 1, 'duda': 1, 'inquietud': 1, 'retraso': 1, 'deterioro': 1,
  };

  // Modificadores de intensidad
  private readonly INTENSIFIERS_EN: Record<string, number> = {
    'very': 1.5, 'extremely': 2, 'massively': 2, 'dramatically': 2,
    'significantly': 1.5, 'considerably': 1.5, 'substantially': 1.5,
    'highly': 1.5, 'rapidly': 1.5,
  };

  private readonly INTENSIFIERS_ES: Record<string, number> = {
    'muy': 1.5, 'extremadamente': 2, 'masivamente': 2, 'drasticamente': 2,
    'significativamente': 1.5, 'considerablemente': 1.5, 'sustancialmente': 1.5,
  };

  // Negadores
  private readonly NEGATORS_EN = ['not', 'no', 'never', 'without', 'nothing', "n't"];
  private readonly NEGATORS_ES = ['no', 'ni', 'nunca', 'jamas', 'sin', 'nada'];

  /**
   * Normalizar texto: remover diacríticos y caracteres especiales
   * Convierte "crítico" → "critico", "pánico" → "panico"
   * Usa NFD (Canonical Decomposition) para separar diacríticos
   */
  private normalizeDiacritics(text: string): string {
    // NFD: descompone caracteres acentuados
    // Ejemplo: "á" → "a" + combining accent mark
    // Luego remove combining marks [\u0300-\u036f]
    // Finalmente remove non-word characters (punctuation, etc.)
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')  // Remove combining diacritical marks
      .replace(/[^\w]/g, '');            // Remove punctuation/special chars
  }

  /**
   * Detectar idioma del texto
   */
  private detectLanguage(text: string): 'en' | 'es' {
    const lowerText = text.toLowerCase();
    
    // Palabras clave de espanol
    const spanishWords = ['el', 'la', 'de', 'que', 'los', 'es', 'por', 'una', 'en', 'para', 'con', 'se', 'del', 'las'];
    const englishWords = ['the', 'and', 'is', 'of', 'a', 'in', 'to', 'be', 'that', 'have', 'for', 'with', 'from'];
    
    let spanishCount = 0;
    let englishCount = 0;
    
    spanishWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      spanishCount += (lowerText.match(regex) || []).length;
    });
    
    englishWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      englishCount += (lowerText.match(regex) || []).length;
    });
    
    if (spanishCount > englishCount && spanishCount > 3) return 'es';
    if (englishCount > spanishCount && englishCount > 3) return 'en';
    
    // Por defecto, assume ingles (es el mas comun en noticias financieras)
    return 'en';
  }

  /**
   * Traduccion basica de palabras clave del espanol al ingles
   */
  /**
   * Analizar sentimiento de un texto (multiidioma)
   */
  public analyzeSentiment(text: string): SentimentAnalysis {
    if (!text || text.length === 0) {
      return {
        score: 0,
        confidence: 0,
        sentiment: 'neutral',
        keywords: { positive: [], negative: [] },
        strength: 'weak',
        reasoning: 'Empty text',
        detectedLanguage: 'en'
      };
    }

    // ✅ Validación: Prevenir ReDoS - máximo 10000 caracteres
    if (text.length > 10000) {
      text = text.substring(0, 10000);
    }

    // Detectar idioma
    const language = this.detectLanguage(text);
    
    // Seleccionar diccionarios segun idioma
    let positiveWords = this.POSITIVE_WORDS_EN;
    let negativeWords = this.NEGATIVE_WORDS_EN;
    let intensifiers = this.INTENSIFIERS_EN;
    let negators = this.NEGATORS_EN;
    
    let processText = text.toLowerCase();
    
    if (language === 'es') {
      positiveWords = this.POSITIVE_WORDS_ES;
      negativeWords = this.NEGATIVE_WORDS_ES;
      intensifiers = this.INTENSIFIERS_ES;
      negators = this.NEGATORS_ES;
    }
    // Language is 'en' by default, no need for else branch

    const words = processText.split(/\s+/);

    let positiveScore = 0;
    let negativeScore = 0;
    const foundPositive: string[] = [];
    const foundNegative: string[] = [];

    // Analizar palabras
    for (let i = 0; i < words.length; i++) {
      const word = this.normalizeDiacritics(words[i]);
      
      // Buscar intensificadores
      let intensifier = 1;
      if (i > 0) {
        const prevWord = this.normalizeDiacritics(words[i - 1]);
        intensifier = intensifiers[prevWord] || 1;
      }

      // Buscar negadores
      let isNegated = false;
      if (i > 0) {
        const prevWord = this.normalizeDiacritics(words[i - 1]);
        isNegated = negators.includes(prevWord);
      }

      if (positiveWords[word]) {
        const value = positiveWords[word] * intensifier;
        if (isNegated) {
          negativeScore += value;
          foundNegative.push(word);
        } else {
          positiveScore += value;
          foundPositive.push(word);
        }
      } else if (negativeWords[word]) {
        const value = negativeWords[word] * intensifier;
        if (isNegated) {
          positiveScore += value;
          foundPositive.push(word);
        } else {
          negativeScore += value;
          foundNegative.push(word);
        }
      }
    }

    // Calcular score normalizado (-1 a 1)
    const totalScore = positiveScore + negativeScore;
    let normalizedScore = 0;
    if (totalScore > 0) {
      normalizedScore = (positiveScore - negativeScore) / totalScore;
      normalizedScore = Math.max(-1, Math.min(1, normalizedScore));
    }

    // Determinar confianza (0-100)
    const keywordCount = foundPositive.length + foundNegative.length;
    const confidence = Math.min(100, 20 + keywordCount * 10);

    // Determinar sentimiento
    let sentiment: 'positive' | 'neutral' | 'negative';
    if (normalizedScore > 0.1) sentiment = 'positive';
    else if (normalizedScore < -0.1) sentiment = 'negative';
    else sentiment = 'neutral';

    // Determinar fuerza
    const absScore = Math.abs(normalizedScore);
    let strength: 'strong' | 'moderate' | 'weak';
    if (absScore > 0.6) strength = 'strong';
    else if (absScore > 0.3) strength = 'moderate';
    else strength = 'weak';

    return {
      score: normalizedScore,
      confidence,
      sentiment,
      keywords: {
        positive: [...new Set(foundPositive)],
        negative: [...new Set(foundNegative)]
      },
      strength,
      reasoning: this.generateReasoning(normalizedScore, sentiment, keywordCount, language),
      detectedLanguage: language
    };
  }

  /**
   * Generar explicacion de por que tiene ese sentimiento
   */
  private generateReasoning(score: number, sentiment: string, keywordCount: number, language: string): string {
    if (keywordCount === 0) {
      return 'No keywords detected, classified as neutral';
    }

    const scoreDesc = sentiment === 'positive' ? 'positive' :
                      sentiment === 'negative' ? 'negative' : 'neutral';

    const intensityDesc = Math.abs(score) > 0.6 ? 'strong' :
                          Math.abs(score) > 0.3 ? 'moderate' : 'weak';

    const langPrefix = language === 'es' ? '[ES] ' : '';

    return `${langPrefix}${intensityDesc} ${scoreDesc} sentiment with ${keywordCount} keyword(s)`;
  }

  /**
   * Analizar multiples textos y combinar sentimientos
   */
  public analyzeCombined(texts: string[]): SentimentAnalysis {
    if (texts.length === 0) {
      return this.analyzeSentiment('');
    }

    const analyses = texts.map(text => this.analyzeSentiment(text));

    // Promediar scores
    const avgScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;
    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;

    // Combinar keywords
    const allPositive = analyses.flatMap(a => a.keywords.positive);
    const allNegative = analyses.flatMap(a => a.keywords.negative);
    const uniquePositive = [...new Set(allPositive)];
    const uniqueNegative = [...new Set(allNegative)];

    // Detectar idiomas encontrados
    const languages = [...new Set(analyses.map(a => a.detectedLanguage))];
    const detectedLanguage = languages.join('+');

    // Determinar sentimiento final
    let sentiment: 'positive' | 'neutral' | 'negative';
    if (avgScore > 0.1) sentiment = 'positive';
    else if (avgScore < -0.1) sentiment = 'negative';
    else sentiment = 'neutral';

    let strength: 'strong' | 'moderate' | 'weak';
    if (Math.abs(avgScore) > 0.6) strength = 'strong';
    else if (Math.abs(avgScore) > 0.3) strength = 'moderate';
    else strength = 'weak';

    return {
      score: avgScore,
      confidence: avgConfidence,
      sentiment,
      keywords: {
        positive: uniquePositive,
        negative: uniqueNegative
      },
      strength,
      reasoning: `Combined ${texts.length} texts [${detectedLanguage}]: ${sentiment} (score: ${avgScore.toFixed(2)})`,
      detectedLanguage
    };
  }

  /**
   * Calcular impacto potencial en precio
   */
  public calculatePriceImpact(sentiment: SentimentAnalysis): {
    expectedDirection: 'up' | 'down' | 'neutral';
    impactPercent: number;
    reliability: number;
  } {
    const { score, confidence, strength } = sentiment;

    // Impacto basado en fuerza
    let baseImpact = 0;
    if (strength === 'strong') baseImpact = Math.abs(score) * 0.05; // ±5%
    else if (strength === 'moderate') baseImpact = Math.abs(score) * 0.03; // ±3%
    else baseImpact = Math.abs(score) * 0.01; // ±1%

    const impactPercent = score > 0 ? baseImpact : -baseImpact;

    return {
      expectedDirection: score > 0 ? 'up' : score < 0 ? 'down' : 'neutral',
      impactPercent,
      reliability: confidence
    };
  }
}

export const newsSentimentService = new NewsSentimentService();
export default newsSentimentService;

