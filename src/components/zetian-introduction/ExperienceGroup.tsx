interface Experience {
  title: string;
  company: string;
  location: string;
  date: string;
  url?: string; // 可选字段
  description: string[];
}

interface ExperienceGroupProps {
  experiences: Experience[];
}

function ExperienceGroup({ experiences }: ExperienceGroupProps) {
  return (
    <div className="experience-group">
      {experiences.map((exp, index) => (
        <div key={index} className="card mb-3 p-3 shadow-sm rounded-3">
          <h4>{exp.title}</h4>
          <h5 className="text-muted">
            {exp.url ? (
              <a href={exp.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                {exp.company}
              </a>
            ) : (
              exp.company
            )}{" "}
            | {exp.location}
          </h5>
          <p className="text-secondary">{exp.date}</p>
          <ul>
            {exp.description.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default ExperienceGroup;
