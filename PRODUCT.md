# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Inferred from the repository; confirm with the product owner:** FK Olaine players and families, local supporters, and people considering joining the club use the public site to find team, coach, training, match, and club news information. Club staff use its protected admin area to maintain that information.

## Product Purpose

**Inferred from the repository; confirm with the product owner:** The site is the official online home for FK Olaine, a football club in Olaine. It helps people follow club activity and find practical information about teams, training, fixtures, and news. The repository describes the club as founded in 2008.

## Positioning

Not established by the repository. Do not invent a differentiating claim until confirmed by the product owner.

## Operating Context

**Inferred from the repository:** Public information is presented in Latvian. Visitors browse club information, teams and players, coaches, match schedules and results, training schedules, news, polls, and contact details. Club staff maintain content through a password-protected admin interface. Some fixture and standings information is imported from Latvijas Futbola federācija (LFF) sources and reviewed by an administrator.

## Capabilities and Constraints

**Confirmed by the repository:** The web app includes public team, coach, news, club-page, match, and training pages; search; a combined calendar; polls; and an admin area for managing club content. It uses a Next.js web application and a SQLite-compatible database. Fixture synchronization from LFF is supported, with changed match times or venues surfaced for administrator review.

**Open product decisions:** The primary audience, club's intended differentiator, official language policy, and any required accessibility standard have not been confirmed by the product owner.

## Brand Commitments

**Inferred from existing repository content; confirm with the product owner:** Use the name FK Olaine and the existing club crest. Current site content is in Latvian and the repository contains club partner and federation marks. No additional voice or identity rules were supplied.

## Evidence on Hand

The repository includes the FK Olaine crest (`public/fk-olaine-crest-v2.png`), stadium imagery (`public/stadions.jpg`), player and coach imagery, and partner/federation marks under `public/partners/`. The app contains club-managed news, team, coach, fixture, and training content. No verified testimonials, audience research, performance claims, or case studies were identified; do not fabricate them.

## Product Principles

**Inferred from current capabilities; confirm with the product owner:**

- Make current club schedules and match information easy to find.
- Keep information useful across the club's different teams and age groups.
- Make official club updates and contact information accessible to the local community.
- Preserve administrator review where imported federation data differs from saved information.
