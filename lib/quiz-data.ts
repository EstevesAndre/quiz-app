import { Prisma, QuizStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const quizWithQuestionsInclude = Prisma.validator<Prisma.QuizInclude>()({
  questions: {
    orderBy: {
      order: "asc",
    },
    include: {
      options: {
        orderBy: {
          order: "asc",
        },
      },
      followUps: {
        orderBy: {
          order: "asc",
        },
        include: {
          options: {
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  },
});

export type QuizWithQuestions = Prisma.QuizGetPayload<{
  include: typeof quizWithQuestionsInclude;
}>;

export type PlayQuiz = {
  id: number;
  title: string;
  description: string | null;
  questions: Array<{
    id: number;
    order: number;
    text: string;
    type: string;
    explanation: string | null;
    options: Array<{
      id: number;
      label: string;
      value: string;
      imageUrl: string | null;
      isCorrect: boolean;
      order: number;
    }>;
    followUps: Array<{
      id: number;
      order: number;
      text: string;
      type: string;
      explanation: string | null;
      options: Array<{
        id: number;
        label: string;
        value: string;
        imageUrl: string | null;
        isCorrect: boolean;
        order: number;
      }>;
    }>;
  }>;
};

export async function getDashboardQuizzes() {
  return prisma.quiz.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });
}

export async function getQuizById(quizId: number) {
  return prisma.quiz.findUnique({
    where: {
      id: quizId,
    },
    include: quizWithQuestionsInclude,
  });
}

export async function getOpenQuizzes() {
  return prisma.quiz.findMany({
    where: {
      status: QuizStatus.open,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      updatedAt: true,
    },
  });
}

export async function getOpenQuizById(quizId: number) {
  return prisma.quiz.findFirst({
    where: {
      id: quizId,
      status: QuizStatus.open,
    },
    include: quizWithQuestionsInclude,
  });
}

export function serializeQuizForPlay(quiz: QuizWithQuestions): PlayQuiz {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      order: question.order,
      text: question.text,
      type: question.type,
      explanation: question.explanation,
      options: question.options.map((option) => ({
        id: option.id,
        label: option.label,
        value: option.value,
        imageUrl: option.imageUrl,
        isCorrect: option.isCorrect,
        order: option.order,
      })),
      followUps: question.followUps.map((followUp) => ({
        id: followUp.id,
        order: followUp.order,
        text: followUp.text,
        type: followUp.type,
        explanation: followUp.explanation,
        options: followUp.options.map((option) => ({
          id: option.id,
          label: option.label,
          value: option.value,
          imageUrl: option.imageUrl,
          isCorrect: option.isCorrect,
          order: option.order,
        })),
      })),
    })),
  };
}

export function parseIntegerParam(value: string): number | null {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}
