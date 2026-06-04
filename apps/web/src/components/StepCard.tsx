import { Icon, hasIcon } from "./Icon";
import type { Density, StepDoc } from "@/lib/types";

function StatusIndicator({ status }: { status: StepDoc["status"] }) {
  if (status === "success")
    return (
      <span className="check">
        <Icon name="check" size={15} />
      </span>
    );
  if (status === "recover" || status === "failed")
    return (
      <span className="warn">
        <Icon name="warn" size={15} />
      </span>
    );
  if (status === "running") return <span className="spinner" />;
  return <span className="dot queued" />;
}

export function StepCard({
  step,
  density,
}: {
  step: StepDoc;
  density: Density;
}) {
  const isActive = step.status === "running";
  const isRecover = step.status === "recover";
  const isFailed = step.status === "failed";
  const showThought =
    density === "expanded" || isActive || isRecover || isFailed;

  const cls = ["step"];
  if (density === "compact") cls.push("compact");
  if (isActive) cls.push("is-active");
  if (step.status === "queued" || step.status === "pending") cls.push("is-pending");
  if (isRecover) cls.push("is-recover");
  if (isFailed) cls.push("is-failed");

  const kindName = hasIcon(step.kind) ? step.kind : "navigate";

  return (
    <div className={cls.join(" ")}>
      <div className="step-ico">
        <Icon name={kindName} size={15} />
      </div>
      <div className="step-body">
        <div className="step-top">
          <span className="step-kind">{step.kind}</span>
          <span className="step-status">
            <StatusIndicator status={step.status} />
          </span>
        </div>
        <div className="step-label">{step.label}</div>
        {showThought && step.thought ? (
          // thought is built server-side from known token spans (escaped text) — safe markup
          <div
            className="step-thought"
            dangerouslySetInnerHTML={{ __html: step.thought }}
          />
        ) : null}
        {(isRecover || isFailed) && step.recoverNote ? (
          <div className="recover-note">
            <Icon name="refresh" size={13} />
            {step.recoverNote}
          </div>
        ) : null}
      </div>
    </div>
  );
}
