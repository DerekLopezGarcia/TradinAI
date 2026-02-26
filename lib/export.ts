// Utilidad para exportar análisis a diferentes formatos

import { Analysis } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Genera un reporte en formato texto
 */
export function generateTextReport(analysis: Analysis): string {
  const date = format(new Date(analysis.timestamp), 'dd/MM/yyyy HH:mm', { locale: es });

  return `
╔════════════════════════════════════════════════════════════════╗
║             ANÁLISIS TÉCNICO - TRADING IA                      ║
╚════════════════════════════════════════════════════════════════╝

Activo: ${analysis.symbol}
Timeframe: ${analysis.timeframe.toUpperCase()}
Fecha: ${date}

────────────────────────────────────────────────────────────────

TENDENCIA: ${analysis.trend.toUpperCase()}
Confianza: ${analysis.confidence}%

────────────────────────────────────────────────────────────────

ANÁLISIS:
${analysis.analysis}

────────────────────────────────────────────────────────────────

RECOMENDACIÓN:
${analysis.recommendation}

────────────────────────────────────────────────────────────────

NIVELES TÉCNICOS:
Soporte: $${analysis.support.toFixed(2)}
Resistencia: $${analysis.resistance.toFixed(2)}

────────────────────────────────────────────────────────────────

Generado por TradingIA - Análisis Automático con IA
`;
}

/**
 * Genera un reporte en formato CSV
 */
export function generateCSVReport(analyses: Analysis[]): string {
  const headers = ['Activo', 'Timeframe', 'Fecha', 'Tendencia', 'Confianza', 'Soporte', 'Resistencia'];
  const rows = analyses.map((a) => [
    a.symbol,
    a.timeframe,
    format(new Date(a.timestamp), 'dd/MM/yyyy HH:mm'),
    a.trend,
    a.confidence,
    a.support,
    a.resistance,
  ]);

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  return csv;
}

/**
 * Genera un reporte en formato JSON
 */
export function generateJSONReport(analyses: Analysis[]): string {
  return JSON.stringify(analyses, null, 2);
}

/**
 * Exporta datos a un archivo
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const element = document.createElement('a');
  element.setAttribute('href', `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';

  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Exporta análisis a archivo de texto
 */
export function exportAnalysisAsText(analysis: Analysis) {
  const content = generateTextReport(analysis);
  const filename = `analisis_${analysis.symbol}_${format(new Date(), 'dd-MM-yyyy-HHmm')}.txt`;
  downloadFile(content, filename);
}

/**
 * Exporta análisis múltiples a CSV
 */
export function exportAnalysisAsCSV(analyses: Analysis[]) {
  const content = generateCSVReport(analyses);
  const filename = `analisis_${format(new Date(), 'dd-MM-yyyy-HHmm')}.csv`;
  downloadFile(content, filename, 'text/csv');
}

/**
 * Exporta análisis a JSON
 */
export function exportAnalysisAsJSON(analyses: Analysis[]) {
  const content = generateJSONReport(analyses);
  const filename = `analisis_${format(new Date(), 'dd-MM-yyyy-HHmm')}.json`;
  downloadFile(content, filename, 'application/json');
}

/**
 * Captura un gráfico como imagen
 */
export async function captureChartAsImage(elementId: string, filename: string) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Elemento con ID ${elementId} no encontrado`);
    }

    // Aquí se usaría html2canvas o similar en una implementación real
    console.log(`Capturando gráfico: ${elementId}`);
  } catch (error) {
    console.error('Error capturando gráfico:', error);
    throw error;
  }
}

/**
 * Imprime el análisis
 */
export function printAnalysis(analysis: Analysis) {
  const content = generateTextReport(analysis);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`<pre style="font-family: monospace;">${content}</pre>`);
    printWindow.document.close();
    printWindow.print();
  }
}

/**
 * Copia análisis al portapapeles
 */
export async function copyAnalysisToClipboard(analysis: Analysis) {
  const content = generateTextReport(analysis);
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    console.error('Error copiando al portapapeles:', error);
    return false;
  }
}

