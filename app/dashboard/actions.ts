"use server";

import { QuestionType, QuizStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

type OptionPayload = {
  label: string;
  value: string;
  isCorrect: boolean;
  order: number;
};

type FollowUpPayload = {
  text: string;
  type: QuestionType;
  order: number;
  explanation: string | null;
  options: OptionPayload[];
};

const TRUTHY_VALUE_REGEX = /^(true|1|yes|sim)$/i;

function readString(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function readNullableString(value: FormDataEntryValue | null): string | null {
  const normalized = readString(value);
  return normalized.length > 0 ? normalized : null;
}

function readPositiveInteger(value: FormDataEntryValue | null, fallback = 1): number {
  const parsed = Number.parseInt(readString(value), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function readQuizStatus(value: FormDataEntryValue | null): QuizStatus {
  const rawValue = readString(value);
  if (
    rawValue === QuizStatus.draft ||
    rawValue === QuizStatus.open ||
    rawValue === QuizStatus.closed
  ) {
    return rawValue;
  }

  return QuizStatus.draft;
}

function readQuestionType(value: FormDataEntryValue | null): QuestionType {
  const rawValue = readString(value);
  if (
    rawValue === QuestionType.boolean ||
    rawValue === QuestionType.multiple_choice ||
    rawValue === QuestionType.image
  ) {
    return rawValue;
  }

  return QuestionType.multiple_choice;
}

function sanitizeOptionValue(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "_");
}

function readBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    return TRUTHY_VALUE_REGEX.test(value.trim());
  }

  return false;
}

function parseOptionsFromText(rawValue: string): OptionPayload[] {
  const lines = rawValue
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line, index) => {
    const [rawLabel = "", rawOptionValue = "", rawIsCorrect = "false"] = line
      .split("|")
      .map((part) => part.trim());

    if (!rawLabel) {
      throw new Error("Cada opção precisa de label.");
    }

    return {
      label: rawLabel,
      value: rawOptionValue || sanitizeOptionValue(rawLabel),
      isCorrect: TRUTHY_VALUE_REGEX.test(rawIsCorrect),
      order: index + 1,
    };
  });
}

function buildBooleanOptions(correctValueRaw: string): OptionPayload[] {
  const correctValue = correctValueRaw === "false" ? "false" : "true";

  return [
    {
      label: "True",
      value: "true",
      isCorrect: correctValue === "true",
      order: 1,
    },
    {
      label: "False",
      value: "false",
      isCorrect: correctValue === "false",
      order: 2,
    },
  ];
}

function validateNonBooleanOptions(options: OptionPayload[], context: string) {
  if (options.length < 2) {
    throw new Error(`${context}: adicione pelo menos duas opções.`);
  }

  if (!options.some((option) => option.isCorrect)) {
    throw new Error(`${context}: marque pelo menos uma opção correta.`);
  }
}

function parseOptionsFromJsonArray(rawOptions: unknown, context: string): OptionPayload[] {
  if (!Array.isArray(rawOptions)) {
    throw new Error(`${context}: "options" deve ser um array.`);
  }

  const options = rawOptions.map((rawOption, index) => {
    if (!rawOption || typeof rawOption !== "object") {
      throw new Error(`${context}: cada opção precisa ser um objeto.`);
    }

    const label = readString(
      "label" in rawOption ? String(rawOption.label) : "",
    );
    const value = readString("value" in rawOption ? String(rawOption.value) : "");
    const isCorrect = readBoolean(
      "isCorrect" in rawOption ? rawOption.isCorrect : false,
    );

    if (!label) {
      throw new Error(`${context}: cada opção precisa de label.`);
    }

    return {
      label,
      value: value || sanitizeOptionValue(label),
      isCorrect,
      order: index + 1,
    };
  });

  validateNonBooleanOptions(options, context);
  return options;
}

function parseFollowUpsFromJson(rawValue: string): FollowUpPayload[] {
  if (!rawValue.trim()) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new Error("Follow-ups: JSON inválido.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Follow-ups: o JSON precisa ser um array.");
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error("Follow-ups: cada item precisa ser um objeto.");
    }

    const entryObject = entry as Record<string, unknown>;
    const text = readString(String(entryObject.text ?? ""));
    if (!text) {
      throw new Error("Follow-ups: cada item precisa de texto.");
    }

    const type = readQuestionType(String(entryObject.type ?? "multiple_choice"));
    const order =
      Number.isInteger(entryObject.order) && Number(entryObject.order) > 0
        ? Number(entryObject.order)
        : index + 1;
    const explanation = readNullableString(
      entryObject.explanation ? String(entryObject.explanation) : "",
    );

    let options: OptionPayload[];
    if (type === QuestionType.boolean) {
      options = buildBooleanOptions(String(entryObject.booleanCorrect ?? "true"));
    } else {
      options = parseOptionsFromJsonArray(
        entryObject.options,
        `Follow-up ${index + 1}`,
      );
    }

    return {
      text,
      type,
      order,
      explanation,
      options,
    };
  });
}

