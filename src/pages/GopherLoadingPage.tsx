import GopherLoader from "../components/GopherLoader";

export default function GopherLoadingPage() {
  return (
    <div style={{
      backgroundColor: "black",
      width: "100vw",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <GopherLoader />
    </div>
  );
}
