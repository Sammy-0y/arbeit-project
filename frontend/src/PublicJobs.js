import { useEffect, useState } from "react";

function PublicJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://arbeit-project.onrender.com/api/public/jobs")
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching jobs:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{padding:"20px"}}>Loading jobs...</div>;

  return (
    <div style={{padding:"40px"}}>
      <h2>Available Jobs</h2>

      {jobs.length === 0 ? (
        <p>No jobs available.</p>
      ) : (
        jobs.map(job => (
          <div key={job.job_id}
               style={{
                 border: "1px solid #ddd",
                 borderRadius: "8px",
                 padding: "20px",
                 marginBottom: "20px"
               }}>

            <h3>{job.title}</h3>
            <p><strong>Location:</strong> {job.location}</p>
            <p><strong>Type:</strong> {job.employment_type}</p>
            <p><strong>Skills:</strong> {job.required_skills?.join(", ")}</p>

            <button
              style={{
                padding: "8px 16px",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
              onClick={() => window.location.href = `/jobs/${job.job_id}`}
            >
              View Details
            </button>

          </div>
        ))
      )}
    </div>
  );
}

export default PublicJobs;
