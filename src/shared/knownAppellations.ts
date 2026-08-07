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
  { name: 'Barolo DOCG', country: 'Italia', region: 'Piemonte' },
  { name: 'Barbaresco DOCG', country: 'Italia', region: 'Piemonte' },
  { name: "Barbera d'Asti Superiore DOCG", country: 'Italia', region: 'Piemonte' },
  { name: "Barbera d'Asti DOCG", country: 'Italia', region: 'Piemonte' },
  { name: 'Nizza DOCG', country: 'Italia', region: 'Piemonte' },
  { name: 'Gavi DOCG', country: 'Italia', region: 'Piemonte' },
  { name: 'Brunello di Montalcino DOCG', country: 'Italia', region: 'Toscana' },
  { name: 'Chianti Classico DOCG', country: 'Italia', region: 'Toscana' },
  { name: 'Chianti DOCG', country: 'Italia', region: 'Toscana' },
  { name: 'Vino Nobile di Montepulciano DOCG', country: 'Italia', region: 'Toscana' },
  { name: 'Bolgheri DOC', country: 'Italia', region: 'Toscana' },
  { name: 'Amarone della Valpolicella DOCG', country: 'Italia', region: 'Veneto' },
  { name: 'Valpolicella DOC', country: 'Italia', region: 'Veneto' },
  { name: 'Soave DOCG', country: 'Italia', region: 'Veneto' },
  { name: 'Prosecco DOCG', country: 'Italia', region: 'Veneto' },
  { name: 'Franciacorta DOCG', country: 'Italia', region: 'Lombardia' },
  { name: 'Taurasi DOCG', country: 'Italia', region: 'Campania' },
  { name: 'Montefalco Sagrantino DOCG', country: 'Italia', region: 'Umbria' },
  { name: 'Etna DOC', country: 'Italia', region: 'Sicilia' },
  { name: 'Cerasuolo di Vittoria DOCG', country: 'Italia', region: 'Sicilia' },

  // Ranska
  { name: 'Champagne AOC', country: 'Ranska', region: 'Champagne' },
  { name: 'Chablis AOC', country: 'Ranska', region: 'Bourgogne' },
  { name: 'Meursault AOC', country: 'Ranska', region: 'Bourgogne' },
  { name: 'Puligny-Montrachet AOC', country: 'Ranska', region: 'Bourgogne' },
  { name: 'Vosne-Romanée AOC', country: 'Ranska', region: 'Bourgogne' },
  { name: 'Nuits-Saint-Georges AOC', country: 'Ranska', region: 'Bourgogne' },
  { name: 'Gevrey-Chambertin AOC', country: 'Ranska', region: 'Bourgogne' },
  { name: 'Margaux AOC', country: 'Ranska', region: 'Bordeaux' },
  { name: 'Saint-Julien AOC', country: 'Ranska', region: 'Bordeaux' },
  { name: 'Pauillac AOC', country: 'Ranska', region: 'Bordeaux' },
  { name: 'Saint-Émilion Grand Cru AOC', country: 'Ranska', region: 'Bordeaux' },
  { name: 'Pomerol AOC', country: 'Ranska', region: 'Bordeaux' },
  { name: 'Châteauneuf-du-Pape AOC', country: 'Ranska', region: 'Rhône' },
  { name: 'Côte-Rôtie AOC', country: 'Ranska', region: 'Rhône' },
  { name: 'Hermitage AOC', country: 'Ranska', region: 'Rhône' },
  { name: 'Sancerre AOC', country: 'Ranska', region: 'Loire' },
  { name: 'Pouilly-Fumé AOC', country: 'Ranska', region: 'Loire' },
  { name: 'Alsace AOC', country: 'Ranska', region: 'Alsace' },
  { name: 'Vouvray AOC', country: 'Ranska', region: 'Loire' },
  { name: 'Bandol AOC', country: 'Ranska', region: 'Provence' },

  // Espanja
  { name: 'Rioja DOCa', country: 'Espanja', region: 'Rioja' },
  { name: 'Ribera del Duero DO', country: 'Espanja', region: 'Castilla y León' },
  { name: 'Priorat DOQ', country: 'Espanja', region: 'Catalunya' },
  { name: 'Penedès DO', country: 'Espanja', region: 'Catalunya' },
  { name: 'Rías Baixas DO', country: 'Espanja', region: 'Galicia' },
  { name: 'Rueda DO', country: 'Espanja', region: 'Castilla y León' },
  { name: 'Jerez-Xérès-Sherry DO', country: 'Espanja', region: 'Andalucía' },
  { name: 'Toro DO', country: 'Espanja', region: 'Castilla y León' },
  { name: 'Bierzo DO', country: 'Espanja', region: 'Castilla y León' },
  { name: 'Cava DO', country: 'Espanja', region: 'Catalunya' },
  { name: 'Somontano DO', country: 'Espanja', region: 'Aragón' },
  { name: 'Navarra DO', country: 'Espanja', region: 'Navarra' },
  { name: 'Campo de Borja DO', country: 'Espanja', region: 'Aragón' },
  { name: 'Jumilla DO', country: 'Espanja', region: 'Murcia' },
  { name: 'Montsant DO', country: 'Espanja', region: 'Catalunya' },
  { name: 'Empordà DO', country: 'Espanja', region: 'Catalunya' },
  { name: 'Yecla DO', country: 'Espanja', region: 'Murcia' },
  { name: 'La Mancha DO', country: 'Espanja', region: 'Castilla-La Mancha' },
  { name: 'Valdepeñas DO', country: 'Espanja', region: 'Castilla-La Mancha' },

  // Saksa — nämä ovat Anbaugebiete (viinialueita), eivät appellaatioita
  // samassa mielessä kuin AOC/DOCG. Appellaatio-taso on eri rakenne, joten
  // name === region tässä tapauksessa.
  { name: 'Mosel', country: 'Saksa', region: 'Mosel' },
  { name: 'Rheingau', country: 'Saksa', region: 'Rheingau' },
  { name: 'Rheinhessen', country: 'Saksa', region: 'Rheinhessen' },
  { name: 'Pfalz', country: 'Saksa', region: 'Pfalz' },
  { name: 'Nahe', country: 'Saksa', region: 'Nahe' },
  { name: 'Baden', country: 'Saksa', region: 'Baden' },
  { name: 'Württemberg', country: 'Saksa', region: 'Württemberg' },
  { name: 'Franken', country: 'Saksa', region: 'Franken' },
  { name: 'Ahr', country: 'Saksa', region: 'Ahr' },
  { name: 'Mittelrhein', country: 'Saksa', region: 'Mittelrhein' },
  { name: 'Saale-Unstrut', country: 'Saksa', region: 'Saale-Unstrut' },
  { name: 'Sachsen', country: 'Saksa', region: 'Sachsen' },
  { name: 'Hessische Bergstraße', country: 'Saksa', region: 'Hessische Bergstraße' },
]
