import { relations } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at").notNull(),
});

export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  birthdate: text("birthdate").notNull(),
  photoUrl: text("photo_url"),
  createdAt: integer("created_at").notNull(),
});

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
  opponent: text("opponent").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  homeAway: text("home_away", { enum: ["home", "away"] }).notNull(),
  location: text("location"),
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  players: many(players),
  coachTeams: many(coachTeams),
  trainings: many(trainings),
  events: many(events),
  games: many(games),
}));

export const playersRelations = relations(players, ({ one }) => ({
  team: one(teams, { fields: [players.teamId], references: [teams.id] }),
}));

export const coachesRelations = relations(coaches, ({ many }) => ({
  coachTeams: many(coachTeams),
}));

export const coachTeamsRelations = relations(coachTeams, ({ one }) => ({
  coach: one(coaches, { fields: [coachTeams.coachId], references: [coaches.id] }),
  team: one(teams, { fields: [coachTeams.teamId], references: [teams.id] }),
}));
