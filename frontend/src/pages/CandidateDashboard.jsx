import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { attemptService } from "../services/attemptService";
import { testService } from "../services/testService";

export const CandidateDashboard = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testsRes, attemptsRes] = await Promise.all([
        testService.list({ page: 1, limit: 20 }),
        attemptService.list({ page: 1, limit: 20 })
      ]);
      setTests(testsRes.items || []);
      setAttempts(attemptsRes.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <section className="dashboard-grid">
      <div className="panel">
        <h2>Available Tests</h2>
        {loading ? <div>Loading...</div> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Duration</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test._id}>
                  <td>{test.title}</td>
                  <td>{test.durationMinutes} min</td>
                  <td>
                    <button className="btn" onClick={() => navigate(`/candidate/tests/${test._id}`)}>
                      Start / Resume
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2>Your Attempts</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Test</th>
                <th>Status</th>
                <th>Score</th>
                <th>Violation Count</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt._id}>
                  <td>{attempt.testId?.title || "-"}</td>
                  <td>{attempt.status}</td>
                  <td>
                    {attempt.score}/{attempt.maxScore}
                  </td>
                  <td>{attempt.violationCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
