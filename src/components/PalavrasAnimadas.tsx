import { Fragment } from "react";

export function Palavras({
  texto,
  inicio = 0,
  passo = 0.2,
}: {
  texto: string;
  inicio?: number;
  passo?: number;
}) {
  return (
    <span className="palavras" aria-label={texto}>
      {texto.split(" ").map((p, i) => (
        <Fragment key={i}>
          <span
            aria-hidden="true"
            style={{ animationDelay: `${inicio + i * passo}s` }}
          >
            {p}
          </span>{" "}
        </Fragment>
      ))}
    </span>
  );
}
