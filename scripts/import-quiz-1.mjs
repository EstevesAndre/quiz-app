import { readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient, QuizStatus } from "@prisma/client";

const prisma = new PrismaClient();

const quizFilePath = path.resolve(process.cwd(), "quizzes/quiz-1.json");
const quizTitle = "Checklist PBCI";

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeQuestionType(rawType) {
  const type = normalizeText(rawType).toLowerCase();
  if (type === "boolean" || type === "multiple_choice" || type === "image") {
    return type;
  }

  throw new Error(`Tipo de pergunta inválido: ${String(rawType)}`);
}

function normalizeCorrectAnswers(correctAnswer) {
  if (Array.isArray(correctAnswer)) {
    return correctAnswer.map((entry) => normalizeText(String(entry))).filter(Boolean);
  }

  const singleValue = normalizeText(String(correctAnswer ?? ""));
  return singleValue ? [singleValue] : [];
}

function resolveCorrectOptionLabels(correctAnswers, normalizedOptions) {
  const resolvedCorrectAnswers = new Set();

  for (const answer of correctAnswers) {
    if (!answer) {
      continue;
    }

    if (normalizedOptions.includes(answer)) {
      resolvedCorrectAnswers.add(answer);
      continue;
    }

    if (/^\d+$/.test(answer)) {
      const optionIndex = Number.parseInt(answer, 10) - 1;
      if (optionIndex >= 0 && optionIndex < normalizedOptions.length) {
        resolvedCorrectAnswers.add(normalizedOptions[optionIndex]);
      }
    }
  }

  return resolvedCorrectAnswers;
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildOptions(rawOptions, rawCorrectAnswer, contextLabel) {
  if (!Array.isArray(rawOptions) || rawOptions.length < 2) {
    throw new Error(`${contextLabel}: precisa de pelo menos 2 opções.`);
  }

  const normalizedOptions = rawOptions.map((option) => normalizeText(String(option)));
  const correctAnswers = resolveCorrectOptionLabels(
    normalizeCorrectAnswers(rawCorrectAnswer),
    normalizedOptions,
  );

  const options = normalizedOptions.map((label, index) => ({
    label,
    value: `${slugify(label) || "option"}_${index + 1}`,
    isCorrect: correctAnswers.has(label),
    order: index + 1,
  }));

  if (!options.some((option) => option.isCorrect)) {
    throw new Error(`${contextLabel}: nenhuma resposta correta encontrada nas opções.`);
  }

  return options;
}

function buildExplanation(rawQuestion) {
  const notes = [];

  const sourceNote = normalizeText(rawQuestion.note);
  if (sourceNote) {
    notes.push(sourceNote);
  }

  if (rawQuestion.allow_multiple === true) {
    notes.push("Permite múltiplas respostas corretas.");
  }

  return notes.length > 0 ? notes.join(" ") : null;
}

function buildQuestionPayload(rawQuestion, order, contextLabel) {
  const text = normalizeText(rawQuestion.text);
  if (!text) {
    throw new Error(`${contextLabel}: texto em falta.`);
  }

  const type = normalizeQuestionType(rawQuestion.type);
  const options = buildOptions(rawQuestion.options, rawQuestion.correct_answer, contextLabel);
  const explanation = buildExplanation(rawQuestion);

  const followUpsSource = Array.isArray(rawQuestion.follow_ups)
    ? rawQuestion.follow_ups
    : [];

  const followUps = followUpsSource.map((followUp, followUpIndex) => {
    const followUpLabel = `${contextLabel} > follow-up ${followUpIndex + 1}`;
    const followUpText = normalizeText(followUp.text);
    if (!followUpText) {
      throw new Error(`${followUpLabel}: texto em falta.`);
    }

    return {
      text: followUpText,
      type: normalizeQuestionType(followUp.type),
      order: followUpIndex + 1,
      explanation: buildExplanation(followUp),
      options: {
        create: buildOptions(
          followUp.options,
          followUp.correct_answer,
          followUpLabel,
        ),
      },
    };
  });

  return {
    order,
    text,
    type,
    explanation,
    options: {
      create: options,
    },
    followUps: {
      create: followUps,
    },
  };
}

async function run() {
  const rawFile = await readFile(quizFilePath, "utf8");
  const source = JSON.parse(rawFile);

  if (!Array.isArray(source.questions) || source.questions.length === 0) {
    throw new Error("quiz-1.json não contém perguntas válidas.");
  }

  const descriptionParts = [
    "Importado de quizzes/quiz-1.json",
    normalizeText(source.document) ? `document=${normalizeText(source.document)}` : "",
    normalizeText(source.language) ? `language=${normalizeText(source.language)}` : "",
  ].filter(Boolean);

  const questionPayload = source.questions.map((question, index) =>
    buildQuestionPayload(question, index + 1, `Pergunta ${index + 1}`),
  );

  const importedQuiz = await prisma.$transaction(async (tx) => {
    const existingQuizzes = await tx.quiz.findMany({
      where: {
        title: quizTitle,
      },
      select: {
        id: true,
      },
    });

    if (existingQuizzes.length > 0) {
      await tx.quiz.deleteMany({
        where: {
          id: {
            in: existingQuizzes.map((quiz) => quiz.id),
          },
        },
      });
    }

    return tx.quiz.create({
      data: {
        title: quizTitle,
        description: descriptionParts.join(" · "),
        status: QuizStatus.open,
        questions: {
          create: questionPayload,
        },
      },
      include: {
        questions: {
          include: {
            followUps: true,
          },
        },
      },
    });
  });

  const followUpCount = importedQuiz.questions.reduce(
    (acc, question) => acc + question.followUps.length,
    0,
  );

  console.log(
    [
      "Quiz importado com sucesso.",
      `Quiz ID: ${importedQuiz.id}`,
      `Perguntas: ${importedQuiz.questions.length}`,
      `Follow-ups: ${followUpCount}`,
      `Status: ${importedQuiz.status}`,
    ].join("\n"),
  );
}

run()
  .catch((error) => {
    console.error("Falha ao importar quiz-1.json");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
