import { MouseEvent, useState } from "react";

interface ListGroupProps {
  items: string[];
  heading: string;
  onSelectItem: (event: MouseEvent, item: string) => void;
}

function ListGroup(props: ListGroupProps) {
  //hook
  const [selectedIdx, setSelectedIdx] = useState(-1);

  //Event Handler
  return (
    <>
      <h1>{props.heading}</h1>
      {props.items.length === 0 ? <p>No item found</p> : null}
      <ul className="list-group">
        {props.items.map((item, idx) => (
          <li
            className={
              selectedIdx === idx ? "list-group-item active" : "list-group-item"
            }
            key={item}
          >
            <a
              href={`https://${item}`}
              target="_blank"
              rel="noopener noreferrer"
              className="d-block w-100 px-2 py-1"
              onClick={() => setSelectedIdx(idx)} // ✅ 仅在用户点 <a> 时触发
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

export default ListGroup;
