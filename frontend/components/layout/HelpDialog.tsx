import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const STEPS = [
  ["Plan your month", "Set planned income, a savings target and an amount for each group."],
  ["Record activity", "Add expenses and income as they happen during the month."],
  ["Review the month", "Compare what you recorded with your plan on the dashboard."],
];

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How Divido works" onClose={onClose}>
      <div className="help-content">
        <Leaf size={38} strokeWidth={1.4} aria-hidden="true" />
        <p>Divido helps you plan, record and review your spending across four groups.</p>
        <ol className="help-steps">
          {STEPS.map(([title, text], i) => (
            <li key={title}>
              <span aria-hidden="true">{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <Button variant="primary" onClick={onClose}>
          Got it
        </Button>
      </div>
    </Modal>
  );
}
