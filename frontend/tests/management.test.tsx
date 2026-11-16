import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoriesPage } from "@/features/categories/CategoriesPage";
import { IncomeSourcesPage } from "@/features/income-sources/IncomeSourcesPage";
import { installFakeBackend } from "./fakeBackend";
import { renderWithShellStub } from "./shell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/categories",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

let backend: ReturnType<typeof installFakeBackend>;

beforeEach(() => {
  backend = installFakeBackend();
  backend.state.signedInAs = "user@example.com";
  backend.state.accounts.set("user@example.com", { password: "x" });
});

const card = (name: string) => screen.getByRole("heading", { name }).closest("li") as HTMLElement;

describe("Expense categories (CAT-001..004)", () => {
  it("lists the built-in categories without edit or deactivate controls (DEC-013)", async () => {
    renderWithShellStub(<CategoriesPage />);
    expect(await screen.findByRole("heading", { name: "Groceries" })).toBeInTheDocument();
    for (const name of ["Groceries", "Transport", "Entertainment"]) {
      expect(within(card(name)).getByText("Built-in categories can’t be changed")).toBeInTheDocument();
      expect(within(card(name)).queryByRole("button")).not.toBeInTheDocument();
    }
  });

  it("adds a category and shows it once the server confirms", async () => {
    const user = userEvent.setup();
    const { actions } = renderWithShellStub(<CategoriesPage />);
    await screen.findByRole("heading", { name: "Groceries" });
    await user.click(screen.getByRole("button", { name: "Add category" }));
    const dialog = await screen.findByRole("dialog", { name: "Add category" });
    await user.type(within(dialog).getByLabelText(/^Category name/), "  Books ");
    await user.selectOptions(within(dialog).getByLabelText("Spending group"), "CULTURE");
    await user.click(within(dialog).getByRole("button", { name: "Save category" }));

    expect(await screen.findByRole("heading", { name: "Books" })).toBeInTheDocument();
    expect(actions.notify).toHaveBeenCalledWith("Category added");
    const [post] = backend.callsTo("/api/v1/categories").filter((c) => c.method === "POST");
    expect(post.body).toEqual({ name: "Books", group: "CULTURE" });
  });

  it("explains a duplicate name and reports no success", async () => {
    const user = userEvent.setup();
    const { actions } = renderWithShellStub(<CategoriesPage />);
    await screen.findByRole("heading", { name: "Groceries" });
    await user.click(screen.getByRole("button", { name: "Add category" }));
    const dialog = await screen.findByRole("dialog", { name: "Add category" });
    await user.type(within(dialog).getByLabelText(/^Category name/), "groceries");
    await user.click(within(dialog).getByRole("button", { name: "Save category" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("You already have a category with this name.");
    expect(actions.notify).not.toHaveBeenCalled();
  });

  it("requires a name before sending", async () => {
    const user = userEvent.setup();
    renderWithShellStub(<CategoriesPage />);
    await screen.findByRole("heading", { name: "Groceries" });
    await user.click(screen.getByRole("button", { name: "Add category" }));
    const dialog = await screen.findByRole("dialog", { name: "Add category" });
    await user.click(within(dialog).getByRole("button", { name: "Save category" }));

    expect(await within(dialog).findByText("Enter a category name.")).toBeInTheDocument();
    expect(backend.callsTo("/api/v1/categories").filter((c) => c.method === "POST")).toHaveLength(0);
  });

  it("edits a custom category, sending only what changed", async () => {
    const user = userEvent.setup();
    backend.state.customCategories.push({ id: "cat-c1", name: "Books", group: "CULTURE", isDefault: false, active: true });
    renderWithShellStub(<CategoriesPage />);
    await screen.findByRole("heading", { name: "Books" });
    await user.click(screen.getByRole("button", { name: "Edit Books" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit category" });
    const name = within(dialog).getByLabelText(/^Category name/);
    await user.clear(name);
    await user.type(name, "Courses");
    await user.click(within(dialog).getByRole("button", { name: "Save category" }));

    expect(await screen.findByRole("heading", { name: "Courses" })).toBeInTheDocument();
    const [patch] = backend.callsTo("/api/v1/categories/cat-c1").filter((c) => c.method === "PATCH");
    expect(patch.body).toEqual({ name: "Courses" });
  });

  it("deactivates a custom category after confirmation and can show it again", async () => {
    const user = userEvent.setup();
    backend.state.customCategories.push({ id: "cat-c1", name: "Books", group: "CULTURE", isDefault: false, active: true });
    renderWithShellStub(<CategoriesPage />);
    await screen.findByRole("heading", { name: "Books" });
    await user.click(screen.getByRole("button", { name: "Deactivate Books" }));
    const confirm = await screen.findByRole("dialog", { name: "Deactivate Books?" });
    await user.click(within(confirm).getByRole("button", { name: "Deactivate" }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Books" })).not.toBeInTheDocument());
    await user.click(screen.getByLabelText("Show inactive"));
    expect(await screen.findByRole("heading", { name: "Books" })).toBeInTheDocument();
    expect(within(card("Books")).getByText("Inactive")).toBeInTheDocument();
  });

  it("keeps the category and shows the error when deactivation fails", async () => {
    const user = userEvent.setup();
    backend.state.customCategories.push({ id: "cat-c1", name: "Books", group: "CULTURE", isDefault: false, active: true });
    renderWithShellStub(<CategoriesPage />);
    await screen.findByRole("heading", { name: "Books" });
    await user.click(screen.getByRole("button", { name: "Deactivate Books" }));
    const confirm = await screen.findByRole("dialog", { name: "Deactivate Books?" });
    backend.fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await user.click(within(confirm).getByRole("button", { name: "Deactivate" }));

    expect(await within(confirm).findByRole("alert")).toHaveTextContent("couldn't reach Divido");
    expect(backend.state.customCategories[0].active).toBe(true);
  });
});

describe("Income sources (INC-001..004)", () => {
  it("adds an income source after the server confirms", async () => {
    const user = userEvent.setup();
    const { actions } = renderWithShellStub(<IncomeSourcesPage />);
    await screen.findByRole("heading", { name: "Monthly Salary" });
    await user.click(screen.getByRole("button", { name: "Add income source" }));
    const dialog = await screen.findByRole("dialog", { name: "Add income source" });
    await user.type(within(dialog).getByLabelText(/^Income source name/), "Rent received");
    await user.click(within(dialog).getByRole("button", { name: "Save income source" }));

    expect(await screen.findByRole("heading", { name: "Rent received" })).toBeInTheDocument();
    expect(actions.notify).toHaveBeenCalledWith("Income source added");
  });

  it("shows the conflict and no success when the name exists", async () => {
    const user = userEvent.setup();
    const { actions } = renderWithShellStub(<IncomeSourcesPage />);
    await screen.findByRole("heading", { name: "Freelance" });
    await user.click(screen.getByRole("button", { name: "Add income source" }));
    const dialog = await screen.findByRole("dialog", { name: "Add income source" });
    await user.type(within(dialog).getByLabelText(/^Income source name/), "freelance");
    await user.click(within(dialog).getByRole("button", { name: "Save income source" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("You already have an income source with this name.");
    expect(actions.notify).not.toHaveBeenCalled();
  });

  it("renames and deactivates a source", async () => {
    const user = userEvent.setup();
    renderWithShellStub(<IncomeSourcesPage />);
    await screen.findByRole("heading", { name: "Freelance" });
    await user.click(screen.getByRole("button", { name: "Rename Freelance" }));
    const dialog = await screen.findByRole("dialog", { name: "Rename income source" });
    const name = within(dialog).getByLabelText(/^Income source name/);
    await user.clear(name);
    await user.type(name, "Contract work");
    await user.click(within(dialog).getByRole("button", { name: "Save income source" }));
    expect(await screen.findByRole("heading", { name: "Contract work" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Deactivate Contract work" }));
    await user.click(within(await screen.findByRole("dialog", { name: "Deactivate Contract work?" })).getByRole("button", { name: "Deactivate" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Contract work" })).not.toBeInTheDocument());
  });

  it("shows a load error with retry instead of an empty list", async () => {
    const user = userEvent.setup();
    const original = backend.fetchMock.getMockImplementation()!;
    backend.fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes("/api/v1/income-sources")) throw new TypeError("Failed to fetch");
      return original(input, init);
    });
    renderWithShellStub(<IncomeSourcesPage />);
    expect(await screen.findByText(/couldn't reach Divido/)).toBeInTheDocument();
    expect(screen.queryByText("No income sources yet")).not.toBeInTheDocument();

    backend.fetchMock.mockImplementation(original);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Monthly Salary" })).toBeInTheDocument();
  });
});
