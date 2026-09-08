import "dotenv/config";

import { db } from "./client";
import { coachTeams, coaches, players, teams } from "./schema";

const ROSTER_TEAMS = [
  {
    name: "1. komanda",
    players: [
      { name: "Signe Kalēja", birthdate: "12.04.1998." },
      { name: "Dita Vītola", birthdate: "03.09.2000." },
      { name: "Everita Bērziņa", birthdate: "22.01.1997." },
      { name: "Katrīna Liepa", birthdate: "15.06.1999." },
      { name: "Alise Zariņa", birthdate: "08.11.2001." },
      { name: "Marta Kundziņa", birthdate: "27.02.1996." },
      { name: "Rūta Ozoliņa", birthdate: "19.07.2002." },
      { name: "Annija Krasta", birthdate: "05.03.1995." },
      { name: "Elza Bergmane", birthdate: "30.10.2000." },
      { name: "Sabīne Auniņa", birthdate: "14.05.1999." },
    ],
  },
  {
    name: "U16",
    players: [
      { name: "Justīne Vanaga", birthdate: "11.02.2010." },
      { name: "Elīna Broka", birthdate: "24.06.2009." },
      { name: "Patrīcija Siliņa", birthdate: "03.10.2010." },
      { name: "Adele Kalve", birthdate: "17.01.2009." },
      { name: "Anete Rubene", birthdate: "29.08.2010." },
      { name: "Sindija Priede", birthdate: "06.04.2009." },
      { name: "Estere Miķelsone", birthdate: "20.12.2010." },
      { name: "Karlīna Dūmiņa", birthdate: "09.05.2009." },
    ],
  },
  {
    name: "U14",
    players: [
      { name: "Emīls Grigorjevs", birthdate: "14.03.2012." },
      { name: "Kristers Ābols", birthdate: "02.07.2011." },
      { name: "Ralfs Circenis", birthdate: "25.09.2012." },
      { name: "Artis Rozītis", birthdate: "18.01.2011." },
      { name: "Matīss Vanags", birthdate: "07.11.2012." },
      { name: "Ņikita Sokolovs", birthdate: "30.06.2011." },
      { name: "Toms Šķēle", birthdate: "12.02.2012." },
      { name: "Rihards Buls", birthdate: "23.08.2011." },
    ],
  },
  {
    name: "U12",
    players: [
      { name: "Roberts Zvaigzne", birthdate: "05.04.2014." },
      { name: "Edgars Cīrulis", birthdate: "19.10.2013." },
      { name: "Kaspars Liniņš", birthdate: "08.01.2014." },
      { name: "Renārs Ķauķis", birthdate: "27.05.2013." },
      { name: "Markuss Bite", birthdate: "14.09.2014." },
      { name: "Ādams Grava", birthdate: "03.12.2013." },
      { name: "Oskars Bariss", birthdate: "21.06.2014." },
      { name: "Valters Muižnieks", birthdate: "09.02.2013." },
    ],
  },
  {
    name: "U10",
    players: [
      { name: "Kārlis Ancāns", birthdate: "16.03.2016." },
      { name: "Bruno Ezeriņš", birthdate: "02.08.2015." },
      { name: "Kristiāns Sila", birthdate: "28.11.2016." },
      { name: "Ernests Vilks", birthdate: "13.05.2015." },
      { name: "Alekss Riekstiņš", birthdate: "07.01.2016." },
      { name: "Deniss Zariņš", birthdate: "22.09.2015." },
      { name: "Gustavs Krūmiņš", birthdate: "30.04.2016." },
      { name: "Elvis Ostrovskis", birthdate: "11.07.2015." },
    ],
  },
  {
    name: "Vārtsargu grupa",
    players: [
      { name: "Sanija Melnalksne", birthdate: "19.02.2009." },
      { name: "Dāvis Kronbergs", birthdate: "04.06.2012." },
      { name: "Estere Zvirbule", birthdate: "26.10.2014." },
      { name: "Ivo Pētersons", birthdate: "15.03.2016." },
      { name: "Reinis Gaigals", birthdate: "08.09.2010." },
      { name: "Amanda Strazda", birthdate: "21.01.2013." },
    ],
  },
];

