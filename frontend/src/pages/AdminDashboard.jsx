import { useEffect, useMemo, useState } from "react";
import { analyticsService } from "../services/analyticsService";
import { authService } from "../services/authService";
import { testService } from "../services/testService";

const initialQuestionDraft = {
  title: "",
  description: "",
  type: "MCQ",
  marks: 1,
  negativeMarks: 0,
  mcq: {
    allowMultiple: false,
    options: [
      { key: "A", text: "" },
      { key: "B", text: "" },
      { key: "C", text: "" },
      { key: "D", text: "" }
    ],
    correctAnswers: []
  }
};

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "tests", label: "Test & Question Editor" },
  { id: "students", label: "Student Registry" },
  { id: "activity", label: "Live Activity" }
];

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [tests, setTests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [students, setStudents] = useState([]);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMinutes: 60,
    negativeMarkingEnabled: true,
    randomizeQuestions: true,
    randomizeOptions: true,
    antiCheat: {
      violationThreshold: 5,
      requireFullscreen: true,
      disableCopyPaste: false
    }
  });

  const [selectedTestId, setSelectedTestId] = useState("");
  const [selectedTestForm, setSelectedTestForm] = useState({
    title: "",
    description: "",
    durationMinutes: 60
  });
  const [questions, setQuestions] = useState([]);
  const [questionDraft, setQuestionDraft] = useState(initialQuestionDraft);
  const [editingQuestionId, setEditingQuestionId] = useState("");

  const totalAttempts = useMemo(
    () => (analytics?.statusBreakdown || []).reduce((sum, item) => sum + item.count, 0),
    [analytics]
  );

  const selectedTest = tests.find((test) => test._id === selectedTestId);

  const loadOverview = async () => {
    const [testsRes, analyticsRes] = await Promise.all([
      testService.list({ page: 1, limit: 30 }),
      analyticsService.summary()
    ]);
    setTests(testsRes.items || []);
    setAnalytics(analyticsRes);
  };

  const loadStudents = async () => {
    const [registrationRes, studentsRes] = await Promise.all([
      authService.getAdminRegistration(),
      authService.listAdminStudents({ page: 1, limit: 50 })
    ]);
    setRegistration(registrationRes);
    setStudents(studentsRes.items || []);
  };

  const loadActivity = async () => {
    const activityRes = await analyticsService.activity({ page: 1, limit: 30 });
    setActivity(activityRes.items || []);
  };

  const loadTestQuestions = async (testId) => {
    const response = await testService.getQuestions(testId);
    setQuestions(response.items || []);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadOverview(), loadStudents(), loadActivity()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createTestSkeleton = async () => {
    setStatusMessage("");
    await testService.create({
      ...form,
      questions: [
        {
          title: "Starter Question",
          description: "Pick the correct option.",
          type: "MCQ",
          marks: 1,
          negativeMarks: 0,
          mcq: {
            allowMultiple: false,
            options: [
              { key: "A", text: "Option A" },
              { key: "B", text: "Option B" },
              { key: "C", text: "Option C" },
              { key: "D", text: "Option D" }
            ],
            correctAnswers: ["A"]
          }
        }
      ]
    });
    setStatusMessage("Test created in database.");
    await loadOverview();
  };

  const importCsv = async () => {
    if (!csvFile) {
      setStatusMessage("Please choose a CSV file.");
      return;
    }

    setCsvUploading(true);
    setStatusMessage("");

    try {
      const csvContent = await csvFile.text();
      const response = await testService.importCsv({
        csvContent,
        title: form.title || "Imported Test",
        description: form.description || "Imported from CSV",
        durationMinutes: form.durationMinutes,
        negativeMarkingEnabled: form.negativeMarkingEnabled,
        randomizeQuestions: form.randomizeQuestions,
        randomizeOptions: form.randomizeOptions,
        antiCheat: form.antiCheat
      });
      setStatusMessage(`${response.importedQuestions} questions imported to MongoDB.`);
      await loadOverview();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "CSV import failed.");
    } finally {
      setCsvUploading(false);
    }
  };

  const togglePublish = async (test) => {
    if (test.isPublished) {
      await testService.unpublish(test._id);
    } else {
      await testService.publish(test._id);
    }
    await loadOverview();
  };

  const openTestEditor = async (test) => {
    setSelectedTestId(test._id);
    setSelectedTestForm({
      title: test.title,
      description: test.description || "",
      durationMinutes: test.durationMinutes
    });
    await loadTestQuestions(test._id);
  };

  const saveTestSettings = async () => {
    if (!selectedTestId) {
      return;
    }
    await testService.update(selectedTestId, selectedTestForm);
    setStatusMessage("Test settings updated.");
    await loadOverview();
  };

  const upsertQuestion = async () => {
    if (!selectedTestId) {
      setStatusMessage("Select a test first.");
      return;
    }

    const payload = {
      ...questionDraft,
      mcq: {
        ...questionDraft.mcq,
        correctAnswers: questionDraft.mcq.correctAnswers
      }
    };

    if (editingQuestionId) {
      await testService.updateQuestion(selectedTestId, editingQuestionId, payload);
      setStatusMessage("Question updated.");
    } else {
      await testService.addQuestion(selectedTestId, payload);
      setStatusMessage("Question added.");
    }

    setQuestionDraft(initialQuestionDraft);
    setEditingQuestionId("");
    await loadTestQuestions(selectedTestId);
  };

  const startEditQuestion = (question) => {
    setEditingQuestionId(question._id);
    setQuestionDraft({
      title: question.title,
      description: question.description,
      type: question.type,
      marks: question.marks,
      negativeMarks: question.negativeMarks,
      mcq: {
        allowMultiple: question.mcq?.allowMultiple || false,
        options: question.mcq?.options || initialQuestionDraft.mcq.options,
        correctAnswers: question.mcq?.correctAnswers || []
      }
    });
  };

  const removeQuestion = async (questionId) => {
    await testService.deleteQuestion(selectedTestId, questionId);
    await loadTestQuestions(selectedTestId);
    setStatusMessage("Question deleted.");
  };

  const regenerateCode = async () => {
    const response = await authService.regenerateAdminRegistration();
    setRegistration(response);
    setStatusMessage("Registration code regenerated.");
  };

  return (
    <section className="dashboard-grid">
      <div className="panel">
        <h2>Admin Workspace</h2>
        <div className="tab-row">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`btn ${activeTab === tab.id ? "" : "btn-ghost"}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {statusMessage ? <p className="muted">{statusMessage}</p> : null}
      </div>

      {activeTab === "overview" ? (
        <>
          <div className="panel">
            <h2>Analytics Snapshot</h2>
            {analytics ? (
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span>Total Attempts</span>
                  <strong>{totalAttempts}</strong>
                </div>
                <div className="kpi-card">
                  <span>Avg Score</span>
                  <strong>{Number(analytics.scoreSummary?.avgScore || 0).toFixed(2)}</strong>
                </div>
                <div className="kpi-card">
                  <span>Max Score</span>
                  <strong>{analytics.scoreSummary?.maxScore || 0}</strong>
                </div>
              </div>
            ) : null}
          </div>

          <div className="panel">
            <h2>Create Test / Import CSV</h2>
            <div className="form-grid">
              <input
                placeholder="Test title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <textarea
                placeholder="Test description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
              <input
                type="number"
                value={form.durationMinutes}
                onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                min={1}
              />
              <button className="btn" onClick={createTestSkeleton}>Create Test</button>

              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
              />
              <button className="btn btn-ghost" onClick={importCsv} disabled={csvUploading}>
                {csvUploading ? "Importing..." : "Import CSV"}
              </button>
            </div>
          </div>

          <div className="panel">
            <h2>Your Tests</h2>
            {loading ? <div>Loading...</div> : null}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => (
                    <tr key={test._id}>
                      <td>{test.title}</td>
                      <td>{test.durationMinutes} min</td>
                      <td>{test.isPublished ? "Published" : "Draft"}</td>
                      <td className="action-row">
                        <button className="btn btn-ghost" onClick={() => togglePublish(test)}>
                          {test.isPublished ? "Unpublish" : "Publish"}
                        </button>
                        <button className="btn btn-ghost" onClick={() => openTestEditor(test)}>
                          Edit Test
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {activeTab === "tests" ? (
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
      ) : null}

      {activeTab === "students" ? (
        <div className="panel">
          <h2>Student Registration Under Your Admin</h2>
          <div className="form-grid">
            <input readOnly value={registration?.adminCode || ""} placeholder="Admin registration code" />
            <textarea readOnly value={registration?.registrationLink || ""} rows={2} placeholder="Registration link" />
            <button className="btn btn-ghost" onClick={regenerateCode}>Regenerate Code</button>
          </div>

          <h3 style={{ marginTop: "1rem" }}>Registered Students</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{new Date(student.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {activeTab === "activity" ? (
        <div className="panel">
          <h2>Student Activity & Test Progress</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Test</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Violations</th>
                  <th>Latest Event</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((entry) => (
                  <tr key={entry.attemptId}>
                    <td>{entry.student?.name || "-"}</td>
                    <td>{entry.test?.title || "-"}</td>
                    <td>{entry.status}</td>
                    <td>{entry.score}/{entry.maxScore}</td>
                    <td>{entry.violationCount}</td>
                    <td>
                      {entry.latestCheatingEvent
                        ? `${entry.latestCheatingEvent.event} (${new Date(entry.latestCheatingEvent.timestamp).toLocaleTimeString()})`
                        : "-"}
                    </td>
                    <td>{new Date(entry.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
};
