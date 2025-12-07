import ListGroup from "../components/zetian-introduction/ListGroup";
import { MouseEvent } from "react";

export default function GetMyFavWebPage() {
  const websites = [
    "bilibili.com",
    "youtube.com",
    "chatgpt.com",
    "mail.google.com/mail/u/1/#inbox",
    "https://us-east-2.console.aws.amazon.com/console/home?nc2=h_si&src=header-signin&region=us-east-2"
  ];

  const handleClick = (event: MouseEvent, item: string) => {
    console.log("Opening:", item);
    window.open("https://" + item, "_blank");
  };

  return (
    <div className="container mt-5 text-center">
      <h2 className="mb-3 fw-bold">🌐 My Favorite Websites</h2>
      <p className="text-muted mb-4">
        Here are some of the websites I often visit — click to explore!
      </p>

      <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: "600px" }}>
        <ListGroup
          items={websites}
          heading="Websites List"
          onSelectItem={handleClick}
        />
      </div>

      <div className="mt-4">
        <a href="/" className="btn btn-outline-primary">
          ← Back to Home
        </a>
      </div>
    </div>
  );
}
