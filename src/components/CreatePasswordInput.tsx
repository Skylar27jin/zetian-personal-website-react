export default function CreatePasswordInput({
  label,
  value,
  onChange,
  show,
  setShow,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  setShow: (v: boolean) => void;
  id: string;
}) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          marginBottom: "0.35rem",
          fontSize: "0.9rem",
          fontWeight: 500,
        }}
      >
        {label}
      </label>

      <div style={{ position: "relative" }}>
        {/* password input */}
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="It is a secret!"
          style={{
            width: "100%",
            padding: "0.65rem 2.8rem 0.65rem 0.8rem",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            fontSize: "0.95rem",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {/* eye button */}
        <button
          type="button"
          onClick={() => setShow(!show)}
          style={{
            position: "absolute",
            right: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "1.1rem",
            color: "#64748b",
          }}
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}