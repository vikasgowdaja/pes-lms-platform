export const ActivitySection = ({ activity }) => {
  return (
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
  );
};