const COACHES_SEED = [
  {
    name: "Jānis Bērziņš",
    position: "Galvenais treneris",
    license: "UEFA A licence",
    authority: "UEFA" as const,
    teamNames: ["1. komanda"],
  },
  {
    name: "Laura Ozola",
    position: "Trenere",
    license: "UEFA B licence",
    authority: "UEFA" as const,
    teamNames: ["U16"],
  },
  {
    name: "Mārtiņš Kalniņš",
    position: "Treneris",
    license: "UEFA B licence",
    authority: "UEFA" as const,
    teamNames: ["U14"],
  },
  {
    name: "Andris Liepiņš",
    position: "Vārtsargu treneris",
    license: "UEFA Vārtsargu licence",
    authority: "UEFA" as const,
    teamNames: ["1. komanda", "U16"],
  },
  {
    name: "Rihards Kļaviņš",
    position: "Treneris",
    license: "UEFA C licence",
    authority: "UEFA" as const,
    teamNames: ["U12"],
  },
  {
    name: "Elīna Krūmiņa",
    position: "Trenere",
    license: "UEFA C licence",
    authority: "UEFA" as const,
    teamNames: ["U10"],
  },
  {
    name: "Kristaps Zeltiņš",
    position: "Fiziskās sagatavotības treneris",
    license: "LFF fiziskās sagatavotības sertifikāts",
    authority: "LFF" as const,
    // Not a roster team — this coach's original hardcoded data used it as a
    // specialization label, not a squad. Seeded as its own Team row below
    // so the coach still displays it, matching current site behavior.
    teamNames: ["Fiziskā sagatavotība"],
  },
  {
    name: "Artūrs Ivanovs",
    position: "Asistenta treneris",
    license: "UEFA B licence",
    authority: "UEFA" as const,
    teamNames: ["1. komanda"],
  },
];

async function main() {
  const rosterTeamNames = new Set(ROSTER_TEAMS.map((t) => t.name));
  const extraTeamNames = [
    ...new Set(
      COACHES_SEED.flatMap((c) => c.teamNames).filter((name) => !rosterTeamNames.has(name)),
    ),
  ];

  const teamIdByName = new Map<string, number>();

  for (const team of ROSTER_TEAMS) {
    const [inserted] = await db
      .insert(teams)
      .values({ name: team.name, createdAt: Date.now() })
      .returning({ id: teams.id });
    teamIdByName.set(team.name, inserted.id);

    for (const player of team.players) {
      await db.insert(players).values({
        teamId: inserted.id,
        name: player.name,
        birthdate: player.birthdate,
        photoUrl: null,
        createdAt: Date.now(),
      });
    }
  }

  for (const name of extraTeamNames) {
    const [inserted] = await db
      .insert(teams)
      .values({ name, createdAt: Date.now() })
      .returning({ id: teams.id });
    teamIdByName.set(name, inserted.id);
  }

  for (const coach of COACHES_SEED) {
    const [inserted] = await db
      .insert(coaches)
      .values({
        name: coach.name,
        position: coach.position,
        license: coach.license,
        authority: coach.authority,
        photoUrl: "/coach-portrait.png",
        createdAt: Date.now(),
      })
      .returning({ id: coaches.id });

    for (const teamName of coach.teamNames) {
      const teamId = teamIdByName.get(teamName);
      if (teamId) {
        await db.insert(coachTeams).values({ coachId: inserted.id, teamId });
      }
    }
  }

  console.log(
    `Seeded ${ROSTER_TEAMS.length + extraTeamNames.length} teams, ` +
      `${ROSTER_TEAMS.reduce((sum, t) => sum + t.players.length, 0)} players, ` +
      `${COACHES_SEED.length} coaches.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
