// Koko sovelluksen sävy määritellään tässä yhdessä paikassa.
export const COLORS = {
  bg: '#F5EEE3',
  text: '#1F1E1B',
  textMuted: '#8A867C',
  // Vaalennettu bg (#F5EEE3) jättäisi alkuperäisen line-sävyn (#E4E1D8)
  // liian lähelle taustaa — tummennettu hieman erottuvuuden säilyttämiseksi.
  line: '#D9D3C4',
  textVintage: '#5C584F',
  textPrice: '#A6A296',
  // Sama sävy jota WINE_TYPE_COLORS.red käyttää — yhteinen viite muualla
  // käytettäväksi (esim. tähtiarvostelut, valitut tagit).
  wineRed: '#6E4247',
}
