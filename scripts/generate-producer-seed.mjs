// Kertakäyttöinen skripti: lukee producers-seed-*.json-tiedostot ja tulostaa
// vastaavat SQL insert -lauseet producers-tauluun.
// Aja: node scripts/generate-producer-seed.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Sama logiikka kuin src/shared/normalizeText.ts — kopioitu Node-yhteensopivaksi,
// koska tämä skripti ei aja TS:n läpi.
function normalizeText(text) {
  return text
    .replace(/\u00df/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

const COUNTRY_MAP = {
  Italy: 'IT',
  France: 'FR',
  Spain: 'ES',
  Germany: 'DE',
}

// Piemonte/Toscana/Veneto/Lombardia/Campania/Umbria/Sicilia ovat samat
// suomenkieliset aluenimet joita src/shared/knownAppellations.ts jo käyttää
// olemassa oleville viineille. Muille alueille ei ole vakiintunutta
// suomennosta tässä koodikannassa, joten ne jätetään alkuperäiseen muotoon.
const REGION_MAP = {
  Piedmont: 'Piemonte',
  Tuscany: 'Toscana',
  Veneto: 'Veneto',
  Lombardy: 'Lombardia',
  Campania: 'Campania',
  Umbria: 'Umbria',
  Sicily: 'Sicilia',
  'Trentino-Alto Adige': 'Trentino-Alto Adige',
  'Friuli-Venezia Giulia': 'Friuli-Venezia Giulia',
  Lazio: 'Lazio',
  Sardinia: 'Sardinia',
  Marche: 'Marche',
  Bordeaux: 'Bordeaux',
  Burgundy: 'Bourgogne',
  Champagne: 'Champagne',
  Rhône: 'Rhône',
  Loire: 'Loire',
  Alsace: 'Alsace',
  Provence: 'Provence',
  Languedoc: 'Languedoc',
  Roussillon: 'Roussillon',
  Jura: 'Jura',
  'Ribera del Duero': 'Ribera del Duero',
  'Castilla y León': 'Castilla y León',
  Rioja: 'Rioja',
  Priorat: 'Priorat',
  Catalonia: 'Katalonia',
  Bierzo: 'Bierzo',
  'Sierra de Gredos': 'Sierra de Gredos',
  Madrid: 'Madrid',
  Méntrida: 'Méntrida',
  'Castilla-La Mancha': 'Castilla-La Mancha',
  Alicante: 'Alicante',
  Jumilla: 'Jumilla',
  Almansa: 'Almansa',
  Valencia: 'Valencia',
  Somontano: 'Somontano',
  Rueda: 'Rueda',
  Valdeorras: 'Valdeorras',
  Toro: 'Toro',
  'Rías Baixas': 'Rías Baixas',
  'Canary Islands': 'Kanariansaaret',
  Aragón: 'Aragón',
  'Campo de Borja': 'Campo de Borja',
  Mosel: 'Mosel',
  Rheingau: 'Rheingau',
  Rheinhessen: 'Rheinhessen',
  Pfalz: 'Pfalz',
  Franken: 'Franken',
  Nahe: 'Nahe',
  Baden: 'Baden',
  Württemberg: 'Württemberg',
  Ahr: 'Ahr',
}

function sqlString(value) {
  return `'${value.replace(/'/g, "''")}'`
}

function sqlStringArray(values) {
  if (values.length === 0) return "'{}'"
  const escaped = values.map((v) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
  return `'{${escaped.join(',')}}'`
}

function loadSeed(filename) {
  const inputPath = join(__dirname, '..', filename)
  return JSON.parse(readFileSync(inputPath, 'utf8'))
}

function generateInsert(producers, label) {
  const rows = producers.map((p) => {
    if (!(p.country in COUNTRY_MAP)) {
      throw new Error(`Tuntematon country: "${p.country}" (${p.name})`)
    }
    if (!(p.region in REGION_MAP)) {
      throw new Error(`Tuntematon region: "${p.region}" (${p.name})`)
    }
    const country = COUNTRY_MAP[p.country]
    const region = REGION_MAP[p.region]
    const normalizedName = normalizeText(p.name)
    return `  (${sqlString(p.name)}, ${sqlString(normalizedName)}, ${sqlStringArray(p.aliases)}, ${sqlString(country)}, ${sqlString(region)})`
  })

  console.error(`-- ${label}: ${producers.length} tuottajaa`)
  console.log(`-- ${label}`)
  console.log('insert into producers (name, normalized_name, aliases, country, region) values')
  console.log(rows.join(',\n') + ';')
  console.log()
}

const italy = loadSeed('producers-seed-italy.json')
const france = loadSeed('producers-seed-france.json')
const spain = loadSeed('producers-seed-spain.json')
const germany = loadSeed('producers-seed-germany.json')

// Varmistetaan ettei normalized_name törmää minkään maan sisällä eikä
// niiden välillä — unique-indeksi hylkäisi törmäyksen joka tapauksessa,
// mutta parempi saada selkeä virhe jo tässä. Italia, Ranska ja Espanja on
// jo ajettu tuotantoon aiemmilla kierroksilla, joten tarkistetaan Saksa
// niitäkin vasten, mutta tulostetaan vain uusi Saksa-insert.
const seen = new Map()
for (const p of [...italy, ...france, ...spain, ...germany]) {
  const normalized = normalizeText(p.name)
  if (seen.has(normalized)) {
    throw new Error(`Törmäävä normalized_name "${normalized}": "${seen.get(normalized)}" ja "${p.name}"`)
  }
  seen.set(normalized, p.name)
}

generateInsert(germany, 'Saksa')
