import { useState } from "react";

export default function GetNumOpPage() {
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("loading");
  const [myNum, setMyNum] = useState("");

  const getToBinary = () => {
    console.log("Entered getToBinary:")
    setStatus("loading");
    fetch(`${import.meta.env.VITE_HERTZ_BASE_URL}/to_binary?number=${myNum}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("fetch failed");
        }
        return res.json();
      })
      .then((data) => {
        setResult(data.res);
        setStatus("success");
      })
      .catch((error) => {
        console.log("Error fetching binary:", error);
        setStatus("error");
      });
    return;
  };

  return (
    <>
      <h1>test page of get num op page!</h1>
      <h3>Binary Converter</h3>
      <input
        type="number"
        placeholder="Enter a number"
        value={myNum}
        onChange={(event) => setMyNum(event.target.value)}
      ></input>
      <button onClick={getToBinary}>Convert to Binary</button>
      {status === "loading"}
      {status === "error" && <p>There is a error:(</p>}
      {status === "success" && <p>the result is {result}</p>}
    </>
  );
}
