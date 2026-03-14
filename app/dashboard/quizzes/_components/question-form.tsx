import { QuestionType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_OPTIONS,
} from "@/lib/quiz-constants";

type QuestionFormProps = {
  action: (formData: FormData) => Promise<void>;
  quizId: number;
  submitLabel: string;
  questionId?: number;
  initialValues?: {
    text?: string;
    type?: QuestionType;
    explanation?: string | null;
    order?: number;
    optionsText?: string;
    booleanCorrect?: "true" | "false";
    followUpsJson?: string;
  };
};

export function QuestionForm({
  action,
  quizId,
  submitLabel,
  questionId,
  initialValues,
}: QuestionFormProps) {
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="quizId" value={quizId} />
      {typeof questionId === "number" ? (
        <input type="hidden" name="questionId" value={questionId} />
      ) : null}

      <div className="space-y-2">
        <label htmlFor="text" className="text-sm font-medium">
          Texto da pergunta
        </label>
        <Textarea
          id="text"
          name="text"
          required
          rows={3}
          defaultValue={initialValues?.text ?? ""}
          placeholder="Ex: Qual linguagem é usada no Next.js?"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            defaultValue={initialValues?.type ?? QuestionType.multiple_choice}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            {QUESTION_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {QUESTION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="order" className="text-sm font-medium">
            Ordem
          </label>
          <Input
            id="order"
            name="order"
            type="number"
            min={1}
            required
            defaultValue={initialValues?.order ?? 1}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="explanation" className="text-sm font-medium">
          Explicação (opcional)
        </label>
        <Textarea
          id="explanation"
          name="explanation"
          rows={3}
          defaultValue={initialValues?.explanation ?? ""}
          placeholder="Texto exibido na revisão final"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="booleanCorrect" className="text-sm font-medium">
          Resposta correta para tipo boolean
        </label>
        <select
          id="booleanCorrect"
          name="booleanCorrect"
          defaultValue={initialValues?.booleanCorrect ?? "true"}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="optionsText" className="text-sm font-medium">
          Opções (para multiple_choice e image)
        </label>
        <Textarea
          id="optionsText"
          name="optionsText"
          rows={6}
          defaultValue={initialValues?.optionsText ?? ""}
          placeholder={`Formato por linha: label|value|correct\nExemplo:\nReact|react|true\nVue|vue|false`}
        />
        <p className="text-xs text-muted-foreground">
          Para tipo boolean, este campo é ignorado.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="followUpsJson" className="text-sm font-medium">
          Follow-ups opcionais (JSON)
        </label>
        <Textarea
          id="followUpsJson"
          name="followUpsJson"
          rows={10}
          defaultValue={initialValues?.followUpsJson ?? ""}
          placeholder={`[\n  {\n    "text": "Pergunta complementar",\n    "type": "multiple_choice",\n    "order": 1,\n    "options": [\n      { "label": "Opção A", "value": "a", "isCorrect": true },\n      { "label": "Opção B", "value": "b", "isCorrect": false }\n    ]\n  }\n]`}
        />
        <p className="text-xs text-muted-foreground">
          Para follow-up boolean, use <code>{`"booleanCorrect": "true"`}</code>.
        </p>
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
