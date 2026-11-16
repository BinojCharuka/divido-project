import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReflectionPage } from "@/features/reflection/ReflectionPage";
import type { Reflection } from "@/types/reflection";
import { apiError, installPhase03Backend, json } from "./phase03Backend";
import { renderWithShellStub } from "./shell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/reflection",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const PATH = "/api/v1/reflections/2026-10";

const SAVED: Reflection = {
  month: "2026-10",
  questionSetVersion: 1,
  version: 3,
  answers: [{ questionId: "what-went-well", answer: "Stayed within Needs." }],
  createdAt: "2026-10-30T10:00:00Z",
  updatedAt: "2026-10-31T10:00:00Z",
};

function Harness({ initial = "2026-10" }: { initial?: string }) {
  const [month, setMonth] = useState(initial);
  return <ReflectionPage month={month} onMonthChange={setMonth} />;
}

const question = (text: string) => screen.getByRole("textbox", { name: new RegExp(text) });

let backend: ReturnType<typeof installPhase03Backend>;

beforeEach(() => {
  backend = installPhase03Backend();
  backend.on("GET", "/api/v1/auth/me", () => apiError(401, "UNAUTHENTICATED", "Please sign in to continue."));
  backend.on("GET", "/api/v1/reflections", () => json(200, { items: [] }));
});

