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
  createdAt: integer("created_at").notNull(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  playerTeams: many(playerTeams),
  coachTeams: many(coachTeams),
  trainings: many(trainings),
  events: many(events),
  games: many(games),
  leagueSources: many(leagueSources),
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
