// Generates docs/fidelity-check-2026-2027.md from src/lib/calendar/data/2026-2027.ts:
// a dated, Hebrew-named, chronological checklist of every closure and short day,
// with the day of the week for each date, so the Ministry fidelity check (Task 8
// step 4) is a bounded side-by-side read against הודעה מס' 0363 instead of an
// unbounded one.
//
// It only reads the source of truth. It never ticks a box; the founder does that.
//
// Run: node scripts/printSchoolYear.mjs
import { readFile, writeFile } from 'node:fs/promises'

const SRC = new URL('../src/lib/calendar/data/2026-2027.ts', import.meta.url)
const OUT = new URL('../docs/fidelity-check-2026-2027.md', import.meta.url)

// Same literal extraction as scripts/exportSchoolYear.mjs, kept self-contained so
// the checklist generator cannot break the iOS bundle generator.
const ts = await readFile(SRC, 'utf8')
const start = ts.indexOf('{', ts.indexOf('export const SCHOOL_YEAR_2026_2027'))
if (start === -1) throw new Error('printSchoolYear: could not find the object literal')

const literal = ts
  .slice(start)
  .replace(/^\s*\/\/.*$/gm, '')
  .trimEnd()
  .replace(/;?\s*$/, '')

const year = new Function(`return (${literal})`)()

if (!Array.isArray(year.closures) || year.closures.length === 0) {
  throw new Error('printSchoolYear: closures did not parse')
}

const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

/** ISO `YYYY-MM-DD` -> the Hebrew weekday name. UTC only: these are civil dates. */
function weekday(iso) {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay()
  const name = WEEKDAYS[day]
  if (!name) throw new Error(`printSchoolYear: not a real date: ${iso}`)
  return name
}

/** `2026-09-14` -> `14.09.2026`, the format the circular itself prints. */
function ddmmyyyy(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

/** `2026-09-14` -> `14.09.2026 (שני)`. */
function stamp(iso) {
  return `${ddmmyyyy(iso)} (${weekday(iso)})`
}

const LEVEL_NAMES = { gan: 'גן', school: 'בית ספר' }

function levels(list) {
  return list.map((level) => LEVEL_NAMES[level] ?? level).join(' + ')
}

/** Inclusive calendar days between two ISO dates. */
function dayCount(from, to) {
  const ms = new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)
  return ms / 86_400_000 + 1
}

const rows = [
  ...year.closures.map((c) => ({
    sort: c.from,
    kind: 'חופשה',
    line:
      c.from === c.to
        ? `**${c.name}** \`${c.key}\` — ${stamp(c.from)} — יום אחד — ${levels(c.levels)}`
        : `**${c.name}** \`${c.key}\` — ${stamp(c.from)} עד ${stamp(c.to)} — ` +
          `${dayCount(c.from, c.to)} ימים — ${levels(c.levels)}`,
  })),
  ...year.shortDays.map((s) => ({
    sort: s.date,
    kind: 'יום קצר',
    line: `**${s.name}** \`${s.key}\` — ${stamp(s.date)} — ${levels(s.levels)}`,
  })),
].sort((a, b) => (a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0))

const closedDays = year.closures.reduce((total, c) => total + dayCount(c.from, c.to), 0)

// The four caveats recorded in the header of src/lib/calendar/data/2026-2027.ts.
// Each one is a question only a human reading the circular can close.
const CAVEATS = [
  '**תאריך סיום חטיבת ביניים / חטיבה עליונה.** המחזור מפרסם שלושה תאריכי סיום: ' +
    'גן ילדים ובית ספר יסודי מסיימים 30.06.2027 (כ"ה בסיון תשפ"ז), חטיבת ביניים ' +
    'וחטיבה עליונה מסיימים עשרה ימים קודם, 20.06.2027 (ט"ו בסיוון תשפ"ז). לסכימה ' +
    'יש דלי `school` אחד בלבד והוא מכיל את תאריך היסודי. משפחה עם ילד בחטיבה תראה ' +
    'עשרה ימי לימודים שגויים בסוף השנה. לאשר את שלושת התאריכים ולהחליט אם חטיבה ' +
    'צריכה דלי משלה.',
  '**שתי שגיאות שנה בטקסט המודפס של החוזר עצמו.** שתי שורות "יום לימודים" נושאות ' +
    'שנה שגויה (2026 במקום 2027) לפי יום השבוע, התאריך העברי ותאריך החזרה שסביבן: ' +
    '"יום שני, 22.3.2026, י"ג באדר ב\' תענית אסתר הוא יום לימודים" ו-"יום חמישי, ' +
    '29.4.2026 כ"ב בניסן אסרו חג פסח הוא יום לימודים". שתיהן נפתרו כאן ל-2027. ' +
    'לאמת מול החוזר ששתי השורות אכן כתובות כך, ושהפתרון ל-2027 נכון.',
  '**סגירה ללא שם בין יום הכיפורים לסוכות (22.09.2026 עד 24.09.2026).** החוזר מסמן ' +
    'אותה רק כ"ימי חופשה בין יום הכיפורים לסוכות". היא נשמרת כאן כרשומה נפרדת ' +
    'במפתח `kippur_sukkot_bridge` ולא מקופלת לתוך `yom_kippur` או `sukkot`, כדי ' +
    'שהשם שההורה רואה לא ייוחס לחג הלא נכון. לאמת את שלושת התאריכים.',
  '**יום הזיכרון לחללי צה"ל (11.05.2027) בגן.** יום קצר מאושר לבית ספר בלשון מפורשת ' +
    '("בבתי הספר ... יסתיים ... בשעה 12:00"). החוזר אינו חוזר על "בבתי הספר" ברשומה ' +
    'הזו כפי שהוא עושה בצומות, ולכן הטיפול בגן אינו ודאי ואינו ממודל: ' +
    '`levels: [\'school\']` בלבד. לאשר אם גם בגן היום מתקצר.',
]