describe("Monthly reflection (REFLECTION-001..004)", () => {
  it("shows the three optional questions and saves only non-empty answers without a version", async () => {
    const user = userEvent.setup();
    backend.on("GET", PATH, () => apiError(404, "REFLECTION_NOT_FOUND", "No reflection has been saved for this month."));
    backend.on("PUT", PATH, ({ body }) => {
      const answers = (body as { answers: { questionId: string; answer: string }[] }).answers.filter((a) => a.answer.trim());
      return json(200, { ...SAVED, version: 1, answers });
    });
    const { actions } = renderWithShellStub(<Harness />);

    expect(await screen.findByRole("heading", { name: "Looking back on October 2026" })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(3);
    expect(screen.getByText(/inspired by Kakeibo/)).toBeInTheDocument();
    await user.type(question("What would you like to change"), "Review small purchases.");
    await user.click(screen.getByRole("button", { name: "Save reflection" }));

    await waitFor(() => expect(actions.notify).toHaveBeenCalledWith("Reflection saved"));
    const put = backend.calls.find((c) => c.method === "PUT")!;
    expect(put.body).not.toHaveProperty("version");
    expect(put.headers["X-XSRF-TOKEN"]).toBe("csrf-token");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete reflection" })).toBeInTheDocument();
  });

  it("blocks an all-blank first save on the client", async () => {
    const user = userEvent.setup();
    backend.on("GET", PATH, () => apiError(404, "REFLECTION_NOT_FOUND", "none"));
    renderWithShellStub(<Harness />);
    await screen.findByRole("heading", { name: "Looking back on October 2026" });
    await user.click(screen.getByRole("button", { name: "Save reflection" }));
    expect(await screen.findByText("Write an answer to at least one question before saving.")).toBeInTheDocument();
    expect(backend.calls.some((c) => c.method === "PUT")).toBe(false);
  });

  it("edits with the version last read", async () => {
    const user = userEvent.setup();
    backend.on("GET", PATH, () => json(200, SAVED));
    backend.on("PUT", PATH, () => json(200, { ...SAVED, version: 4 }));
    const { actions } = renderWithShellStub(<Harness />);
    expect(await screen.findByDisplayValue("Stayed within Needs.")).toBeInTheDocument();
    await user.type(question("What felt difficult"), "A surprise repair.");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(actions.notify).toHaveBeenCalledWith("Reflection updated"));
    expect(backend.calls.find((c) => c.method === "PUT")!.body).toMatchObject({ version: 3 });
  });

  it("keeps the text and offers the latest version after a conflict (DEC-039)", async () => {
    const user = userEvent.setup();
    backend.once("GET", PATH, () => json(200, SAVED));
    backend.on("GET", PATH, () => json(200, { ...SAVED, version: 5, answers: [{ questionId: "what-went-well", answer: "From the other tab." }] }));
    backend.on("PUT", PATH, () => apiError(409, "REFLECTION_CONFLICT", "changed"));
    const { actions } = renderWithShellStub(<Harness />);
    await screen.findByDisplayValue("Stayed within Needs.");
    await user.type(question("What felt difficult"), "My edit.");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText(/changed in another tab or on another device/)).toBeInTheDocument();
    expect(question("What felt difficult")).toHaveValue("My edit.");
    expect(actions.notify).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByDisplayValue("From the other tab.")).toBeInTheDocument();
  });

  it("counts characters as the server does and blocks answers over 2,000", async () => {
    const user = userEvent.setup();
    backend.on("GET", PATH, () => apiError(404, "REFLECTION_NOT_FOUND", "none"));
    renderWithShellStub(<Harness />);
    await screen.findByRole("heading", { name: "Looking back on October 2026" });
    const box = question("What went well");
    await user.click(box);
    await user.paste("😀".repeat(2001));
    expect(screen.getByText("2,001 / 2,000")).toHaveClass("over-limit");
    await user.click(screen.getByRole("button", { name: "Save reflection" }));
    expect(await screen.findByText("Answers can be at most 2,000 characters.")).toBeInTheDocument();
    expect(backend.calls.some((c) => c.method === "PUT")).toBe(false);
  });

  it("shows server field errors next to the question", async () => {
    const user = userEvent.setup();
    backend.on("GET", PATH, () => apiError(404, "REFLECTION_NOT_FOUND", "none"));
    backend.on("PUT", PATH, () =>
      apiError(400, "VALIDATION_ERROR", "Please correct the highlighted fields.", { "answers.what-went-well": "Answers can be at most 2000 characters." }),
    );
    renderWithShellStub(<Harness />);
    await screen.findByRole("heading", { name: "Looking back on October 2026" });
    await user.type(question("What went well"), "x");
    await user.click(screen.getByRole("button", { name: "Save reflection" }));
    expect(await screen.findByText("Answers can be at most 2000 characters.")).toBeInTheDocument();
    expect(question("What went well")).toHaveAttribute("aria-invalid", "true");
  });

  it("deletes permanently after confirmation", async () => {
    const user = userEvent.setup();
    backend.on("GET", PATH, () => json(200, SAVED));
    backend.on("DELETE", PATH, () => new Response(null, { status: 204 }));
    const { actions } = renderWithShellStub(<Harness />);
    await screen.findByDisplayValue("Stayed within Needs.");
    await user.click(screen.getByRole("button", { name: "Delete reflection" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("permanently deleted");
    await user.click(within(dialog).getByRole("button", { name: "Delete reflection" }));
    await waitFor(() => expect(actions.notify).toHaveBeenCalledWith("Reflection deleted"));
    expect(question("What went well")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Save reflection" })).toBeInTheDocument();
  });

  it("lists past reflections without answer text and switches month", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/reflections", () =>
      json(200, { items: [{ month: "2026-09", answeredCount: 2, updatedAt: "2026-09-30T10:00:00Z" }] }),
    );
    backend.on("GET", PATH, () => apiError(404, "REFLECTION_NOT_FOUND", "none"));
    backend.on("GET", "/api/v1/reflections/2026-09", () => json(200, { ...SAVED, month: "2026-09" }));
    renderWithShellStub(<Harness />);
    const history = await screen.findByRole("region", { name: "Your reflections" });
    expect(history).toHaveTextContent("2 of 3 answered");
    await user.click(within(history).getByRole("button", { name: /September 2026/ }));
    expect(await screen.findByRole("heading", { name: "Looking back on September 2026" })).toBeInTheDocument();
  });

  it("does not load or save a month that has not started", async () => {
    renderWithShellStub(<Harness initial="2099-01" />);
    expect(await screen.findByRole("heading", { name: "January 2099 hasn’t started yet" })).toBeInTheDocument();
    expect(backend.calls.some((c) => c.path.startsWith("/api/v1/reflections"))).toBe(false);
  });

  it("shows a load error with retry", async () => {
    const user = userEvent.setup();
    backend.once("GET", PATH, () => apiError(500, "INTERNAL_ERROR", "boom"));
    backend.on("GET", PATH, () => json(200, SAVED));
    renderWithShellStub(<Harness />);
    expect(await screen.findByText(/couldn't load your reflection/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByDisplayValue("Stayed within Needs.")).toBeInTheDocument();
  });
});
