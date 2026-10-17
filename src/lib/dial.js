/* Country dialling codes for the contact form.

   Keyed by ISO code rather than by dial code, because dial codes are not
   unique — +1 is the United States, Canada and a dozen others, and a
   select keyed on the code alone cannot tell them apart or remember
   which one was chosen.

   Not the full ITU list. A select with 240 entries is worse to use than
   one with sixty, and the ones here cover where anyone reading a CV is
   realistically writing from. Sorted by name, so the list is scannable;
   the United Kingdom is the default rather than the first entry.

   `eg` is how a mobile number is written in that country, national part
   only, and it is shown as the field's placeholder. It is a shape to
   copy, not a real number — a placeholder holding someone's actual
   number is a mistake waiting to be made. */

export const DIAL = [
  { iso: 'AR', code: '+54', name: 'Argentina', eg: '11 2345-6789' },
  { iso: 'AU', code: '+61', name: 'Australia', eg: '412 345 678' },
  { iso: 'AT', code: '+43', name: 'Austria', eg: '664 123456' },
  { iso: 'BH', code: '+973', name: 'Bahrain', eg: '3600 1234' },
  { iso: 'BD', code: '+880', name: 'Bangladesh', eg: '1812 345678' },
  { iso: 'BE', code: '+32', name: 'Belgium', eg: '470 12 34 56' },
  { iso: 'BR', code: '+55', name: 'Brazil', eg: '11 91234-5678' },
  { iso: 'BG', code: '+359', name: 'Bulgaria', eg: '48 123 456' },
  { iso: 'CA', code: '+1', name: 'Canada', eg: '(204) 234-5678' },
  { iso: 'CL', code: '+56', name: 'Chile', eg: '9 6123 4567' },
  { iso: 'CN', code: '+86', name: 'China', eg: '131 2345 6789' },
  { iso: 'CO', code: '+57', name: 'Colombia', eg: '321 1234567' },
  { iso: 'HR', code: '+385', name: 'Croatia', eg: '91 234 5678' },
  { iso: 'CY', code: '+357', name: 'Cyprus', eg: '96 123456' },
  { iso: 'CZ', code: '+420', name: 'Czechia', eg: '601 123 456' },
  { iso: 'DK', code: '+45', name: 'Denmark', eg: '32 12 34 56' },
  { iso: 'EG', code: '+20', name: 'Egypt', eg: '100 123 4567' },
  { iso: 'EE', code: '+372', name: 'Estonia', eg: '5123 4567' },
  { iso: 'FI', code: '+358', name: 'Finland', eg: '41 2345678' },
  { iso: 'FR', code: '+33', name: 'France', eg: '6 12 34 56 78' },
  { iso: 'DE', code: '+49', name: 'Germany', eg: '1512 3456789' },
  { iso: 'GH', code: '+233', name: 'Ghana', eg: '23 123 4567' },
  { iso: 'GR', code: '+30', name: 'Greece', eg: '691 234 5678' },
  { iso: 'HK', code: '+852', name: 'Hong Kong', eg: '5123 4567' },
  { iso: 'HU', code: '+36', name: 'Hungary', eg: '20 123 4567' },
  { iso: 'IS', code: '+354', name: 'Iceland', eg: '611 1234' },
  { iso: 'IN', code: '+91', name: 'India', eg: '81234 56789' },
  { iso: 'ID', code: '+62', name: 'Indonesia', eg: '812 345 678' },
  { iso: 'IE', code: '+353', name: 'Ireland', eg: '85 012 3456' },
  { iso: 'IL', code: '+972', name: 'Israel', eg: '50 123 4567' },
  { iso: 'IT', code: '+39', name: 'Italy', eg: '312 345 6789' },
  { iso: 'JP', code: '+81', name: 'Japan', eg: '90 1234 5678' },
  { iso: 'JO', code: '+962', name: 'Jordan', eg: '7 9012 3456' },
  { iso: 'KE', code: '+254', name: 'Kenya', eg: '712 123456' },
  { iso: 'KW', code: '+965', name: 'Kuwait', eg: '500 12345' },
  { iso: 'LV', code: '+371', name: 'Latvia', eg: '21 234 567' },
  { iso: 'LB', code: '+961', name: 'Lebanon', eg: '71 123 456' },
  { iso: 'LT', code: '+370', name: 'Lithuania', eg: '612 34567' },
  { iso: 'LU', code: '+352', name: 'Luxembourg', eg: '628 123 456' },
  { iso: 'MY', code: '+60', name: 'Malaysia', eg: '12 345 6789' },
  { iso: 'MT', code: '+356', name: 'Malta', eg: '9696 1234' },
  { iso: 'MX', code: '+52', name: 'Mexico', eg: '55 1234 5678' },
  { iso: 'MA', code: '+212', name: 'Morocco', eg: '650 123456' },
  { iso: 'NL', code: '+31', name: 'Netherlands', eg: '6 12345678' },
  { iso: 'NZ', code: '+64', name: 'New Zealand', eg: '21 123 4567' },
  { iso: 'NG', code: '+234', name: 'Nigeria', eg: '802 123 4567' },
  { iso: 'NO', code: '+47', name: 'Norway', eg: '406 12 345' },
  { iso: 'OM', code: '+968', name: 'Oman', eg: '9212 3456' },
  { iso: 'PK', code: '+92', name: 'Pakistan', eg: '301 2345678' },
  { iso: 'PH', code: '+63', name: 'Philippines', eg: '905 123 4567' },
  { iso: 'PL', code: '+48', name: 'Poland', eg: '512 345 678' },
  { iso: 'PT', code: '+351', name: 'Portugal', eg: '912 345 678' },
  { iso: 'QA', code: '+974', name: 'Qatar', eg: '3312 3456' },
  { iso: 'RO', code: '+40', name: 'Romania', eg: '712 345 678' },
  { iso: 'SA', code: '+966', name: 'Saudi Arabia', eg: '51 234 5678' },
  { iso: 'RS', code: '+381', name: 'Serbia', eg: '60 1234567' },
  { iso: 'SG', code: '+65', name: 'Singapore', eg: '8123 4567' },
  { iso: 'SK', code: '+421', name: 'Slovakia', eg: '912 123 456' },
  { iso: 'SI', code: '+386', name: 'Slovenia', eg: '31 234 567' },
  { iso: 'ZA', code: '+27', name: 'South Africa', eg: '71 123 4567' },
  { iso: 'KR', code: '+82', name: 'South Korea', eg: '10 1234 5678' },
  { iso: 'ES', code: '+34', name: 'Spain', eg: '612 34 56 78' },
  { iso: 'LK', code: '+94', name: 'Sri Lanka', eg: '71 234 5678' },
  { iso: 'SE', code: '+46', name: 'Sweden', eg: '70 123 45 67' },
  { iso: 'CH', code: '+41', name: 'Switzerland', eg: '78 123 45 67' },
  { iso: 'TW', code: '+886', name: 'Taiwan', eg: '912 345 678' },
  { iso: 'TH', code: '+66', name: 'Thailand', eg: '81 234 5678' },
  { iso: 'TN', code: '+216', name: 'Tunisia', eg: '20 123 456' },
  { iso: 'TR', code: '+90', name: 'Türkiye', eg: '501 234 56 78' },
  { iso: 'UA', code: '+380', name: 'Ukraine', eg: '50 123 4567' },
  { iso: 'AE', code: '+971', name: 'United Arab Emirates', eg: '50 123 4567' },
  { iso: 'GB', code: '+44', name: 'United Kingdom', eg: '7400 123456' },
  { iso: 'US', code: '+1', name: 'United States', eg: '(201) 555-0123' },
  { iso: 'VN', code: '+84', name: 'Vietnam', eg: '91 234 56 78' },
]

