interface EducationItem {
  school: string;
  degree: string;
  major: string;
  gpa: string;
  graduation: string;
}

interface EducationProps {
  educationList: EducationItem[];
}

function Education({ educationList }: EducationProps) {
  return (
    <div className="education-group mt-5">
      <h2 className="mb-3">🏫 Education</h2>
      {educationList.map((edu, index) => (
        <div key={index} className="card mb-3 p-3 shadow-sm rounded-3">
          <h5>{edu.school}</h5>
          <p className="mb-1 text-muted">
            {edu.degree} — {edu.major}
          </p>
          <p className="mb-1">GPA: {edu.gpa}</p>
          <p className="text-secondary mb-0">
            Expected Graduation: {edu.graduation}
          </p>
        </div>
      ))}
    </div>
  );
}

export default Education;
