import { relations } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at").notNull(),
});

export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  birthdate: text("birthdate").notNull(),
  photoUrl: text("photo_url"),
  createdAt: integer("created_at").notNull(),
});

export const playerTeams = sqliteTable(
  "player_teams",
  {
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.playerId, table.teamId] })],
);

export const coaches = sqliteTable("coaches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  position: text("position").notNull(),
  license: text("license").notNull(),
  authority: text("authority", { enum: ["UEFA", "LFF"] }).notNull(),
  photoUrl: text("photo_url"),
  createdAt: integer("created_at").notNull(),
});

export const coachTeams = sqliteTable(
  "coach_teams",
  {
    coachId: integer("coach_id")
      .notNull()
      .references(() => coaches.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.coachId, table.teamId] })],
);

export const trainings = sqliteTable("trainings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // "YYYY-MM-DD"
  startTime: text("start_time").notNull(), // "HH:MM"
  endTime: text("end_time").notNull(), // "HH:MM"
  location: text("location").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id").references(() => teams.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
});

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location").notNull(),
  notes: text("notes"),
  source: text("source", { enum: ["manual", "lff"] }).notNull().default("manual"),
  league: text("league"),
  createdAt: integer("created_at").notNull(),
});

export const leagueSources = sqliteTable("league_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
  /** The same competition's standings-table page (a different tab of the
   *  same LFF competition). Optional — a source with none set never shows
   *  up in the homepage league table. */
  standingsUrl: text("standings_url"),
  /** Lower shows first in the homepage league tabs. */
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  playerTeams: many(playerTeams),
  coachTeams: many(coachTeams),
  trainings: many(trainings),
  events: many(events),
  games: many(games),
  leagueSources: many(leagueSources),
  articles: many(articles),
}));

export const playersRelations = relations(players, ({ many }) => ({
  playerTeams: many(playerTeams),
}));

export const playerTeamsRelations = relations(playerTeams, ({ one }) => ({
  player: one(players, { fields: [playerTeams.playerId], references: [players.id] }),
  team: one(teams, { fields: [playerTeams.teamId], references: [teams.id] }),
}));

export const coachesRelations = relations(coaches, ({ many }) => ({
  coachTeams: many(coachTeams),
}));

export const coachTeamsRelations = relations(coachTeams, ({ one }) => ({
  coach: one(coaches, { fields: [coachTeams.coachId], references: [coaches.id] }),
  team: one(teams, { fields: [coachTeams.teamId], references: [teams.id] }),
}));

export const leagueSourcesRelations = relations(leagueSources, ({ one }) => ({
  team: one(teams, { fields: [leagueSources.teamId], references: [teams.id] }),
}));

export const clubLogos = sqliteTable("club_logos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logoUrl: text("logo_url").notNull(),
  createdAt: integer("created_at").notNull(),
});

/** One logo can be known by several exact-match names — the same club
 *  often appears spelled differently across competitions/seasons. */
export const clubLogoNames = sqliteTable("club_logo_names", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clubLogoId: integer("club_logo_id")
    .notNull()
    .references(() => clubLogos.id, { onDelete: "cascade" }),
  name: text("name").notNull().unique(),
});

export const clubLogosRelations = relations(clubLogos, ({ many }) => ({
  names: many(clubLogoNames),
}));

export const clubLogoNamesRelations = relations(clubLogoNames, ({ one }) => ({
  clubLogo: one(clubLogos, { fields: [clubLogoNames.clubLogoId], references: [clubLogos.id] }),
}));

export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  date: text("date").notNull(), // "YYYY-MM-DD"
  category: text("category", {
    enum: ["Klubs", "Komandas", "Spēles", "Treniņi", "Pasākumi"],
  }).notNull(),
  teamId: integer("team_id").references(() => teams.id, { onDelete: "set null" }),
  image: text("image").notNull(),
  authorCoachId: integer("author_coach_id").references(() => coaches.id, { onDelete: "set null" }),
  // Paragraphs, one per line.
  body: text("body").notNull(),
  quoteText: text("quote_text"),
  quoteAuthor: text("quote_author"),
  quoteRole: text("quote_role"),
  // Highlight image URLs, one per line.
  highlights: text("highlights"),
  createdAt: integer("created_at").notNull(),
});

export const articlesRelations = relations(articles, ({ one }) => ({
  team: one(teams, { fields: [articles.teamId], references: [teams.id] }),
  authorCoach: one(coaches, { fields: [articles.authorCoachId], references: [coaches.id] }),
}));

export const partners = sqliteTable("partners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  logoUrl: text("logo_url").notNull(),
  logoWidth: integer("logo_width").notNull(),
  logoHeight: integer("logo_height").notNull(),
  /** Display height bucket in the partners bar/marquee. */
  size: text("size", { enum: ["lg", "sm"] }).notNull().default("lg"),
  /** CSS-inverts logoUrl to white on the site footer's dark background. */
  needsWhite: integer("needs_white", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
});

/** Singleton — always exactly one row (id 1). Lets the club admin update
 *  its own legal/bank/contact details shown in the site footer without
 *  needing a code change. */
export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  legalName: text("legal_name").notNull(),
  legalAddress: text("legal_address").notNull(),
  regNr: text("reg_nr").notNull(),
  bankName: text("bank_name").notNull(),
  bankAccount: text("bank_account").notNull(),
  bankCode: text("bank_code").notNull(),
  stadiumAddress: text("stadium_address").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