function parseMainQuestionOptions(formData: FormData, type: QuestionType): OptionPayload[] {
  if (type === QuestionType.boolean) {
    return buildBooleanOptions(readString(formData.get("booleanCorrect")));
  }

  const options = parseOptionsFromText(readString(formData.get("optionsText")));
  validateNonBooleanOptions(options, "Pergunta principal");
  return options;
}

function revalidateQuizPaths(quizId: number) {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/quizzes/${quizId}`);
  revalidatePath(`/dashboard/quizzes/${quizId}/edit`);
  revalidatePath(`/quiz/${quizId}`);
  revalidatePath(`/quiz/${quizId}/results`);
}

export async function createQuizAction(formData: FormData) {
  const title = readString(formData.get("title")) || "Untitled quiz";
  const description = readNullableString(formData.get("description"));
  const status = readQuizStatus(formData.get("status"));

  const quiz = await prisma.quiz.create({
    data: {
      title,
      description,
      status,
    },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/quizzes/${quiz.id}`);
}

export async function updateQuizAction(formData: FormData) {
  const quizId = readPositiveInteger(formData.get("quizId"), 0);
  if (!quizId) {
    throw new Error("Quiz inválido.");
  }

  const title = readString(formData.get("title")) || "Untitled quiz";
  const description = readNullableString(formData.get("description"));
  const status = readQuizStatus(formData.get("status"));

  await prisma.quiz.update({
    where: {
      id: quizId,
    },
    data: {
      title,
      description,
      status,
    },
  });

  revalidateQuizPaths(quizId);
  redirect(`/dashboard/quizzes/${quizId}`);
}

export async function createQuestionAction(formData: FormData) {
  const quizId = readPositiveInteger(formData.get("quizId"), 0);
  if (!quizId) {
    throw new Error("Quiz inválido.");
  }

  const text = readString(formData.get("text"));
  if (!text) {
    throw new Error("Pergunta principal sem texto.");
  }

  const type = readQuestionType(formData.get("type"));
  const order = readPositiveInteger(formData.get("order"));
  const explanation = readNullableString(formData.get("explanation"));
  const options = parseMainQuestionOptions(formData, type);
  const followUps = parseFollowUpsFromJson(readString(formData.get("followUpsJson")));

  await prisma.question.create({
    data: {
      quizId,
      text,
      type,
      order,
      explanation,
      options: {
        create: options,
      },
      followUps: {
        create: followUps.map((followUp) => ({
          text: followUp.text,
          type: followUp.type,
          order: followUp.order,
          explanation: followUp.explanation,
          options: {
            create: followUp.options,
          },
        })),
      },
    },
  });

  revalidateQuizPaths(quizId);
  redirect(`/dashboard/quizzes/${quizId}`);
}

export async function updateQuestionAction(formData: FormData) {
  const quizId = readPositiveInteger(formData.get("quizId"), 0);
  const questionId = readPositiveInteger(formData.get("questionId"), 0);
  if (!quizId || !questionId) {
    throw new Error("Pergunta inválida.");
  }

  const existingQuestion = await prisma.question.findUnique({
    where: {
      id: questionId,
    },
    select: {
      quizId: true,
    },
  });

  if (!existingQuestion || existingQuestion.quizId !== quizId) {
    throw new Error("Pergunta não encontrada.");
  }

  const text = readString(formData.get("text"));
  if (!text) {
    throw new Error("Pergunta principal sem texto.");
  }

  const type = readQuestionType(formData.get("type"));
  const order = readPositiveInteger(formData.get("order"));
  const explanation = readNullableString(formData.get("explanation"));
  const options = parseMainQuestionOptions(formData, type);
  const followUps = parseFollowUpsFromJson(readString(formData.get("followUpsJson")));

  await prisma.question.update({
    where: {
      id: questionId,
    },
    data: {
      text,
      type,
      order,
      explanation,
      options: {
        deleteMany: {},
        create: options,
      },
      followUps: {
        deleteMany: {},
        create: followUps.map((followUp) => ({
          text: followUp.text,
          type: followUp.type,
          order: followUp.order,
          explanation: followUp.explanation,
          options: {
            create: followUp.options,
          },
        })),
      },
    },
  });

  revalidateQuizPaths(quizId);
  redirect(`/dashboard/quizzes/${quizId}`);
}
