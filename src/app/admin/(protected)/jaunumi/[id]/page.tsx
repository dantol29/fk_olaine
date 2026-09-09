import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { teams } from "@/db/schema";

import { ArticleForm } from "./article-form";

export default async function AdminArticleFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  if (id === "new") {
    return <ArticleForm mode="create" teamOptions={teamOptions} />;
  }

  const articleId = Number(id);
  const article = await db.query.articles.findFirst({
    where: (articles, { eq }) => eq(articles.id, articleId),
  });
  if (!article) notFound();

  return <ArticleForm mode="edit" article={article} teamOptions={teamOptions} />;
}
