import { useState, useEffect } from "react";

export default function GetNumOpPage() {
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("idle");
  const [myNum, setMyNum] = useState("");
  const [myHistory, setMyHistory] = useState<string[]>([]);

  // ✅ 页面加载时读取 localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("binaryHistory") || "[]");
    setMyHistory(stored);
  }, []);


  
  const getToBinary = () => {
    if (!myNum.trim()) return;
    setStatus("loading");

    fetch(`${import.meta.env.VITE_HERTZ_BASE_URL}/to_binary?number=${myNum}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => {
        setResult(data.res);
        setStatus("success");

        const newRecord = `to_binary(${myNum}) = ${data.res}`;

        // ✅ 去重：若已有同一记录则不添加
        if (!myHistory.includes(newRecord)) {
          const updatedHistory = [newRecord, ...myHistory].slice(0, 10); // 最多保留10条
          setMyHistory(updatedHistory);
          localStorage.setItem("binaryHistory", JSON.stringify(updatedHistory));
        }
      })
      .catch(() => setStatus("error"));
  };

  return (
    <div>
      <h1>Binary Converter</h1>
      <input
        type="number"
        placeholder="Enter a number"
        value={myNum}
        onChange={(e) => setMyNum(e.target.value)}
      />
      <button onClick={getToBinary}>Convert</button>

      {status === "error" && <p>❌ Error occurred.</p>}
      {status === "success" && <p>✅ Result: {result}</p>}

      <h3>History (from localStorage):</h3>
      {myHistory.length === 0 ? (
        <p>No history yet.</p>
      ) : (
        <ul>
          {myHistory.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
