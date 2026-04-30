import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { testService } from "../services/testService";

const initialQuestion = {
  title: "Sample MCQ",
  description: "Which data structure follows LIFO order?",
  type: "MCQ",
  marks: 1,
  negativeMarks: 0,
  mcq: {
    allowMultiple: false,
    options: [
      { key: "A", text: "Queue" },
      { key: "B", text: "Stack" },
      { key: "C", text: "Linked List" },
      { key: "D", text: "Heap" }
    ],
    correctAnswers: ["B"]
  }
};

export const AdminDashboard = () => {
  const [tests, setTests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
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
    },
    questions: [initialQuestion]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testsRes, analyticsRes] = await Promise.all([
        testService.list({ page: 1, limit: 20 }),
        api.get("/analytics/admin").then((res) => res.data)
      ]);
      setTests(testsRes.items || []);
      setAnalytics(analyticsRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalAttempts = useMemo(
    () => (analytics?.statusBreakdown || []).reduce((sum, item) => sum + item.count, 0),
    [analytics]
  );

  const createDemoTest = async () => {
    setStatusMessage("");
    await testService.create(form);
    setStatusMessage("Test created and saved to database.");
    await fetchData();
  };

  const importCsv = async () => {
    if (!csvFile) {
      setStatusMessage("Please select a CSV file first.");
      return;
    }

    setStatusMessage("");
    setCsvUploading(true);

    try {
      const csvContent = await csvFile.text();
      const response = await testService.importCsv({
        csvContent,
        title: form.title || "CSV Imported Test",
        description: form.description || "Imported from CSV",
        durationMinutes: form.durationMinutes,
        negativeMarkingEnabled: form.negativeMarkingEnabled,
        randomizeQuestions: form.randomizeQuestions,
        randomizeOptions: form.randomizeOptions,
        antiCheat: form.antiCheat
      });
      setStatusMessage(`${response.importedQuestions} questions imported and saved to MongoDB.`);
      await fetchData();
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
    await fetchData();
  };

  return (
    <section className="dashboard-grid">
      <div className="panel">
        <h2>Admin Analytics</h2>
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
        <h2>Create Test (Quick MVP Form)</h2>
        <p className="muted">
          This ships a full backend structure. For production admin UX, you can split this into dedicated test-builder steps.
        </p>
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
          <button className="btn" onClick={createDemoTest}>Create Test</button>
        </div>
        <div className="form-grid" style={{ marginTop: "1rem" }}>
          <label htmlFor="csvUpload">Import Questions from CSV (MCQ)</label>
          <input
            id="csvUpload"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
          />
          <button className="btn btn-ghost" onClick={importCsv} disabled={csvUploading}>
            {csvUploading ? "Importing..." : "Import CSV to DB"}
          </button>
          <p className="muted">
            Required CSV headers: questionTitle, questionDescription, optionA, optionB, optionC, optionD, correctAnswers, allowMultiple, marks, negativeMarks.
            Use | in correctAnswers for multi-answer, e.g. A|C.
          </p>
          {statusMessage ? <p className="muted">{statusMessage}</p> : null}
        </div>
      </div>

      <div className="panel">
        <h2>Your Tests</h2>
        {loading ? <div>Loading tests...</div> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test._id}>
                  <td>{test.title}</td>
                  <td>{test.durationMinutes} min</td>
                  <td>{test.isPublished ? "Published" : "Draft"}</td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => togglePublish(test)}>
                      {test.isPublished ? "Unpublish" : "Publish"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