export const DEFAULT_ISO = 'GB'

const find = (iso) => DIAL.find((c) => c.iso === iso)

export const codeFor = (iso) => find(iso)?.code ?? ''
export const exampleFor = (iso) => find(iso)?.eg ?? '123 456 789'

/* The number as it will actually arrive.

   Most countries write a trunk prefix — a leading 0 — that is dropped
   once a country code is in front of it, so someone typing their number
   the way they say it out loud produces +44 07402… which does not dial.
   Dropping it is the right call, and the assembled number is shown back
   under the field so the correction is visible rather than silent. */
export function assemble(iso, typed) {
  const digits = String(typed ?? '').trim()
  if (!digits) return ''
  const national = digits.replace(/^0+/, '').trim()
  if (!national) return ''
  return `${codeFor(iso)} ${national}`.trim()
}

/* Deliberately loose. Numbers run from seven digits to fifteen, people
   write them with spaces, dashes and brackets, and a form that rejects a
   real number because it did not match a pattern is worse than one that
   accepts a typo — the number is optional here in the first place. */
export function phoneLooksOff(typed) {
  const raw = String(typed ?? '').trim()
  if (!raw) return null
  if (/[^\d\s()+.-]/.test(raw)) return 'Numbers only — digits, spaces and dashes.'
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 6) return 'That looks too short for a phone number.'
  if (digits.length > 15) return 'That looks too long for a phone number.'
  return null
}
