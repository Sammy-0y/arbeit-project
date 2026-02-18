import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

function PublicJobDetail() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);

  useEffect(() => {
    fetch(`https://arbeit-project.onrender.com/api/public/jobs/${jobId}`)
      .then(res => res.json())
      .then(data => setJob(data));
  }, [jobId]);

  if (!job) return <p>Loading...</p>;

  return (
    <div style={{ padding: "40px" }}>
      <Link to="/careers">← Back to Careers</Link>

      <h2>{job.title}</h2>
      <p><strong>Location:</strong> {job.location}</p>
      <p><strong>Type:</strong> {job.employmentType}</p>
      <p><strong>Skills:</strong> {job.skills?.join(", ")}</p>

      <h3>Description</h3>
      <p>{job.description}</p>

      <button
        onClick={() => window.location.href = `/apply/${job._id}`}
      >
        Apply Now
      </button>
    </div>
  );
}

export default PublicJobDetail;
