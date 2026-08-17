// School-year calendar for תשפ"ז (2026-27), Jewish/general-Hebrew official-education
// sector (kindergartens, elementary schools, middle schools).
//
// SOURCE: https://apps.education.gov.il/mankal/Hodaa.aspx?siduri=362
// Ministry of Education, חוזרי מנכ"ל (director-general circulars) — the Ministry's
// own primary publication channel, not a secondary aggregator.
// Notice: הודעה מס' 0363. Published: י"ב בניסן תשפ"ו, 30 במרץ 2026 (30 March 2026).
// Title (verbatim): "לוח החופשות והחגים בשנת הלימודים תשפ"ז בגני ילדים, בבתי ספר
// יסודיים, בחטיבות הביניים ובכל מוסדות החינוך הרשמי"
//
// Transcribed from a prior agent's verbatim-quoted acquisition report
// (.superpowers/sdd/data-acquisition-report.md), which pulled the raw HTML of
// the circular directly (no bot-detection challenge on that host). Every date
// below traces to a quoted Hebrew sentence in that report.
//
// STEP 4 (human fidelity check against the live circular) IS NOT DONE. This file
// has only passed automated internal-consistency checks (Step 3), not a human
// side-by-side read against the published page. Do not treat this file as
// verified until a human ticks the Step 4 checklist in task-8-brief.md.
//
// KNOWN SIMPLIFICATIONS / RESOLVED AMBIGUITIES (see task-8-report.md for full detail):
//
// 1. `terms.school` uses the elementary/גן end date (2027-06-30), not the middle/high
//    school end date. The circular gives THREE distinct end dates: גן ילדים and בית
//    ספר יסודי both end 2027-06-30 (Wed, כ"ה בסיון תשפ"ז); חטיבת ביניים / חטיבה עליונה
//    end 10 days earlier, 2027-06-20 (Sun, ט"ו בסיוון תשפ"ז). This schema only has a
//    single `school` bucket, and Machar targets families with young/elementary-age
//    children, so the elementary date was used. This means `terms.gan.end` and
//    `terms.school.end` are the SAME date here (both 2027-06-30) — they do NOT
//    "differ" the way the task brief's prose assumed. Middle/high school families
//    would see 10 days of false "open" days at the end of the year under this model.
//    A human should decide whether middle/high needs its own bucket before this
//    ships to families with middle/high-age children.
//
// 2. Two lines in the circular's own printed text give a "study day" note with what
//    is clearly the wrong year (2026 instead of 2027), given surrounding day-of-week,
//    Hebrew-date, and resumption-date context:
//      - "יום שני, 22.3.2026, י"ג באדר ב' תענית אסתר הוא יום לימודים" (should be 2027)
//      - "יום חמישי, 29.4.2026 כ"ב בניסן אסרו חג פסח הוא יום לימודים" (should be 2027)
//    Both are resolved to 2027 below (see taanit_esther short day, and the pesach
//    closure's stated resume date of 2027-04-29). This is a typo in the Ministry's
//    own published circular, not something silently corrected without a trace — flag
//    it during the human fidelity check.
//
// 3. The circular publishes an unnamed closure between Yom Kippur and Sukkot
//    (2026-09-22 to 2026-09-24), labeled in the source only as "ימי חופשה בין יום
//    הכיפורים לסוכות" (vacation days between Yom Kippur and Sukkot). The founder's
//    required closure-key list (rosh_hashana, yom_kippur, sukkot, hanukkah, purim,
//    pesach, yom_haatzmaut, shavuot) has no slot for it. Rather than silently folding
//    it into `yom_kippur.to` or `sukkot.from` (which would misattribute it to a
//    holiday it isn't and corrupt the display name shown to a parent), it is modeled
//    as its own closure below with key `kippur_sukkot_bridge`. This satisfies the
//    Step 2 test (which only requires the eight named keys to be a SUBSET of
//    `closures`, not the total) without misrepresenting the source.
//
// 4. `yom_hazikaron` (Memorial Day, 2027-05-11) short day is CONFIRMED for `school`
//    (explicit "בבתי הספר ... יסתיים ... בשעה 12:00" language). The source does not
//    restate "בבתי הספר" for this entry the way it does for the fast days, so gan
//    treatment is UNCERTAIN and NOT modeled — `levels: ['school']` only. A human
//    should confirm whether gan also has a shortened day.
//
// 5. Four "commemorative" days are explicitly marked by the source as regular study
//    days, not closures or short days, and are deliberately NOT included below:
//    חג הסיגד (2026-11-09), ט"ו בשבט (2027-01-23), ל"ג בעומר (2027-05-25), and
//    יום ירושלים (2027-06-04) — each with its own "הוא יום לימודים" quote in the
//    source.