// Caveat 5 in the same header: days the source explicitly calls study days, so
// their ABSENCE from the data above is itself a claim worth checking.
const EXCLUDED = [
  ['חג הסיגד', '2026-11-09'],
  ['ט"ו בשבט', '2027-01-23'],
  ['ל"ג בעומר', '2027-05-25'],
  ['יום ירושלים', '2027-06-04'],
]

const doc = `# בדיקת נאמנות: לוח שנת הלימודים ${year.label} (2026-27)

<!-- GENERATED FILE. Do not hand-edit the rows: run \`node scripts/printSchoolYear.mjs\`
     to regenerate them from src/lib/calendar/data/2026-2027.ts. Tick marks you add
     are lost on regeneration, so tick once and do not rerun without re-checking. -->

זהו שלב 4 של משימה 8: קריאה אנושית של הנתונים מול המקור. עד שכל התיבות כאן
מסומנות, האפליקציה לא יוצאת מהמשפחה של המייסד.

**המקור:** משרד החינוך, חוזרי מנכ"ל, הודעה מס' 0363, פורסמה י"ב בניסן תשפ"ו,
30 במרץ 2026.
<https://apps.education.gov.il/mankal/Hodaa.aspx?siduri=362>

**איך עובדים עם הקובץ:** פותחים את החוזר לצד הרשימה הזו ועוברים שורה־שורה.
מסמנים תיבה רק אחרי שראיתם את התאריך בחוזר עצמו. שורה שלא מסתדרת: לא לתקן כאן,
לתקן ב-\`src/lib/calendar/data/2026-2027.ts\` ואז להריץ
\`node scripts/exportSchoolYear.mjs\` ו-\`node scripts/printSchoolYear.mjs\`.

**היקף:** ${year.closures.length} סגירות (${closedDays} ימי לוח), ${year.shortDays.length} ימים קצרים.

## תאריכי פתיחה וסיום

- [ ] גן: ${stamp(year.terms.gan.start)} עד ${stamp(year.terms.gan.end)}
- [ ] בית ספר: ${stamp(year.terms.school.start)} עד ${stamp(year.terms.school.end)}

## סגירות וימים קצרים, לפי סדר כרונולוגי

${rows.map((r) => `- [ ] ${r.kind} · ${r.line}`).join('\n')}

## הסתייגויות שרשומות בקובץ הנתונים וממתינות להכרעה אנושית

${CAVEATS.map((c) => `- [ ] ${c}`).join('\n\n')}

## ימים שהוצאו מהנתונים בכוונה

החוזר מציין במפורש שכל אחד מאלה הוא יום לימודים רגיל, ולכן הוא לא מופיע למעלה.
ההיעדר עצמו הוא טענה על המקור, ולכן הוא נבדק כמו כל שורה אחרת.

${EXCLUDED.map(([name, iso]) => `- [ ] **${name}** — ${stamp(iso)} — יום לימודים, לא סגירה ולא יום קצר`).join('\n')}

## חתימה

- [ ] כל השורות למעלה נבדקו מול הודעה מס' 0363.
- תאריך הבדיקה: \`____-__-__\`
- נבדק על ידי: \`__________\`

עד שהשורה הזו מסומנת, \`docs/agent-os/project-context.md\` כלל 4 בתוקף: הנתונים
אינם מאומתים.
`

await writeFile(OUT, doc, 'utf8')
console.log(
  `printSchoolYear: wrote ${rows.length} checklist rows ` +
    `(${year.closures.length} closures over ${closedDays} calendar days, ` +
    `${year.shortDays.length} short days) to docs/fidelity-check-2026-2027.md`,
)
