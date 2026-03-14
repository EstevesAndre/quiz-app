import { QuestionType, QuizStatus } from "@prisma/client";

export const QUIZ_STATUS_OPTIONS: QuizStatus[] = [
  QuizStatus.draft,
  QuizStatus.open,
  QuizStatus.closed,
];

export const QUESTION_TYPE_OPTIONS: QuestionType[] = [
  QuestionType.boolean,
  QuestionType.multiple_choice,
  QuestionType.image,
];

export const QUIZ_STATUS_LABELS: Record<QuizStatus, string> = {
  [QuizStatus.draft]: "Draft",
  [QuizStatus.open]: "Open",
  [QuizStatus.closed]: "Closed",
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.boolean]: "Boolean",
  [QuestionType.multiple_choice]: "Multiple choice",
  [QuestionType.image]: "Image",
};
