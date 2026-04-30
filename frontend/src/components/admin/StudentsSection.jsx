import { Link } from "react-router-dom";

export const StudentsSection = ({
  registration,
  regenerateCode,
  setStudentCsvFile,
  importStudentsCsv,
  students
}) => {
  return (
    <div className="panel">
      <h2>Student Registration Under Your Admin</h2>
      <div className="form-grid">
        <input readOnly value={registration?.adminCode || ""} placeholder="Admin registration code" />
        <textarea readOnly value={registration?.registrationLink || ""} rows={2} placeholder="Registration link" />
        <button className="btn btn-ghost" onClick={regenerateCode}>Regenerate Code</button>
        <input type="file" accept=".csv,text/csv" onChange={(event) => setStudentCsvFile(event.target.files?.[0] || null)} />
        <button className="btn" onClick={importStudentsCsv}>Bulk Import Students CSV</button>
        <p className="muted">CSV headers: name,email,password</p>
      </div>

      <h3 style={{ marginTop: "1rem" }}>Registered Students</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student._id}>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{new Date(student.createdAt).toLocaleString()}</td>
                <td>
                  <Link className="btn btn-ghost" to={`/admin/students/${student._id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
