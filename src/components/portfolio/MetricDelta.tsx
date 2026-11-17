import type { Metric } from "@/lib/delta";

/** 개선 수치. 이전 값은 흐리게, 이후 값은 강조한다. 이전 값이 없으면(수상 등) 내용만 보여준다. */
export function MetricDelta({ metric }: { metric: Metric }) {
  return (
    <div className="metric">
      <small>{metric.label}</small>
      {metric.before ? (
        <span className="delta">
          <span className="delta-before">{metric.before}</span> → <strong className="delta-after">{metric.after}</strong>
        </span>
      ) : (
        <span className="metric-text">{metric.after}</span>
      )}
    </div>
  );
}
