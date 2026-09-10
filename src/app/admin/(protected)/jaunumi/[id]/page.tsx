import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { coaches, teams } from "@/db/schema";

import { ArticleForm } from "./article-form";

export default async function AdminArticleFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [teamOptions, coachOptions] = await Promise.all([
    db.select().from(teams).orderBy(teams.name),
    db
      .select({ id: coaches.id, name: coaches.name })
      .from(coaches)
      .orderBy(coaches.name),
  ]);

  if (id === "new") {
    return <ArticleForm mode="create" teamOptions={teamOptions} coachOptions={coachOptions} />;
  }

  const articleId = Number(id);
  const article = await db.query.articles.findFirst({
    where: (articles, { eq }) => eq(articles.id, articleId),
  });
  if (!article) notFound();

  return (
    <ArticleForm
      mode="edit"
      article={article}
      teamOptions={teamOptions}
      coachOptions={coachOptions}
    />
  );
}
