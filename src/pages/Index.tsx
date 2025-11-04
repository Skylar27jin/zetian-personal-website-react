import { useNavigate } from "react-router-dom";
import ExperienceGroup from "../components/ExperienceGroup";
import Education from "../components/EducationGroup";

export default function Index() {
  const navigate = useNavigate();

  const handleGoToWebList = () => {
    navigate("/weblist");
  };


  const experiences = [
    {
      title: "Software Engineer Intern",
      company: "ByteDance (TikTok US)",
      location: "San Jose, CA",
      date: "May 2025 - Aug 2025",
      url: "https://www.bytedance.com/en/",
      description: [
        "Built a multi-region recommendation system attribute management tool with automated alerts, smart expiration, and one-click update, cutting downstream queues and DB resource usage by 65%+ and accelerating system upgrade.",
        "Optimized system performance by applying Go concurrency, batch operations, and algorithmic redesign, reducing multi-region read time by 67% and stabilizing processing and updating time to constant 2s (O(1)).",
        "Deployed and maintained services across Cronjob and multi-region, multi-instance servers, eliminating cross-instance data inconsistencies and streamlining the service upgrade pipeline.",
        "Ensured reliability with 100% unit test coverage and edge-case testing, while enhancing extensibility by developing rich APIs and leading cross-team, cross-time-zone knowledge-sharing sessions."
      ]
    },
    {
      title: "Backend Engineer Intern",
      company: "NextTier",
      location: "Sacramento, CA",
      date: "Jul 2024 - Sep 2024",
      url: "https://www.nexttiertech.com",
      description: [
        "Designed and implemented a Java Spring Boot scheduler to automatically retrieve live cryptocurrency data from multiple exchanges, standardize the information, and store it in a PostgreSQL database in AWS RDS.",
        "Led initiatives to improve software reliability by identifying system vulnerabilities and implementing JUnit and integration testing, eliminating 5 potential errors and ensuring alignment between client and backend contracts.",
        "Improved application responsiveness for concurrent users by utilizing Java's concurrency features, achieving a 3x increase in performance and reducing processing time from 120 minutes to 80 minutes.",
        "Deployed the web on an EC2 instance within a VPC, configured with private subnets and security groups, and integrated with a target group and Elastic Load Balancer to ensure high availability and dynamic traffic management."
      ]
    }
  ];

  const educations = [
    {
      school: "Boston University",
      degree: "Bachelor of Science",
      major: "Computer Science",
      gpa: "3.89 / 4.00",
      graduation: "June 2027"
    }
  ];

  return (
    <div className="container mt-5">
      <h1 className="mb-3">Hello World, I am Zetian Jin :)</h1>

      <button
        className="btn btn-dark mb-3"
        onClick={() => navigate("/me")}
      >
        Go to a forum website that I am developing💬
      </button>

      <button className="btn btn-primary mb-3" onClick={handleGoToWebList}>
        Go to Zetian's Favorite Websites ⭐
      </button>
      <Education educationList={educations} />
      <h2 className="mb-3">💼 Experience</h2>
      <ExperienceGroup experiences={experiences} />
      <footer>
        <h4>Contact</h4>
        <p>📧 <a href="mailto:skyjin0127@gmail.com">skyjin0127@gmail.com</a></p>
        <p>💼 <a href="https://www.linkedin.com/in/zetian-jin-03a4a3295/" target="_blank">LinkedIn</a></p>
        <p>📍 San Diego, CA | Boston, MA | Shanghai, China</p>
      </footer>
    </div>
  );
}
