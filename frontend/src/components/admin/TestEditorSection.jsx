export const TestEditorSection = ({
  selectedTest,
  selectedTestForm,
  setSelectedTestForm,
  saveTestSettings,
  editingQuestionId,
  questionDraft,
  setQuestionDraft,
  upsertQuestion,
  questions,
  startEditQuestion,
  removeQuestion
}) => {
  return (
    <div className="panel">
      <h2>Test & Question Editor</h2>
      {!selectedTest ? <p>Select a test from Overview tab using Edit Test.</p> : null}
      {selectedTest ? (
        <div className="form-grid">
          <h3>Editing: {selectedTest.title}</h3>
          <input
            value={selectedTestForm.title}
            onChange={(e) => setSelectedTestForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Test title"
          />
          <textarea
            value={selectedTestForm.description}
            onChange={(e) => setSelectedTestForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Test description"
            rows={3}
          />
          <input
            type="number"
            value={selectedTestForm.durationMinutes}
            onChange={(e) => setSelectedTestForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value) }))}
          />
          <button className="btn" onClick={saveTestSettings}>Save Test Settings</button>

          <h3>{editingQuestionId ? "Edit Question" : "Add Question"}</h3>
          <input
            placeholder="Question title"
            value={questionDraft.title}
            onChange={(e) => setQuestionDraft((prev) => ({ ...prev, title: e.target.value }))}
          />
          <textarea
            placeholder="Question description"
            value={questionDraft.description}
            onChange={(e) => setQuestionDraft((prev) => ({ ...prev, description: e.target.value }))}
            rows={2}
          />
          <div className="option-grid">
            {questionDraft.mcq.options.map((opt, idx) => (
              <input
                key={opt.key}
                placeholder={`Option ${opt.key}`}
                value={opt.text}
                onChange={(e) => {
                  const nextOptions = [...questionDraft.mcq.options];
                  nextOptions[idx] = { ...nextOptions[idx], text: e.target.value };
                  setQuestionDraft((prev) => ({ ...prev, mcq: { ...prev.mcq, options: nextOptions } }));
                }}
              />
            ))}
          </div>
          <input
            placeholder="Correct answers (A or A|C)"
            value={questionDraft.mcq.correctAnswers.join("|")}
            onChange={(e) => {
              const correctAnswers = e.target.value
                .split("|")
                .map((item) => item.trim().toUpperCase())
                .filter(Boolean);
              setQuestionDraft((prev) => ({ ...prev, mcq: { ...prev.mcq, correctAnswers } }));
            }}
          />
          <button className="btn" onClick={upsertQuestion}>{editingQuestionId ? "Update Question" : "Add Question"}</button>

          <h3>Questions</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Marks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => (
                  <tr key={question._id}>
                    <td>{question.title}</td>
                    <td>{question.type}</td>
                    <td>{question.marks}</td>
                    <td className="action-row">
                      <button className="btn btn-ghost" onClick={() => startEditQuestion(question)}>Edit</button>
                      <button className="btn btn-ghost" onClick={() => removeQuestion(question._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
