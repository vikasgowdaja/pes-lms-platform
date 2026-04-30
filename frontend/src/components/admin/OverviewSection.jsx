export const OverviewSection = ({
  analytics,
  totalAttempts,
  form,
  setForm,
  createTestSkeleton,
  csvUploading,
  setCsvFile,
  importCsv,
  tests,
  loading,
  togglePublish,
  openTestEditor
}) => {
  return (
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
  );
};
