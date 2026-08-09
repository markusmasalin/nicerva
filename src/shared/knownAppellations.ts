export type KnownAppellation = {
  name: string
  country: string
  region: string
}

// Käsin koottu lähtöpiste, ei virallinen täydellinen lista — tarkoituksella
// pieni ja korjattavissa/laajennettavissa myöhemmin sitä mukaa kun oikeita
// viinejä osuu kohdalle.
export const KNOWN_APPELLATIONS: KnownAppellation[] = [
  // Italia
  { name: 'Barolo DOCG', country: 'IT', region: 'Piemonte' },
  { name: 'Barbaresco DOCG', country: 'IT', region: 'Piemonte' },
  { name: "Barbera d'Asti Superiore DOCG", country: 'IT', region: 'Piemonte' },
  { name: "Barbera d'Asti DOCG", country: 'IT', region: 'Piemonte' },
  { name: 'Nizza DOCG', country: 'IT', region: 'Piemonte' },
  { name: 'Gavi DOCG', country: 'IT', region: 'Piemonte' },
  { name: 'Brunello di Montalcino DOCG', country: 'IT', region: 'Toscana' },
  { name: 'Chianti Classico DOCG', country: 'IT', region: 'Toscana' },
  { name: 'Chianti DOCG', country: 'IT', region: 'Toscana' },
  { name: 'Vino Nobile di Montepulciano DOCG', country: 'IT', region: 'Toscana' },
  { name: 'Bolgheri DOC', country: 'IT', region: 'Toscana' },
  { name: 'Amarone della Valpolicella DOCG', country: 'IT', region: 'Veneto' },
  { name: 'Valpolicella DOC', country: 'IT', region: 'Veneto' },
  { name: 'Soave DOCG', country: 'IT', region: 'Veneto' },
  { name: 'Prosecco DOCG', country: 'IT', region: 'Veneto' },
  { name: 'Franciacorta DOCG', country: 'IT', region: 'Lombardia' },
  { name: 'Taurasi DOCG', country: 'IT', region: 'Campania' },
  { name: 'Montefalco Sagrantino DOCG', country: 'IT', region: 'Umbria' },
  { name: 'Etna DOC', country: 'IT', region: 'Sicilia' },
  { name: 'Cerasuolo di Vittoria DOCG', country: 'IT', region: 'Sicilia' },

  // Ranska
  { name: 'Champagne AOC', country: 'FR', region: 'Champagne' },
  { name: 'Chablis AOC', country: 'FR', region: 'Bourgogne' },
  { name: 'Meursault AOC', country: 'FR', region: 'Bourgogne' },
  { name: 'Puligny-Montrachet AOC', country: 'FR', region: 'Bourgogne' },
  { name: 'Vosne-Romanée AOC', country: 'FR', region: 'Bourgogne' },
  { name: 'Nuits-Saint-Georges AOC', country: 'FR', region: 'Bourgogne' },
  { name: 'Gevrey-Chambertin AOC', country: 'FR', region: 'Bourgogne' },
  { name: 'Margaux AOC', country: 'FR', region: 'Bordeaux' },
  { name: 'Saint-Julien AOC', country: 'FR', region: 'Bordeaux' },
  { name: 'Pauillac AOC', country: 'FR', region: 'Bordeaux' },
  { name: 'Saint-Émilion Grand Cru AOC', country: 'FR', region: 'Bordeaux' },
  { name: 'Pomerol AOC', country: 'FR', region: 'Bordeaux' },
  { name: 'Châteauneuf-du-Pape AOC', country: 'FR', region: 'Rhône' },
  { name: 'Côte-Rôtie AOC', country: 'FR', region: 'Rhône' },
  { name: 'Hermitage AOC', country: 'FR', region: 'Rhône' },
  { name: 'Sancerre AOC', country: 'FR', region: 'Loire' },
  { name: 'Pouilly-Fumé AOC', country: 'FR', region: 'Loire' },
  { name: 'Alsace AOC', country: 'FR', region: 'Alsace' },
  { name: 'Vouvray AOC', country: 'FR', region: 'Loire' },
  { name: 'Bandol AOC', country: 'FR', region: 'Provence' },

  // Espanja
  { name: 'Rioja DOCa', country: 'ES', region: 'Rioja' },
  { name: 'Ribera del Duero DO', country: 'ES', region: 'Castilla y León' },
  { name: 'Priorat DOQ', country: 'ES', region: 'Catalunya' },
  { name: 'Penedès DO', country: 'ES', region: 'Catalunya' },
  { name: 'Rías Baixas DO', country: 'ES', region: 'Galicia' },
  { name: 'Rueda DO', country: 'ES', region: 'Castilla y León' },
  { name: 'Jerez-Xérès-Sherry DO', country: 'ES', region: 'Andalucía' },
  { name: 'Toro DO', country: 'ES', region: 'Castilla y León' },
  { name: 'Bierzo DO', country: 'ES', region: 'Castilla y León' },
  { name: 'Cava DO', country: 'ES', region: 'Catalunya' },
  { name: 'Somontano DO', country: 'ES', region: 'Aragón' },
  { name: 'Navarra DO', country: 'ES', region: 'Navarra' },
  { name: 'Campo de Borja DO', country: 'ES', region: 'Aragón' },
  { name: 'Jumilla DO', country: 'ES', region: 'Murcia' },
  { name: 'Montsant DO', country: 'ES', region: 'Catalunya' },
  { name: 'Empordà DO', country: 'ES', region: 'Catalunya' },
  { name: 'Yecla DO', country: 'ES', region: 'Murcia' },
  { name: 'La Mancha DO', country: 'ES', region: 'Castilla-La Mancha' },
  { name: 'Valdepeñas DO', country: 'ES', region: 'Castilla-La Mancha' },

  // Saksa — nämä ovat Anbaugebiete (viinialueita), eivät appellaatioita
  // samassa mielessä kuin AOC/DOCG. Appellaatio-taso on eri rakenne, joten
  // name === region tässä tapauksessa.
  { name: 'Mosel', country: 'DE', region: 'Mosel' },
  { name: 'Rheingau', country: 'DE', region: 'Rheingau' },
  { name: 'Rheinhessen', country: 'DE', region: 'Rheinhessen' },
  { name: 'Pfalz', country: 'DE', region: 'Pfalz' },
  { name: 'Nahe', country: 'DE', region: 'Nahe' },
  { name: 'Baden', country: 'DE', region: 'Baden' },
  { name: 'Württemberg', country: 'DE', region: 'Württemberg' },
  { name: 'Franken', country: 'DE', region: 'Franken' },
  { name: 'Ahr', country: 'DE', region: 'Ahr' },
  { name: 'Mittelrhein', country: 'DE', region: 'Mittelrhein' },
  { name: 'Saale-Unstrut', country: 'DE', region: 'Saale-Unstrut' },
  { name: 'Sachsen', country: 'DE', region: 'Sachsen' },
  { name: 'Hessische Bergstraße', country: 'DE', region: 'Hessische Bergstraße' },
]