import type { SchoolYear } from '../types'

export const SCHOOL_YEAR_2026_2027: SchoolYear = {
  label: 'תשפ"ז',
  terms: {
    // Both start Tue 2026-09-01 (י"ט באלול תשפ"ו). Elementary/gan share the same
    // end date; see caveat 1 above for why `school` does not use the middle/high date.
    gan: { start: '2026-09-01', end: '2027-06-30' },
    school: { start: '2026-09-01', end: '2027-06-30' },
  },
  closures: [
    {
      key: 'rosh_hashana',
      name: 'ראש השנה',
      from: '2026-09-11',
      to: '2026-09-13',
      levels: ['gan', 'school'],
    },
    {
      key: 'yom_kippur',
      name: 'יום כיפור',
      from: '2026-09-20',
      to: '2026-09-21',
      levels: ['gan', 'school'],
    },
    // See caveat 3 above: unnamed bridge closure between Yom Kippur and Sukkot,
    // its own row in the source with no key in the founder's required list.
    {
      key: 'kippur_sukkot_bridge',
      name: 'ימי חופשה בין יום הכיפורים לסוכות',
      from: '2026-09-22',
      to: '2026-09-24',
      levels: ['gan', 'school'],
    },
    {
      key: 'sukkot',
      name: 'סוכות',
      from: '2026-09-25',
      to: '2026-10-03',
      levels: ['gan', 'school'],
    },
    {
      key: 'hanukkah',
      name: 'חנוכה',
      from: '2026-12-06',
      to: '2026-12-12',
      levels: ['gan', 'school'],
    },
    {
      key: 'purim',
      name: 'פורים',
      from: '2027-03-23',
      to: '2027-03-24',
      levels: ['gan', 'school'],
    },
    {
      key: 'pesach',
      name: 'פסח',
      from: '2027-04-13',
      to: '2027-04-28',
      levels: ['gan', 'school'],
    },
    {
      key: 'yom_haatzmaut',
      name: 'יום העצמאות',
      from: '2027-05-12',
      to: '2027-05-12',
      levels: ['gan', 'school'],
    },
    {
      key: 'shavuot',
      name: 'שבועות',
      from: '2027-06-10',
      to: '2027-06-11',
      levels: ['gan', 'school'],
    },
  ],
  shortDays: [
    // Fast days: source states explicitly "בבתי הספר ... יסתיים יום הלימודים בשעה
    // 13:30" — school only, gan not mentioned in this note.
    {
      key: 'tzom_gedaliah',
      name: 'צום גדליה',
      date: '2026-09-14',
      levels: ['school'],
    },
    {
      key: 'asara_btevet',
      name: 'עשרה בטבת',
      date: '2026-12-20',
      levels: ['school'],
    },
    // Year resolved 2026 -> 2027 per caveat 2 above.
    {
      key: 'taanit_esther',
      name: 'תענית אסתר',
      date: '2027-03-22',
      levels: ['school'],
    },
    // Confirmed for school only; gan treatment UNCERTAIN per caveat 4 above.
    {
      key: 'yom_hazikaron',
      name: 'יום הזיכרון לחללי צה"ל',
      date: '2027-05-11',
      levels: ['school'],
    },
  ],
}
