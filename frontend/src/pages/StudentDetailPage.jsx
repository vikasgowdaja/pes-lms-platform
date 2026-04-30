import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { analyticsService } from "../services/analyticsService";

export const StudentDetailPage = () => {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    analyticsService
      .studentDetail(studentId)
      .then(setData)
      .catch((err) => setError(err.response?.data?.message || "Unable to load student detail"));
  }, [studentId]);

  if (error) {
    return <div className="panel"><p className="error-text">{error}</p></div>;
  }

  if (!data) {
    return <div className="center-state">Loading student detail...</div>;
  }

  return (
    <section className="dashboard-grid">
      <div className="panel">
        <h2>{data.student.name}</h2>
        <p className="muted">{data.student.email}</p>
      </div>

      <div className="panel">
        <h3>Attempts Timeline</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Test</th>
                <th>Status</th>
                <th>Score</th>
                <th>Violations</th>
              </tr>
            </thead>
            <tbody>
              {data.attemptsTimeline.map((attempt) => (
                <tr key={attempt.attemptId}>
                  <td>{new Date(attempt.updatedAt).toLocaleString()}</td>
                  <td>{attempt.testTitle}</td>
                  <td>{attempt.status}</td>
                  <td>{attempt.score}/{attempt.maxScore}</td>
                  <td>{attempt.violationCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h3>Cheating Logs</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Attempt</th>
              </tr>
            </thead>
            <tbody>
              {data.cheatingLogs.map((log, index) => (
                <tr key={`${log.attemptId}-${index}`}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.event}</td>
                  <td>{log.attemptId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h3>Score Trend</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Test</th>
                <th>Score</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {data.scoreTrend.map((point) => (
                <tr key={point.attemptId}>
                  <td>{new Date(point.date).toLocaleString()}</td>
                  <td>{point.testTitle}</td>
                  <td>{point.score}/{point.maxScore}</td>
                  <td>{point.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
