import { useEffect, useMemo, useState } from "react";
import { ActivitySection } from "../components/admin/ActivitySection";
import { OverviewSection } from "../components/admin/OverviewSection";
import { StudentsSection } from "../components/admin/StudentsSection";
import { TestEditorSection } from "../components/admin/TestEditorSection";
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
  const [studentCsvFile, setStudentCsvFile] = useState(null);

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

  const importStudentsCsv = async () => {
    if (!studentCsvFile) {
      setStatusMessage("Please choose student CSV file.");
      return;
    }

    const csvContent = await studentCsvFile.text();
    const result = await authService.importStudentsCsv({ csvContent });
    setStatusMessage(`Students imported: ${result.imported}, skipped: ${result.skipped}`);
    await loadStudents();
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
        <OverviewSection
          analytics={analytics}
          totalAttempts={totalAttempts}
          form={form}
          setForm={setForm}
          createTestSkeleton={createTestSkeleton}
          csvUploading={csvUploading}
          setCsvFile={setCsvFile}
          importCsv={importCsv}
          tests={tests}
          loading={loading}
          togglePublish={togglePublish}
          openTestEditor={openTestEditor}
        />
      ) : null}

      {activeTab === "tests" ? (
        <TestEditorSection
          selectedTest={selectedTest}
          selectedTestForm={selectedTestForm}
          setSelectedTestForm={setSelectedTestForm}
          saveTestSettings={saveTestSettings}
          editingQuestionId={editingQuestionId}
          questionDraft={questionDraft}
          setQuestionDraft={setQuestionDraft}
          upsertQuestion={upsertQuestion}
          questions={questions}
          startEditQuestion={startEditQuestion}
          removeQuestion={removeQuestion}
        />
      ) : null}

      {activeTab === "students" ? (
        <StudentsSection
          registration={registration}
          regenerateCode={regenerateCode}
          setStudentCsvFile={setStudentCsvFile}
          importStudentsCsv={importStudentsCsv}
          students={students}
        />
      ) : null}

      {activeTab === "activity" ? <ActivitySection activity={activity} /> : null}
    </section>
  );
};
