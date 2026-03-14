import { QuizStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QUIZ_STATUS_LABELS, QUIZ_STATUS_OPTIONS } from "@/lib/quiz-constants";

type QuizFormProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  quizId?: number;
  initialValues?: {
    title?: string;
    description?: string | null;
    status?: QuizStatus;
  };
};

export function QuizForm({
  action,
  submitLabel,
  quizId,
  initialValues,
}: QuizFormProps) {
  return (
    <form action={action} className="space-y-5">
      {typeof quizId === "number" ? (
        <input type="hidden" name="quizId" value={quizId} />
      ) : null}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Título
        </label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={initialValues?.title ?? ""}
          placeholder="Ex: Trivia de tecnologia"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Descrição (opcional)
        </label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialValues?.description ?? ""}
          placeholder="Resumo curto do quiz"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={initialValues?.status ?? QuizStatus.draft}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        >
          {QUIZ_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {QUIZ_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
