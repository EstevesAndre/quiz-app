"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function parseQuizId(rawValue: FormDataEntryValue | null): number {
  const parsed = Number.parseInt(typeof rawValue === "string" ? rawValue : "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error("Quiz inválido.");
  }

  return parsed;
}

export async function startQuizAction(formData: FormData) {
  const quizId = parseQuizId(formData.get("quizId"));
  const mode = typeof formData.get("mode") === "string" ? String(formData.get("mode")) : "";
  const nameRaw = typeof formData.get("name") === "string" ? String(formData.get("name")) : "";
  const name = nameRaw.trim();

  const cookieStore = await cookies();

  if (mode === "anonymous" || !name) {
    cookieStore.delete("quiz_user_name");
  } else {
    cookieStore.set("quiz_user_name", name, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
  }

  redirect(`/quiz/${quizId}/question/1`);
}
