// Vaimennetut, lipun väreihin viittaavat sävyt maittain. Avaimet ovat
// maan nimi pienellä ja trimmattuna (esim. "italia"). Lisää lisää maita
// samalla vaimennetulla logiikalla sitä mukaa kuin niitä tarvitaan.
export const COUNTRY_FLAG_COLORS: Record<string, [string, string, string]> = {
  italia: ['#8FA888', '#D9D3C4', '#B87A6E'],
  ranska: ['#8291A8', '#D9D3C4', '#B87A6E'],
  espanja: ['#B87A6E', '#D9C27A', '#B87A6E'],
}
