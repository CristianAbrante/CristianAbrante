// ---------------------------------------------------------------------------
// CV template (Typst + modern-cv).
//
// Single source of truth: resume.json at the repository root.
// Only entries with visibility containing "pdf" are rendered.
//
// Compile from the repository root:
//   typst compile cv/cv.typ cv/output/cv.pdf --root . --font-path cv/fonts
// Watch mode:
//   typst watch cv/cv.typ cv/output/cv.pdf --root . --font-path cv/fonts
// ---------------------------------------------------------------------------

// Vendored modern-cv 0.10.0 (cv/modern-cv/) with extra header parameters
// (name-size, profile-picture-size) not available upstream.
#import "modern-cv/lib.typ": *

// --- Data loading ----------------------------------------------------------

#let data = json("../resume.json")
#let basics = data.basics

// --- Helpers ---------------------------------------------------------------

// Keep only entries marked visible for the PDF target.
#let visible(items) = items.filter(item => item
  .at("visibility", default: ())
  .contains("pdf"))

#let months = (
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
)

// "2025-03-01" -> "March 2025"
#let format-date(date-str) = {
  if date-str == none or date-str == "" { return "" }
  let parts = date-str.split("-")
  months.at(int(parts.at(1)) - 1) + " " + parts.at(0)
}

// Date range of an entry; open-ended ranges render as "Present".
#let format-date-range(entry) = {
  let start = format-date(entry.at("startDate", default: none))
  let end-raw = entry.at("endDate", default: none)
  let end = if end-raw == none or end-raw == "" { "Present" } else {
    format-date(end-raw)
  }
  start + " - " + end
}

// Entry title with an optional inline logo (path relative to cv/, from the
// entry's "logo" field in resume.json).
#let entry-title(entry, title) = {
  let logo = entry.at("logo", default: none)
  if logo == none { title } else {
    box(
      baseline: 25%,
      clip: true,
      radius: 2pt,
      image(logo, height: 11pt),
    )
    h(5pt)
    title
  }
}

// Username for a given social network in basics.profiles, or none.
#let profile-username(network) = {
  let match = basics.profiles.find(p => p.network == network)
  if match == none { none } else { match.username }
}

// --- Document --------------------------------------------------------------

#show: resume.with(
  author: (
    firstname: basics.name.split(" ").at(0),
    lastname: basics.name.split(" ").slice(1).join(" "),
    positions: (basics.label,),
    email: basics.email,
    phone: basics.phone,
    homepage: basics.url,
    github: profile-username("GitHub"),
    linkedin: profile-username("LinkedIn"),
    address: basics.location.city + ", " + basics.location.region,
  ),
  profile-picture: image("picture.jpg"),
  profile-picture-size: 2.6cm,
  name-size: 22pt,
  accent-color: rgb("#15959F"),
  colored-headers: true,
  show-footer: false,
  font: "Source Sans 3",
  language: "en",
  paper-size: "a4",
  description: basics.name + " - " + basics.label,
  keywords: (basics.label,),
)

= Profile

#basics.summary

= Work Experience

#for job in visible(data.work) [
  #resume-entry(
    title: entry-title(job, job.position),
    location: job.at("location", default: ""),
    date: format-date-range(job),
    description: job.name,
    title-link: job.at("url", default: none),
  )

  #resume-item[
    #job.summary

    #let techs = job.at("technologies", default: ())
    #if techs.len() > 0 [
      *Technologies:* #techs.join(" · ")
    ]
  ]
]

= Education

#for edu in visible(data.education) [
  #resume-entry(
    title: entry-title(edu, edu.institution),
    location: {
      let score = edu.at("score", default: "")
      if score != "" { "Grade: " + score } else { "" }
    },
    date: format-date-range(edu),
    description: edu.studyType + " in " + edu.area,
    title-link: edu.at("url", default: none),
  )

  #resume-item[
    #edu.summary

    #let courses = edu.at("courses", default: ())
    #if courses.len() > 0 [
      *Subjects:* #courses.join(" · ")
    ]
  ]
]

= Awards

#for award in visible(data.awards) [
  #resume-entry(
    title: award.title,
    location: award.awarder,
    date: format-date(award.date),
    description: award.summary,
  )
]

= Skills

#for skill in visible(data.skills) [
  #resume-skill-item(skill.name, skill.keywords)
]

#for lang in visible(data.languages) [
  #resume-skill-item(lang.language, (lang.fluency,))
]
