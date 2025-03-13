import { QuestionEditor } from "embedding-sdk/components/private/QuestionEditor";

import type { InteractiveQuestionProps } from "../InteractiveQuestion";

/** @deprecated Use `InteractiveQuestion` with `isSaveEnabled={true}` instead. */
export const ModifyQuestion = ({
  questionId,
  plugins,
  onSave,
  onBeforeSave,
  entityTypeFilter,
  isSaveEnabled,
  targetCollection,
  saveToCollection,
}: InteractiveQuestionProps) => (
  <QuestionEditor
    questionId={questionId}
    plugins={plugins}
    onSave={onSave}
    onBeforeSave={onBeforeSave}
    entityTypeFilter={entityTypeFilter}
    isSaveEnabled={isSaveEnabled}
    targetCollection={targetCollection}
    saveToCollection={saveToCollection}
  />
);
