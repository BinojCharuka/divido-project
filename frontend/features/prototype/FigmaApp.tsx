"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Wallet,
  BookOpen,
  Settings,
  LogOut,
  Bell,
  Search,
  SlidersHorizontal,
  ShoppingBasket,
  Coffee,
  Bus,
  BriefcaseBusiness,
  GraduationCap,
  House,
  Heart,
  Wrench,
  MoreHorizontal,
  CalendarDays,
  CircleHelp,
  Leaf,
  Sparkles,
  Target,
  Pencil,
  Trash2,
  TriangleAlert,
  CheckCircle2,
  Menu,
  Utensils,
  CreditCard,
  Download,
  ShieldCheck,
  CircleUserRound,
  Sun,
  Moon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  listCategories,
  createCategory,
  updateCategory,
  deactivateCategory,
} from "@/lib/api/categories"
import {
  listIncomeSources,
  createIncomeSource,
  updateIncomeSource,
  deactivateIncomeSource,
} from "@/lib/api/income-sources"
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/api/transactions"
import { getBudget, saveBudget } from "@/lib/api/budgets"
import { getDashboard } from "@/lib/api/dashboard"
import { getProfile, updateProfile } from "@/lib/api/profile"
import { getReflection, saveReflection } from "@/lib/api/reflections"
import { getInsights } from "@/lib/api/insights"
import type { KakeiboGroup } from "@/types/category"
import { useAuth } from "@/lib/auth/AuthProvider"
import { register as authRegister } from "@/lib/auth/api"
import { ApiError } from "@/lib/api/client"

type Page = "Dashboard" | "Transactions" | "Budget" | "Insights" | "Monthly Reflection" | "Settings" | "Expense Categories" | "Income Sources"
const pagePaths: Record<Page, string> = {
  Dashboard: "/dashboard",
  Transactions: "/transactions",
  Budget: "/budget",
  Insights: "/insights",
  "Monthly Reflection": "/reflection",
  Settings: "/settings",
  "Expense Categories": "/categories",
  "Income Sources": "/income-sources",
}
const pageForPath = (path: string): Page =>
  path.startsWith("/transactions")
    ? "Transactions"
    : (Object.entries(pagePaths).find(
        ([, url]) => url === path,
      )?.[0] as Page | undefined ?? "Dashboard")
type Group = "Needs" | "Wants" | "Culture" | "Unexpected"
const toGroup = (g: string): Group => {
  const normalized = g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
  return (["Needs", "Wants", "Culture", "Unexpected"].includes(normalized) ? normalized : "Needs") as Group;
}
const toKakeibo = (g: Group): KakeiboGroup => g.toUpperCase() as KakeiboGroup;
const formatYearMonth = (mIndex: number): string => `2026-${String(mIndex + 1).padStart(2, "0")}`;

type Transaction = {
  id: number | string
  name: string
  category: string
  group: Group | "Income"
  amount: number
  date: string
  payment: string
  note: string
}
type Category = {
  id?: string
  name: string
  group: Group
  isDefault?: boolean
  active: boolean
}
const money = (value: number) =>
  `LKR ${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const groups: {
  name: Group
  icon: LucideIcon
  description: string
  planned: number
  spent: number
}[] = [
  {
    name: "Needs",
    icon: House,
    description: "The everyday essentials",
    planned: 120000,
    spent: 65000,
  },
  {
    name: "Wants",
    icon: Heart,
    description: "The things you enjoy",
    planned: 60000,
    spent: 21000,
  },
  {
    name: "Culture",
    icon: BookOpen,
    description: "Room to learn and grow",
    planned: 40000,
    spent: 9100,
  },
  {
    name: "Unexpected",
    icon: Wrench,
    description: "A little room for surprises",
    planned: 35000,
    spent: 5450,
  },
]
const initialCategories: Category[] = [
  { name: "Groceries", group: "Needs", active: true },
  { name: "Transport", group: "Needs", active: true },
  { name: "Rent & bills", group: "Needs", active: true },
  { name: "Dining out", group: "Wants", active: true },
  { name: "Shopping", group: "Wants", active: true },
  { name: "Books", group: "Culture", active: true },
  { name: "Courses", group: "Culture", active: true },
  { name: "Repairs", group: "Unexpected", active: true },
]
const initialTransactions: Transaction[] = [
  {
    id: 1,
    name: "Groceries",
    category: "Groceries",
    group: "Needs",
    amount: -2450,
    date: "2026-10-28",
    payment: "Cash",
    note: "Weekly groceries",
  },
  {
    id: 2,
    name: "Freelance project",
    category: "Freelance",
    group: "Income",
    amount: 12000,
    date: "2026-10-26",
    payment: "",
    note: "Website design project",
  },
  {
    id: 3,
    name: "Bus to work",
    category: "Transport",
    group: "Needs",
    amount: -320,
    date: "2026-10-25",
    payment: "Cash",
    note: "",
  },
  {
    id: 4,
    name: "Coffee with friends",
    category: "Dining out",
    group: "Wants",
    amount: -650,
    date: "2026-10-25",
    payment: "Cash",
    note: "",
  },
  {
    id: 5,
    name: "A new perspective",
    category: "Books",
    group: "Culture",
    amount: -1850,
    date: "2026-10-24",
    payment: "Debit card",
    note: "Books for the weekend",
  },
]
const navItems: {
  page: Page
  icon: LucideIcon
}[] = [
  { page: "Dashboard", icon: LayoutDashboard },
  { page: "Transactions", icon: ArrowLeftRight },
  { page: "Budget", icon: Wallet },
  { page: "Insights", icon: ChartNoAxesCombined },
]
function Button({
  children,
  variant = "secondary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "dark" | "destructive"
}) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  )
}
function IconButton({
  icon: Icon,
  label,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon
  label: string
}) {
  return (
    <button className="icon-button" aria-label={label} title={label} {...props}>
      <Icon size={19} />
    </button>
  )
}
function Modal({
  title,
  subtitle,
  children,
  onClose,
  className = "",
}: {
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-heading">
        <div>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <IconButton icon={X} label="Close dialog" onClick={onClose} />
      </div>
      {children}
    </dialog>
  )
}
function Brand() {
  return (
    <div className="brand">
      <span className="brand-symbol" aria-hidden="true">
        <span />
        <span />
      </span>
      <span>
        divido<span className="brand-dot">.</span>
      </span>
    </div>
  )
}
function GroupBadge({ group }: { group: Group }) {
  const symbol = { Needs: "❖", Wants: "★", Culture: "◈", Unexpected: "▲" }[
    group
  ]
  return (
    <span className={`group-badge pillar-${group.toLowerCase()}`}>
      <span aria-hidden="true">{symbol}</span>
      {group}
    </span>
  )
}
function TransactionIcon({ transaction }: { transaction: Transaction }) {
  const Icon =
    transaction.group === "Income"
      ? ArrowDownLeft
      : transaction.category === "Transport"
        ? Bus
        : transaction.category === "Books"
          ? BookOpen
          : transaction.category === "Dining out"
            ? Coffee
            : ShoppingBasket
  return (
    <span
      className={`transaction-icon ${
        transaction.group === "Income" ? "income-icon" : ""
      }`}
    >
      <Icon size={19} strokeWidth={1.7} />
    </span>
  )
}
function TransactionRows({
  transactions,
  onOpen,
  full = false,
  onAdd,
}: {
  transactions: Transaction[]
  onOpen: (t: Transaction) => void
  full?: boolean
  onAdd?: () => void
}) {
  return (
    <div className={`transaction-list ${full ? "full-list" : ""}`}>
      {transactions.length === 0 && (
        <div className="empty-state">
          <ArrowLeftRight size={30} />
          <h3>No transactions found</h3>
          <p>Record an expense or try changing your filters.</p>
          {onAdd && (
            <Button variant="primary" onClick={onAdd}>
              <Plus size={16} />
              Add Transaction
            </Button>
          )}
        </div>
      )}
      {transactions.map((t) => (
        <button
          key={t.id}
          className="transaction-row"
          onClick={() => onOpen(t)}
        >
          <TransactionIcon transaction={t} />
          <div className="transaction-description">
            <strong>{t.name}</strong>
            <span>
              {t.category === t.name ? t.group : `${t.category} · ${t.group}`}
            </span>
          </div>
          <span className="transaction-date">
            {new Date(`${t.date}T12:00:00`).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          {full && (
            <span className={`type-badge ${t.amount > 0 ? "type-income" : ""}`}>
              {t.amount > 0 ? "+ Income" : "− Expense"}
            </span>
          )}
          <span
            className={`transaction-amount ${t.amount > 0 ? "positive" : ""}`}
          >
            {t.amount > 0 ? "+" : "−"} {money(t.amount)}
          </span>
          <ChevronRight className="row-chevron" size={15} />
        </button>
      ))}
    </div>
  )
}
function BudgetCard({
  group,
  spent,
  planned,
  onClick,
}: {
  group: typeof groups[number]
  spent: number
  planned: number
  onClick?: () => void
}) {
  const percent =
    planned > 0 ? Math.round((spent / planned) * 100) : spent ? 100 : 0
  const over = spent > planned
  return (
    <button
      className={`budget-card pillar-${group.name.toLowerCase()} ${
        over ? "over-budget" : ""
      }`}
      onClick={onClick}
    >
      <div className="budget-card-top">
        <span className="group-icon">
          <group.icon size={19} strokeWidth={1.65} />
        </span>
        <GroupBadge group={group.name} />
        <ArrowUpRight size={16} className="budget-arrow" />
      </div>
      <div className="budget-value">
        {money(spent)}
        <span> spent</span>
      </div>
      <div className="budget-planned">of {money(planned)} planned</div>
      <div
        className={`progress-track ${over ? "striped" : ""}`}
        role="progressbar"
        aria-label={`${group.name} budget used`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={Math.max(100, percent)}
      >
        <span style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <div className="budget-card-bottom">
        <span>
          {over && <TriangleAlert size={12} />}
          {money(planned - spent)} {over ? "over plan" : "left"}
        </span>
        <strong>{percent}%</strong>
      </div>
    </button>
  )
}

export type { Page, Group }

export interface FigmaAppProps {
  initialPage?: Page
  initialAuthMode?: "Sign in" | "Create account"
  initialSignedOut?: boolean
}

export default function App({
  initialPage,
  initialAuthMode,
  initialSignedOut,
}: FigmaAppProps = {}) {
  const initialTransaction =
    typeof window !== "undefined"
      ? initialTransactions.find(
          (t) =>
            t.id ===
            Number(window.location.pathname.match(/^\/transactions\/(\d+)/)?.[1]),
        )
      : undefined
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.dataset.theme === "dark" ? "dark" : "light"
    }
    return "light"
  })
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = theme
      document.documentElement.style.colorScheme = theme
      try {
        localStorage.setItem("divido-theme", theme)
      } catch {
        // Theme switching still works when browser storage is unavailable.
      }
    }
  }, [theme])
  const themeToggle = (
    <IconButton
      icon={theme === "light" ? Moon : Sun}
      label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="icon-button theme-toggle"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    />
  )
  const [page, setPage] = useState<Page>(() => {
    if (initialPage) return initialPage
    if (typeof window !== "undefined") {
      return pageForPath(window.location.pathname)
    }
    return "Dashboard"
  })
  const [dataCleared, setDataCleared] = useState<boolean>(() => {
    try {
      return (
        typeof window !== "undefined" &&
        localStorage.getItem("divido-data-cleared") === "true"
      )
    } catch {
      return false
    }
  })
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      if (
        typeof window !== "undefined" &&
        localStorage.getItem("divido-data-cleared") === "true"
      ) {
        const saved = localStorage.getItem("divido-transactions")
        return saved ? JSON.parse(saved) : []
      }
    } catch {}
    return initialTransactions
  })
  useEffect(() => {
    if (dataCleared) {
      try {
        localStorage.setItem("divido-transactions", JSON.stringify(transactions))
      } catch {}
    }
  }, [transactions, dataCleared])
  const [plans, setPlans] = useState<Record<Group, number>>({
    Needs: 120000,
    Wants: 60000,
    Culture: 40000,
    Unexpected: 35000,
  })
  const [plannedIncome, setPlannedIncome] = useState(285000)
  const [savings, setSavings] = useState(30000)
  const [month, setMonth] = useState(9)
  const [modal, setModal] =
    useState<"expense" | "income" | "add" | "detail" | "delete" | "notifications" | "help" | "insight" | "category" | "source" | "signout" | "clear-data" | null>(
      () =>
        window.location.pathname.endsWith("/edit") && initialTransaction
          ? initialTransaction.amount > 0
            ? "income"
            : "expense"
          : window.location.pathname === "/transactions/new-expense"
            ? "expense"
            : window.location.pathname === "/transactions/new-income"
              ? "income"
              : initialTransaction
                ? "detail"
                : null,
    )
  const [selected, setSelected] = useState<Transaction | null>(
    initialTransaction ?? null,
  )
  const [toast, setToast] = useState("")
  const [profileOpen, setProfileOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("All types")
  const [groupFilter, setGroupFilter] = useState("All groups")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [reflectionHidden, setReflectionHidden] = useState(false)
  const [reflections, setReflections] = useState(["", "", ""])
  const [reflectionSaved, setReflectionSaved] = useState(false)
  const { status: authStatus, user: authUser, signIn: authSignIn, signOut: authSignOut } = useAuth()
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authConfirmPassword, setAuthConfirmPassword] = useState("")
  const [authName, setAuthName] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const [userName, setUserName] = useState(() => (authUser?.email ? authUser.email.split("@")[0] : "Divido User"))
  const [email, setEmail] = useState(() => authUser?.email ?? "")
  const [categories, setCategories] = useState(initialCategories)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [sources, setSources] = useState([
    "Salary",
    "Freelance",
    "Allowance",
    "Other",
  ])
  const [sourceIds, setSourceIds] = useState<Record<string, string>>({})
  const [editingSource, setEditingSource] = useState<string | null>(null)
  const [inactiveSources, setInactiveSources] = useState<string[]>([])

  // Keep user profile in sync with real auth session
  useEffect(() => {
    if (authStatus === "signed-in" && authUser) {
      setEmail(authUser.email)
      setUserName(authUser.email.split("@")[0])
      setSignedOut(false)
    }
  }, [authStatus, authUser])

  useEffect(() => {
    let active = true
    async function syncBackendData() {
      try {
        const monthStr = formatYearMonth(month)
        const [backendCats, backendSources, backendProfile, backendTx, backendBudget, backendReflection] =
          await Promise.allSettled([
            listCategories(true),
            listIncomeSources(true),
            getProfile(),
            listTransactions({ size: 100 }),
            getBudget(monthStr),
            getReflection(monthStr),
          ])

        if (!active) return

        if (backendCats.status === "fulfilled" && backendCats.value.length > 0) {
          setCategories(
            backendCats.value.map((bc) => ({
              id: bc.id,
              name: bc.name,
              group: toGroup(bc.group),
              isDefault: bc.isDefault,
              active: bc.active,
            })),
          )
        }

        if (backendSources.status === "fulfilled" && backendSources.value.length > 0) {
          setSources(backendSources.value.map((bs) => bs.name))
          const idMap: Record<string, string> = {}
          backendSources.value.forEach((bs) => {
            idMap[bs.name] = bs.id
          })
          setSourceIds(idMap)
          setInactiveSources(
            backendSources.value.filter((bs) => !bs.active).map((bs) => bs.name),
          )
        }

        if (backendProfile.status === "fulfilled" && backendProfile.value) {
          if (backendProfile.value.displayName) {
            setUserName(backendProfile.value.displayName)
          }
          if (backendProfile.value.email) {
            setEmail(backendProfile.value.email)
          }
        }

        if (backendTx.status === "fulfilled" && backendTx.value && backendTx.value.items) {
          if (backendTx.value.items.length > 0) {
            const mapped: Transaction[] = backendTx.value.items.map((t) => {
              const isInc = t.type === "INCOME"
              return {
                id: t.id,
                name:
                  t.description ||
                  (isInc
                    ? (t.incomeSource?.name ?? "Income")
                    : (t.category?.name ?? "Expense")),
                category: isInc
                  ? (t.incomeSource?.name ?? "Income")
                  : (t.category?.name ?? "Groceries"),
                group: isInc ? "Income" : toGroup(t.category?.group ?? "NEEDS"),
                amount: Number(t.amount) * (isInc ? 1 : -1),
                date: t.date,
                payment: t.paymentMethod ?? "",
                note: t.description ?? "",
              }
            })
            setTransactions(mapped)
          }
        }

        if (backendBudget.status === "fulfilled" && backendBudget.value) {
          const b = backendBudget.value
          if (
            Number(b.plannedIncome) > 0 ||
            Number(b.savingsTarget) > 0 ||
            Number(b.allocationTotal) > 0
          ) {
            setPlannedIncome(Number(b.plannedIncome))
            setSavings(Number(b.savingsTarget))
            setPlans({
              Needs: Number(b.allocations?.NEEDS ?? 0),
              Wants: Number(b.allocations?.WANTS ?? 0),
              Culture: Number(b.allocations?.CULTURE ?? 0),
              Unexpected: Number(b.allocations?.UNEXPECTED ?? 0),
            })
          }
        }

        if (backendReflection.status === "fulfilled" && backendReflection.value) {
          const r = backendReflection.value
          if (r.answers && r.answers.length > 0) {
            const q1 =
              r.answers.find((a) => a.questionId === "what-went-well")?.answer ?? ""
            const q2 =
              r.answers.find((a) => a.questionId === "what-felt-difficult")?.answer ?? ""
            const q3 =
              r.answers.find((a) => a.questionId === "what-to-change")?.answer ?? ""
            setReflections([q1, q2, q3])
            setReflectionSaved(true)
          }
        }
      } catch {
        // Fallback to sample data when unauthenticated or offline
      }
    }
    if (authStatus === "signed-in") {
      void syncBackendData()
    }
    return () => {
      active = false
    }
  }, [authStatus, month])

  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [formCategory, setFormCategory] = useState(
    initialTransaction?.category ?? "Groceries",
  )
  const [period, setPeriod] = useState("Last 90 days")
  const [onboardStep, setOnboardStep] = useState<number | null>(() =>
    window.location.pathname === "/onboarding" ? 0 : null,
  )
  const [signedOut, setSignedOut] = useState(() => {
    if (initialSignedOut !== undefined) return initialSignedOut
    if (typeof window !== "undefined") {
      return ["/sign-in", "/sign-up"].includes(window.location.pathname)
    }
    return false
  })
  const [authMode, setAuthMode] = useState<"Sign in" | "Create account" | "Recover access">(() => {
    if (initialAuthMode) return initialAuthMode
    if (typeof window !== "undefined" && window.location.pathname === "/sign-up") {
      return "Create account"
    }
    return "Sign in"
  })

  async function handleSignIn(e: FormEvent) {
    e.preventDefault()
    if (!authEmail.trim() || !authPassword) {
      setAuthError("Email and password are required.")
      return
    }
    setAuthLoading(true)
    setAuthError(null)
    try {
      const loggedIn = await authSignIn({
        email: authEmail.trim(),
        password: authPassword,
      })
      setEmail(loggedIn.email)
      setUserName(loggedIn.email.split("@")[0])
      setSignedOut(false)
      setAuthPassword("")
      notify(`Welcome back, ${loggedIn.email}!`)
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : "The email or password is incorrect."
      setAuthError(msg)
      notify(msg)
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleCreateAccount(e: FormEvent) {
    e.preventDefault()
    if (!authEmail.trim() || !authPassword) {
      setAuthError("Email and password are required.")
      return
    }
    if (authPassword.length < 8) {
      setAuthError("Password must be at least 8 characters.")
      return
    }
    if (authPassword !== authConfirmPassword) {
      setAuthError("Passwords do not match.")
      return
    }
    setAuthLoading(true)
    setAuthError(null)
    try {
      await authRegister({
        email: authEmail.trim(),
        password: authPassword,
        displayName: authName.trim() || authEmail.trim().split("@")[0],
      })
      notify("Account created successfully! Please sign in.")
      setAuthMode("Sign in")
      setAuthPassword("")
      setAuthConfirmPassword("")
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : "We couldn't create an account with these details."
      setAuthError(msg)
      notify(msg)
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleSignOut() {
    setModal(null)
    try {
      await authSignOut()
      notify("Signed out successfully.")
    } catch {
      setSignedOut(true)
    }
  }
  const [draftPlan, setDraftPlan] = useState(plans)
  const [draftIncome, setDraftIncome] = useState(plannedIncome)
  const [draftSavings, setDraftSavings] = useState(savings)
  const mainRef = useRef<HTMLElement>(null)
  const currentPath = signedOut
    ? authMode === "Create account"
      ? "/sign-up"
      : "/sign-in"
    : onboardStep !== null
      ? "/onboarding"
      : modal === "expense" || modal === "income"
        ? selected
          ? `/transactions/${selected.id}/edit`
          : `/transactions/new-${modal}`
        : selected && (modal === "detail" || modal === "delete")
          ? `/transactions/${selected.id}`
          : pagePaths[page]
  useEffect(() => {
    if (window.location.pathname !== currentPath) {
      if (window.location.pathname === "/")
        window.history.replaceState(null, "", currentPath)
      else window.history.pushState(null, "", currentPath)
    }
  }, [currentPath])
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname
      setPage(pageForPath(path))
      setSignedOut(["/sign-in", "/sign-up"].includes(path))
      setAuthMode(path === "/sign-up" ? "Create account" : "Sign in")
      setOnboardStep(path === "/onboarding" ? 0 : null)
      const record = transactions.find(
        (t) => t.id === Number(path.match(/^\/transactions\/(\d+)/)?.[1]),
      )
      setSelected(record ?? null)
      setFormCategory(
        record?.category ?? categories.find((c) => c.active)?.name ?? "",
      )
      setModal(
        path === "/transactions/new-expense"
          ? "expense"
          : path === "/transactions/new-income"
            ? "income"
            : record
              ? path.endsWith("/edit")
                ? record.amount > 0
                  ? "income"
                  : "expense"
                : "detail"
              : null,
      )
      setProfileOpen(false)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [transactions, categories])
  const monthName = new Date(2026, month).toLocaleDateString("en-US", {
    month: "long",
  })
  const isSampleMonth = !dataCleared && month === 9
  const monthTransactions = transactions.filter(
    (t) => new Date(`${t.date}T12:00:00`).getMonth() === month,
  )
  // The sample month includes earlier activity, beyond the five recent records.
  const earlierSampleExpenses =
    100550 -
    initialTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum - t.amount, 0)
  const spent =
    (isSampleMonth ? earlierSampleExpenses : 0) +
    monthTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum - t.amount, 0)
  const income =
    (isSampleMonth ? 285000 - 12000 : 0) +
    monthTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
  const groupSpent = (group: Group) => {
    const base = isSampleMonth ? groups.find((g) => g.name === group)!.spent : 0
    const before = isSampleMonth
      ? initialTransactions
          .filter((t) => t.group === group)
          .reduce((sum, t) => sum - t.amount, 0)
      : 0
    return (
      base -
      before +
      monthTransactions
        .filter((t) => t.group === group)
        .reduce((sum, t) => sum - t.amount, 0)
    )
  }
  const available = plannedIncome - savings
  const remaining = available - spent
  const spendingPercent =
    available > 0 ? Math.round((spent / available) * 100) : spent > 0 ? 100 : 0
  const notify = (message: string) => setToast(message)
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4500)
      return () => clearTimeout(timer)
    }
  }, [toast])
  const navigate = (next: Page) => {
    setPage(next)
    setModal(null)
    setProfileOpen(false)
    setSelected(null)
    mainRef.current?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }
  const openAdd = (type: "expense" | "income") => {
    setSelected(null)
    setFormCategory(categories.find((c) => c.active)?.name ?? "")
    setModal(type)
  }
  const openTransaction = (t: Transaction) => {
    setSelected(t)
    setFormCategory(t.category)
    setModal("detail")
  }
  const saveTransaction = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const category = String(data.get("category"))
    const isIncome = modal === "income" || (selected !== null && selected !== undefined && selected.amount > 0)
    const rawAmount = Number(data.get("amount"))
    const amountStr = rawAmount.toFixed(2)
    const dateStr = String(data.get("date"))
    const descriptionStr = String(data.get("description") ?? "").trim()
    const paymentMethodStr = String(data.get("payment") ?? "").trim()

    let savedId: string | number = selected?.id ?? Date.now()

    if (authStatus === "signed-in") {
      try {
        if (selected && typeof selected.id === "string" && selected.id.includes("-")) {
          if (isIncome) {
            const sourceId = sourceIds[category]
            const updated = await updateTransaction(selected.id, {
              amount: amountStr,
              date: dateStr,
              description: descriptionStr || undefined,
              paymentMethod: paymentMethodStr || undefined,
              incomeSourceId: sourceId || undefined,
            })
            savedId = updated.id
          } else {
            const categoryObj = categories.find((c) => c.name === category)
            const updated = await updateTransaction(selected.id, {
              amount: amountStr,
              date: dateStr,
              description: descriptionStr || undefined,
              paymentMethod: paymentMethodStr || undefined,
              categoryId: categoryObj?.id,
            })
            savedId = updated.id
          }
        } else {
          if (isIncome) {
            const sourceId = sourceIds[category]
            const created = await createTransaction({
              type: "INCOME",
              amount: amountStr,
              date: dateStr,
              description: descriptionStr || undefined,
              paymentMethod: paymentMethodStr || undefined,
              incomeSourceId: sourceId || undefined,
            })
            savedId = created.id
          } else {
            const categoryObj = categories.find((c) => c.name === category)
            const created = await createTransaction({
              type: "EXPENSE",
              amount: amountStr,
              date: dateStr,
              description: descriptionStr || undefined,
              paymentMethod: paymentMethodStr || undefined,
              categoryId: categoryObj?.id,
            })
            savedId = created.id
          }
        }
      } catch (err) {
        console.error("Backend transaction save error:", err)
      }
    }

    const t: Transaction = {
      id: savedId,
      name: descriptionStr || category,
      category,
      group: isIncome
        ? "Income"
        : selected && selected.category === category
          ? selected.group
          : (categories.find((c) => c.name === category)?.group ?? "Needs"),
      amount: rawAmount * (isIncome ? 1 : -1),
      date: dateStr,
      payment: paymentMethodStr,
      note: descriptionStr,
    }
    setTransactions((previous) =>
      selected
        ? previous.map((item) => (item.id === selected.id ? t : item))
        : [t, ...previous],
    )
    setMonth(new Date(`${t.date}T12:00:00`).getMonth())
    setModal(null)
    setSelected(null)
    notify(
      selected
        ? "Transaction updated"
        : isIncome
          ? "Income added"
          : "Expense saved",
    )
  }
  const filteredTransactions = monthTransactions
    .filter(
      (t) =>
        (!search ||
          `${t.name} ${t.category} ${t.group}`
            .toLowerCase()
            .includes(search.toLowerCase())) &&
        (typeFilter === "All types" ||
          (typeFilter === "Income" ? t.amount > 0 : t.amount < 0)) &&
        (groupFilter === "All groups" || t.group === groupFilter),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
  const MonthSelector = () => (
    <div className="month-selector">
      <CalendarDays size={16} />
      <select
        aria-label="Select month"
        value={month}
        onChange={(e) => setMonth(Number(e.target.value))}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <option key={i} value={i}>
            {new Date(2026, i).toLocaleDateString("en-US", { month: "long" })}{" "}
            2026
          </option>
        ))}
      </select>
      <ChevronDown size={14} />
    </div>
  )
  const transactionForm = (isIncome: boolean) => (
    <form onSubmit={saveTransaction} className="transaction-form">
      <label className="field">
        Amount <span className="required">*</span>
        <div className="money-input">
          <span>LKR</span>
          <input
            name="amount"
            type="number"
            min="1"
            max="999999999"
            step="0.01"
            placeholder="0.00"
            defaultValue={selected ? Math.abs(selected.amount) : ""}
            required
            autoFocus
          />
        </div>
      </label>
      <label className="field">
        {isIncome ? "Income source" : "Category"}
        {!isIncome && " *"}
        <select
          name="category"
          onChange={(e) => setFormCategory(e.target.value)}
          defaultValue={
            selected?.category ??
            (isIncome
              ? sources.find((s) => !inactiveSources.includes(s))
              : categories.find((c) => c.active)?.name)
          }
          required
        >
          {selected &&
            (isIncome
              ? !sources.includes(selected.category) ||
                inactiveSources.includes(selected.category)
              : !categories.some(
                  (c) => c.name === selected.category && c.active,
                )) && (
              <option value={selected.category}>
                {selected.category} · Previously recorded
              </option>
            )}
          {isIncome
            ? sources
                .filter((s) => !inactiveSources.includes(s))
                .map((s) => <option key={s}>{s}</option>)
            : categories
                .filter((c) => c.active)
                .map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} · {c.group}
                  </option>
                ))}
        </select>
        {!isIncome && categories.find((c) => c.name === formCategory) && (
          <GroupBadge
            group={categories.find((c) => c.name === formCategory)!.group}
          />
        )}
        <span className="field-help">
          {isIncome
            ? "A label for your income, not a connected account."
            : "Each category belongs to a Needs, Wants, Culture, or Unexpected group."}
        </span>
      </label>
      <label className="field">
        Date
        <input
          type="date"
          name="date"
          defaultValue={
            selected?.date ?? new Date().toLocaleDateString("en-CA")
          }
          required
        />
      </label>
      <label className="field">
        Description <span className="optional">Optional</span>
        <input
          name="description"
          placeholder={
            isIncome ? "What is this income for?" : "What was this expense for?"
          }
          defaultValue={selected?.note ?? ""}
          maxLength={120}
        />
      </label>
      {
        <label className="field">
          Payment method <span className="optional">Optional</span>
          <select name="payment" defaultValue={selected?.payment ?? ""}>
            <option value="">Select a payment method</option>
            <option>Cash</option>
            <option>Debit card</option>
            <option>Credit card</option>
            <option>Bank transfer</option>
            <option>Other</option>
          </select>
        </label>
      }
      <div className="inline-note">
        <ShieldCheck size={16} />
        <span>This is a manual record. No money is moved.</span>
      </div>
      <div className="modal-actions">
        {selected && (
          <Button
            type="button"
            variant="ghost"
            className="destructive-text edit-delete"
            onClick={() => setModal("delete")}
          >
            <Trash2 size={15} />
            Delete Transaction
          </Button>
        )}
        <Button
          type="button"
          onClick={() => {
            setModal(null)
            setSelected(null)
          }}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          <Check size={16} />
          {selected
            ? "Save changes"
            : isIncome
              ? "Save Income"
              : "Save Expense"}
        </Button>
      </div>
    </form>
  )

  if (signedOut)
    return (
      <div className="auth-page">
        <div className="auth-theme-toggle">{themeToggle}</div>
        <div className="auth-brand">
          <Brand />
        </div>
        <div className="auth-card">
          <span className="eyebrow">A LITTLE CLARITY, EVERY DAY</span>
          <h1>
            {authMode === "Sign in"
              ? "Sign In to Divido"
              : authMode === "Recover access"
                ? "A fresh start."
                : "Create Account"}
          </h1>
          <p>
            {authMode === "Recover access"
              ? "This prototype does not send recovery emails."
              : "A more mindful relationship with your money starts here."}
          </p>
          {authError && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#ef4444",
                fontSize: "13px",
                marginBottom: "16px",
              }}
              role="alert"
            >
              {authError}
            </div>
          )}
          <form
            onSubmit={(e) => {
              if (authMode === "Recover access") {
                e.preventDefault()
                notify("Demo only — no recovery email was sent")
                setAuthMode("Sign in")
              } else if (authMode === "Sign in") {
                void handleSignIn(e)
              } else {
                void handleCreateAccount(e)
              }
            }}
          >
            {authMode === "Create account" && (
              <label className="field">
                Name
                <input
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Your name"
                />
              </label>
            )}
            <label className="field">
              Email
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            {authMode !== "Recover access" && (
              <label className="field">
                Password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete={authMode === "Sign in" ? "current-password" : "new-password"}
                />
              </label>
            )}
            {authMode === "Create account" && (
              <label className="field">
                Confirm password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={authConfirmPassword}
                  onChange={(e) => setAuthConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
              </label>
            )}
            {authMode === "Sign in" && (
              <button
                type="button"
                className="text-button forgot"
                onClick={() => setAuthMode("Recover access")}
              >
                Recover access
              </button>
            )}
            <Button variant="primary" className="full-width" disabled={authLoading}>
              {authLoading
                ? "Please wait…"
                : authMode === "Recover access"
                  ? "Back to sign in"
                  : authMode === "Sign in"
                    ? "Sign In"
                    : "Create Account"}
              <ArrowRight size={17} />
            </Button>
          </form>
          <p className="auth-switch">
            {authMode === "Sign in"
              ? "New to Divido?"
              : "Already have an account?"}{" "}
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setAuthError(null)
                setAuthMode(
                  authMode === "Sign in" ? "Create account" : "Sign in",
                )
              }}
            >
              {authMode === "Sign in" ? "Create account" : "Sign in"}
            </button>
          </p>
          <div className="inline-note">
            Connects to your real Divido account and Spring Boot session.
          </div>
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setSignedOut(false)
                setPage("Dashboard")
              }}
              style={{ fontSize: "13px", color: "var(--accent-teal, #0D9488)" }}
            >
              ← Explore Divido Demo (without signing in)
            </button>
          </div>
        </div>
      </div>
    )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="sidebar-brand"
          aria-label="Divido dashboard"
          onClick={() => navigate("Dashboard")}
        >
          <Brand />
        </button>
        <div className="workspace-label">PERSONAL SPACE</div>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map(({ page: item, icon: Icon }) => (
            <button
              key={item}
              className={`nav-item ${page === item ? "active" : ""}`}
              aria-current={page === item ? "page" : undefined}
              onClick={() => navigate(item)}
            >
              <Icon size={19} strokeWidth={1.7} />
              <span>{item}</span>
              {page === item && <span className="active-dot" />}
            </button>
          ))}
          <div className="nav-divider" />
          <button
            className={`nav-item ${
              page === "Monthly Reflection" ? "active" : ""
            }`}
            aria-current={page === "Monthly Reflection" ? "page" : undefined}
            onClick={() => navigate("Monthly Reflection")}
          >
            <BookOpen size={19} strokeWidth={1.7} />
            <span>Monthly reflection</span>
            {page === "Monthly Reflection" && <span className="active-dot" />}
          </button>
          <button
            className={`nav-item ${
              ["Settings", "Expense Categories", "Income Sources"].includes(
                page,
              )
                ? "active"
                : ""
            }`}
            aria-current={page === "Settings" ? "page" : undefined}
            onClick={() => navigate("Settings")}
          >
            <Settings size={19} strokeWidth={1.7} />
            <span>Settings</span>
            {["Settings", "Expense Categories", "Income Sources"].includes(
              page,
            ) && <span className="active-dot" />}
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="mindful-card">
            <span className="mindful-icon">
              <Leaf size={20} strokeWidth={1.5} />
            </span>
            <strong>Small steps. Real clarity.</strong>
            <p>
              A little awareness today.
              <br />
              More room for tomorrow.
            </p>
            <button onClick={() => setModal("help")}>
              The Divido approach <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="help-link" onClick={() => setModal("help")}>
            <CircleHelp size={17} />
            Help & getting started
            <ArrowUpRight size={14} />
          </button>
          <div className="sidebar-user">
            <span className="avatar">
              {userName ? userName.slice(0, 2).toUpperCase() : "DV"}
            </span>
            <button onClick={() => navigate("Settings")}>
              <strong>{userName}</strong>
              <span>Personal account</span>
            </button>
            <IconButton
              icon={LogOut}
              label="Sign out"
              onClick={() => setModal("signout")}
            />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="header-content">
            <button
              className="header-brand"
              aria-label="Divido dashboard"
              onClick={() => navigate("Dashboard")}
            >
              <Brand />
            </button>
            <div className="header-location">
              <House size={15} />
              <span>/</span>
              <span>
                {page === "Monthly Reflection" ? "Monthly reflection" : page}
              </span>
            </div>
            <div className="header-actions">
              <span className="topbar-divider" />
              {themeToggle}
              <IconButton
                icon={Bell}
                label="Notifications"
                onClick={() => setModal("notifications")}
              />
              <div className="profile-wrap header-profile">
                <button
                  className="profile-button"
                  aria-label="Open profile menu"
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <span className="avatar avatar-small">
                    {userName ? userName.slice(0, 2).toUpperCase() : "DV"}
                  </span>
                  <ChevronDown size={15} />
                </button>
                {profileOpen && (
                  <div className="profile-dropdown">
                    <strong>{userName}</strong>
                    <span>{email}</span>
                    {[
                      {
                        name: "Spending insights",
                        page: "Insights" as Page,
                        icon: ChartNoAxesCombined,
                      },
                      {
                        name: "Monthly reflection",
                        page: "Monthly Reflection" as Page,
                        icon: BookOpen,
                      },
                      {
                        name: "Settings & preferences",
                        page: "Settings" as Page,
                        icon: Settings,
                      },
                    ].map(({ name, page: next, icon: Icon }) => (
                      <button key={name} onClick={() => navigate(next)}>
                        <Icon size={16} />
                        {name}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        setModal("help")
                      }}
                    >
                      <CircleHelp size={16} />
                      Help & getting started
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        setModal("signout")
                      }}
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main ref={mainRef} className="main-content">
          <div
            className={`page-heading ${
              page === "Dashboard" ? "dashboard-heading" : ""
            }`}
          >
            <div>
              {page !== "Dashboard" && (
                <div className="eyebrow">
                  {page === "Monthly Reflection"
                    ? "A MOMENT FOR YOURSELF"
                    : "YOUR PERSONAL SPACE"}
                </div>
              )}
              <h1>
                {page === "Dashboard"
                  ? `Good morning, ${userName}`
                  : page === "Budget"
                    ? "Monthly budget"
                    : page === "Monthly Reflection"
                      ? `Reflect on ${monthName} 2026`
                      : page === "Settings"
                        ? "Settings & Preferences"
                        : page === "Insights"
                          ? "Spending Insights"
                          : page}
                {page === "Dashboard" && (
                  <span className="title-period">.</span>
                )}
              </h1>
              <p>
                {page === "Dashboard"
                  ? "A clear view of your month. A little more peace of mind."
                  : page === "Transactions"
                    ? "The little details that make up your month."
                    : page === "Budget"
                      ? "Give every part of your month a little room."
                      : page === "Insights"
                        ? "A closer look at the way you spend."
                        : page === "Monthly Reflection"
                          ? "No right answers. Just a little space to look back and look ahead."
                          : "Make Divido feel a little more like you."}
              </p>
            </div>
            <div className="page-heading-actions">
              {![
                "Settings",
                "Insights",
                "Expense Categories",
                "Income Sources",
              ].includes(page) && <MonthSelector />}
              {page === "Dashboard" ? (
                <>
                  <Button variant="primary" onClick={() => openAdd("expense")}>
                    <Plus size={17} />
                    Add Expense
                  </Button>
                  <Button
                    variant="ghost"
                    className="dashboard-income-action"
                    onClick={() => openAdd("income")}
                  >
                    <Plus size={17} />
                    Add Income
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setModal("clear-data")}
                    title={dataCleared ? "Restart clean dashboard" : "Clear income and expenses data"}
                  >
                    <Trash2 size={16} />
                    Clear Data
                  </Button>
                </>
              ) : page === "Transactions" ? (
                <Button variant="primary" onClick={() => setModal("add")}>
                  <Plus size={17} />
                  Add transaction
                </Button>
              ) : page === "Expense Categories" ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditingCategory(null)
                    setModal("category")
                  }}
                >
                  <Plus size={17} />
                  Add Category
                </Button>
              ) : page === "Income Sources" ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditingSource(null)
                    setModal("source")
                  }}
                >
                  <Plus size={17} />
                  Add Income Source
                </Button>
              ) : page === "Insights" ? (
                <select
                  className="period-select"
                  aria-label="Insight period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>6 months</option>
                </select>
              ) : null}
            </div>
          </div>

          {page === "Dashboard" && (
            <>
              {dataCleared && transactions.length === 0 && (
                <div
                  className="panel"
                  style={{
                    marginBottom: "20px",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    borderRadius: "var(--radius-xl)",
                    background: "var(--surface-subdued)",
                    border: "1px dashed var(--line)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "var(--green-soft)",
                        color: "var(--green)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <strong style={{ display: "block", color: "var(--ink)", fontSize: "14px" }}>
                        Clean Slate Dashboard Active
                      </strong>
                      <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                        All previous income and expenses are cleared. Add your first record to start tracking!
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Button variant="primary" onClick={() => openAdd("income")}>
                      <Plus size={15} /> Add Income
                    </Button>
                    <Button variant="secondary" onClick={() => openAdd("expense")}>
                      <Plus size={15} /> Add Expense
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setTransactions(initialTransactions)
                        setDataCleared(false)
                        try {
                          localStorage.removeItem("divido-data-cleared")
                          localStorage.removeItem("divido-transactions")
                        } catch {}
                        notify("Sample demo transactions restored.")
                      }}
                    >
                      Restore demo data
                    </Button>
                  </div>
                </div>
              )}
              <div className="overview-grid">
                {[
                  {
                    label: "Planned income",
                    value: plannedIncome,
                    icon: Wallet,
                    hint: "Your plan for this month",
                    className: "",
                  },
                  {
                    label: "Recorded income",
                    value: income,
                    icon: ArrowDownLeft,
                    hint: "Income you’ve added",
                    className: "",
                  },
                  {
                    label: "Spent this month",
                    value: spent,
                    icon: ArrowUpRight,
                    hint: "Across all four groups",
                    className: "",
                  },
                  {
                    label: "Savings target",
                    value: savings,
                    icon: Target,
                    hint: "A little for your future",
                    className: "savings-stat",
                  },
                ].map(({ label, value, icon: Icon, hint, className }) => (
                  <div className={`summary-card ${className}`} key={label}>
                    <div className="summary-label">
                      {label}
                      <Icon size={17} strokeWidth={1.7} />
                    </div>
                    <div className="summary-value">
                      <span>LKR</span>{" "}
                      {value.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="summary-hint">
                      {className && <span className="tiny-dot" />}
                      {hint}
                    </div>
                  </div>
                ))}
              </div>
              <section className="budget-section">
                <div className="section-heading">
                  <div>
                    <h2>
                      Your budget{" "}
                      <span className="subtle-tag">{monthName}</span>
                    </h2>
                    <p>A place for what you need, and what matters to you.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("Budget")}
                  >
                    Manage budget <ArrowRight size={15} />
                  </button>
                </div>
                <div className="budget-grid">
                  {groups.map((group) => (
                    <BudgetCard
                      key={group.name}
                      group={group}
                      spent={groupSpent(group.name)}
                      planned={plans[group.name]}
                      onClick={() => navigate("Budget")}
                    />
                  ))}
                </div>
              </section>
              <div className="dashboard-lower">
                <section className="recent-section panel">
                  <div className="section-heading panel-heading">
                    <div>
                      <h2>Recent transactions</h2>
                      <p>A few moments from your month.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate("Transactions")}
                    >
                      View all <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="transaction-table-header">
                    <span>TRANSACTION</span>
                    <span>DATE</span>
                    <span>AMOUNT</span>
                  </div>
                  <TransactionRows
                    transactions={monthTransactions.slice(0, 5)}
                    onOpen={openTransaction}
                    onAdd={() => setModal("add")}
                  />
                  <div className="recent-footer">
                    <span>
                      <ShieldCheck size={14} /> Manually recorded. Always in
                      your control.
                    </span>
                    <button
                      className="text-button"
                      onClick={() => openAdd("income")}
                    >
                      <Plus size={14} />
                      Add income
                    </button>
                  </div>
                </section>
                <div className="dashboard-side">
                  <section className="money-summary">
                    <div className="money-summary-heading">
                      <span>Room for the rest of your month</span>
                      <span className="dark-icon">
                        <Wallet size={18} strokeWidth={1.5} />
                      </span>
                    </div>
                    <div className="remaining-amount">
                      <span>LKR</span> {Math.abs(remaining).toLocaleString()}
                    </div>
                    <div className="remaining-label">
                      {remaining >= 0
                        ? "Budget remaining"
                        : "Over your spending plan"}
                      <span>{spendingPercent}% used</span>
                    </div>
                    <div className="dark-progress">
                      <span
                        style={{
                          width: `${Math.min(100, Math.max(0, spendingPercent))}%`,
                        }}
                      />
                    </div>
                    <div className="money-calculation">
                      <div>
                        <span>Planned income</span>
                        <strong>{money(plannedIncome)}</strong>
                      </div>
                      <div>
                        <span>− Savings target</span>
                        <strong>{money(savings)}</strong>
                      </div>
                      <div className="calculation-divider">
                        <span>Available for spending</span>
                        <strong>{money(available)}</strong>
                      </div>
                      <div>
                        <span>− Spent this month</span>
                        <strong>{money(spent)}</strong>
                      </div>
                    </div>
                    <div className="money-summary-note">
                      Based on your plan, not a bank balance.
                    </div>
                  </section>
                </div>
              </div>
              <div className="dashboard-bottom">
                <section className="insight-banner">
                  <span className="banner-icon">
                    <Sparkles size={21} strokeWidth={1.5} />
                  </span>
                  <div>
                    <div className="small-overline">A LITTLE PERSPECTIVE</div>
                    <h3>
                      {isSampleMonth
                        ? "Your everyday essentials, in focus."
                        : "A fresh month. A fresh perspective."}
                    </h3>
                    <p>
                      {isSampleMonth
                        ? `Needs make up ${
                            spent
                              ? Math.round((groupSpent("Needs") / spent) * 100)
                              : 0
                          }% of your recorded spending this month.`
                        : "Record expenses to start understanding your spending."}
                    </p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("Insights")}
                  >
                    Explore insights <ArrowRight size={15} />
                  </button>
                </section>
                {!reflectionHidden && (
                  <section className="reflection-banner">
                    <span className="banner-icon">
                      <BookOpen size={21} strokeWidth={1.5} />
                    </span>
                    <div>
                      <h3>
                        {reflectionSaved
                          ? "A little reflection goes a long way."
                          : `How did ${monthName} feel?`}
                      </h3>
                      <p>
                        {reflectionSaved
                          ? "Your reflection is saved for this session."
                          : "Look back, learn a little, and look ahead."}
                      </p>
                      <button
                        className="text-button"
                        onClick={() => navigate("Monthly Reflection")}
                      >
                        {reflectionSaved ? "View reflection" : "Take a moment"}
                        <ArrowRight size={14} />
                      </button>
                    </div>
                    <button
                      className="dismiss-button"
                      onClick={() => setReflectionHidden(true)}
                      aria-label="Maybe later"
                    >
                      <X size={14} />
                    </button>
                  </section>
                )}
              </div>
            </>
          )}

          {page === "Transactions" && (
            <>
              <div className="transaction-summary-strip">
                <span>
                  {monthTransactions.length} recent records{" "}
                  <span className="muted">in {monthName}</span>
                </span>
                <div>
                  <span>
                    Recorded income{" "}
                    <strong className="positive">+ {money(income)}</strong>
                  </span>
                  <span>
                    Spent <strong>− {money(spent)}</strong>
                  </span>
                </div>
              </div>
              <section className="panel transactions-panel">
                <div className="filter-row">
                  <div className="search-input">
                    <Search size={18} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search transactions…"
                      aria-label="Search transactions"
                    />
                    {search && (
                      <button
                        aria-label="Clear search"
                        onClick={() => setSearch("")}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <div
                    className="segmented-tabs"
                    role="group"
                    aria-label="Transaction type"
                  >
                    {[
                      { label: "All", value: "All types" },
                      { label: "Expenses", value: "Expense" },
                      { label: "Income", value: "Income" },
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        aria-pressed={typeFilter === value}
                        className={typeFilter === value ? "selected" : ""}
                        onClick={() => setTypeFilter(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <select
                    aria-label="Budget group"
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                  >
                    <option>All groups</option>
                    {groups.map((g) => (
                      <option key={g.name}>{g.name}</option>
                    ))}
                  </select>
                  <Button onClick={() => setFiltersOpen(!filtersOpen)}>
                    <SlidersHorizontal size={16} />
                    Filters{filtersOpen && <Check size={14} />}
                  </Button>
                </div>
                {filtersOpen && (
                  <div className="extended-filters">
                    <span>
                      Showing {filteredTransactions.length} matching records for{" "}
                      {monthName} 2026.
                    </span>
                    <button
                      className="text-button"
                      onClick={() => {
                        setSearch("")
                        setTypeFilter("All types")
                        setGroupFilter("All groups")
                      }}
                    >
                      Reset filters <X size={14} />
                    </button>
                  </div>
                )}
                <div className="list-date-heading">
                  {monthName.toUpperCase()} 2026
                  <span>{filteredTransactions.length} transactions</span>
                </div>
                <TransactionRows
                  transactions={filteredTransactions}
                  onOpen={openTransaction}
                  onAdd={() => setModal("add")}
                  full
                />
                <div className="list-footer">
                  <p>
                    Recent sample records are shown here; monthly totals include
                    earlier sample activity.
                  </p>
                  <Button
                    onClick={() => {
                      const csv = [
                        "Description,Category,Group,Date,Amount",
                        ...filteredTransactions.map((t) =>
                          [t.name, t.category, t.group, t.date, t.amount]
                            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                            .join(","),
                        ),
                      ].join("\n")
                      const url = URL.createObjectURL(
                        new Blob([csv], { type: "text/csv" }),
                      )
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `divido-${monthName}-2026.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                      notify("Transactions exported")
                    }}
                  >
                    <Download size={15} />
                    Export CSV
                  </Button>
                </div>
              </section>
            </>
          )}

          {page === "Budget" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setPlans(draftPlan)
                setPlannedIncome(draftIncome)
                setSavings(draftSavings)
                if (authStatus === "signed-in") {
                  try {
                    await saveBudget(formatYearMonth(month), {
                      plannedIncome: draftIncome.toFixed(2),
                      savingsTarget: draftSavings.toFixed(2),
                      allocations: {
                        NEEDS: draftPlan.Needs.toFixed(2),
                        WANTS: draftPlan.Wants.toFixed(2),
                        CULTURE: draftPlan.Culture.toFixed(2),
                        UNEXPECTED: draftPlan.Unexpected.toFixed(2),
                      },
                    })
                  } catch (err) {
                    console.error("Failed to save budget to backend:", err)
                  }
                }
                notify("Monthly budget updated")
              }}
            >
              <div className="budget-top-summary panel">
                <label className="field">
                  Planned income
                  <div className="compact-money">
                    <span>LKR</span>
                    <input
                      aria-label="Planned income"
                      type="number"
                      min="1"
                      required
                      value={draftIncome}
                      onChange={(e) => setDraftIncome(Number(e.target.value))}
                    />
                  </div>
                </label>
                <label className="field">
                  Monthly savings target
                  <div className="compact-money">
                    <span>LKR</span>
                    <input
                      aria-label="Monthly savings target"
                      type="number"
                      min="0"
                      required
                      value={draftSavings}
                      onChange={(e) => setDraftSavings(Number(e.target.value))}
                    />
                  </div>
                  <span className="field-help">
                    A target, not an automatic transfer.
                  </span>
                </label>
                <div className="budget-unallocated">
                  <span>Unallocated</span>
                  <strong>
                    {money(
                      draftIncome -
                        draftSavings -
                        Object.values(draftPlan).reduce((a, b) => a + b, 0),
                    )}
                  </strong>
                  <span>
                    {draftIncome -
                      draftSavings -
                      Object.values(draftPlan).reduce((a, b) => a + b, 0) >=
                    0
                      ? "A little breathing room in your plan"
                      : "Above your planned income"}
                  </span>
                </div>
              </div>
              <div className="section-heading">
                <div>
                  <h2>A little room for everything</h2>
                  <p>
                    Your four Kakeibo groups. Adjust them to fit your month.
                  </p>
                </div>
                <span className="subtle-tag">Monthly allocations</span>
              </div>
              <div className="editable-budget-grid">
                {groups.map((group) => (
                  <div
                    className={`editable-budget-card panel pillar-${group.name.toLowerCase()}`}
                    key={group.name}
                  >
                    <div className="editable-group-heading">
                      <span className="group-icon">
                        <group.icon size={21} />
                      </span>
                      <div>
                        <h3>
                          <GroupBadge group={group.name} />
                        </h3>
                        <p>{group.description}</p>
                      </div>
                    </div>
                    <label className="field">
                      Planned amount
                      <div className="compact-money">
                        <span>LKR</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={draftPlan[group.name]}
                          onChange={(e) =>
                            setDraftPlan({
                              ...draftPlan,
                              [group.name]: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </label>
                    <div className="editable-budget-stats">
                      <div>
                        <span>Spent</span>
                        <strong>{money(groupSpent(group.name))}</strong>
                      </div>
                      <div>
                        <span>
                          {draftPlan[group.name] - groupSpent(group.name) >= 0
                            ? "Remaining"
                            : "Over plan"}
                        </span>
                        <strong>
                          {money(
                            draftPlan[group.name] - groupSpent(group.name),
                          )}
                        </strong>
                      </div>
                    </div>
                    <div className="progress-track">
                      <span
                        style={{
                          width: `${Math.min(100, (groupSpent(group.name) / (draftPlan[group.name] || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="budget-percent-text">
                      {Math.round(
                        (groupSpent(group.name) /
                          (draftPlan[group.name] || 1)) *
                          100,
                      )}
                      % of planned amount used
                    </p>
                  </div>
                ))}
              </div>
              {draftSavings +
                Object.values(draftPlan).reduce((a, b) => a + b, 0) >
                draftIncome && (
                <div className="inline-warning">
                  <TriangleAlert size={20} />
                  <p>
                    Your savings target and allocations are{" "}
                    {money(
                      draftSavings +
                        Object.values(draftPlan).reduce((a, b) => a + b, 0) -
                        draftIncome,
                    )}{" "}
                    above your planned income. You can still save your plan and
                    adjust it later.
                  </p>
                </div>
              )}
              <div className="budget-save-bar panel">
                <div>
                  <span>Total planned, including savings</span>
                  <strong>
                    {money(
                      draftSavings +
                        Object.values(draftPlan).reduce((a, b) => a + b, 0),
                    )}
                  </strong>
                </div>
                <div className="action-pair">
                  <Button
                    type="button"
                    onClick={() => {
                      setDraftPlan(plans)
                      setDraftIncome(plannedIncome)
                      setDraftSavings(savings)
                      notify("Unsaved changes reset")
                    }}
                  >
                    Reset changes
                  </Button>
                  <Button variant="primary">
                    <Check size={17} />
                    Save Plan
                  </Button>
                </div>
              </div>
            </form>
          )}

          {page === "Insights" && (
            <>
              <div className="insight-lookback">
                <CalendarDays size={16} />
                <span>
                  Lookback window:{" "}
                  {new Date(
                    new Date(2026, month + 1, 0).getTime() -
                      (period === "Last 30 days"
                        ? 29
                        : period === "6 months"
                          ? 179
                          : 89) *
                        86400000,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  —{" "}
                  {new Date(2026, month + 1, 0).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  (
                  {period === "Last 30 days"
                    ? 30
                    : period === "6 months"
                      ? 180
                      : 90}{" "}
                  days)
                </span>
              </div>
              <div className="inline-note insights-disclaimer">
                <Sparkles size={17} />
                <span>
                  Thoughtful observations, not financial advice. These insights
                  use illustrative sample history.
                </span>
              </div>
              {!isSampleMonth ? (
                <section className="panel empty-state">
                  <ChartNoAxesCombined size={36} />
                  <span className="status-badge">
                    Gathering spending patterns
                  </span>
                  <h2>Not enough history yet</h2>
                  <p>
                    Divido requires at least 3 distinct spending days to observe
                    patterns. Record expenses over time to build a clearer
                    picture.
                  </p>
                  <Button variant="primary" onClick={() => openAdd("expense")}>
                    <Plus size={16} />
                    Add Expense
                  </Button>
                </section>
              ) : (
                <>
                  <div className="insights-cards">
                    <button
                      className="panel insight-card"
                      onClick={() => setModal("insight")}
                    >
                      <span className="group-icon">
                        <Utensils size={21} />
                      </span>
                      <span className="small-overline">SPENDING PATTERNS</span>
                      <h3>A little more on dining</h3>
                      <GroupBadge group="Wants" />
                      <p>
                        Dining spending is 18% higher than the previous
                        comparable period.
                      </p>
                      <div className="insight-evidence">
                        {period} · 23 sample transactions
                        <ArrowUpRight size={16} />
                      </div>
                    </button>
                    <button
                      className="panel insight-card"
                      onClick={() => setModal("insight")}
                    >
                      <span className="group-icon">
                        <BookOpen size={21} />
                      </span>
                      <span className="small-overline">
                        WHAT MATTERS TO YOU
                      </span>
                      <h3>Making space for learning</h3>
                      <GroupBadge group="Culture" />
                      <p>
                        You’ve recorded {money(groupSpent("Culture"))} for
                        books, courses, and personal growth this month.
                      </p>
                      <div className="insight-evidence">
                        {monthName} 2026 · Culture
                        <ArrowUpRight size={16} />
                      </div>
                    </button>
                    <button
                      className="panel insight-card"
                      onClick={() => navigate("Budget")}
                    >
                      <span className="group-icon">
                        <Wrench size={21} />
                      </span>
                      <span className="small-overline">YOUR MONTHLY PLAN</span>
                      <h3>Room for the unexpected</h3>
                      <GroupBadge group="Unexpected" />
                      <p>
                        Unexpected expenses total{" "}
                        {money(groupSpent("Unexpected"))}. That’s{" "}
                        {money(plans.Unexpected - groupSpent("Unexpected"))}{" "}
                        {groupSpent("Unexpected") > plans.Unexpected
                          ? "above"
                          : "below"}{" "}
                        your monthly allocation.
                      </p>
                      <div className="insight-evidence">
                        {monthName} 2026 · Budget vs. actual
                        <ArrowUpRight size={16} />
                      </div>
                    </button>
                  </div>
                  <div className="charts-grid">
                    <section className="panel chart-panel">
                      <div className="section-heading">
                        <div>
                          <h2>Spending over time</h2>
                          <p>A wider view of your everyday spending.</p>
                        </div>
                        <span className="subtle-tag">LKR</span>
                      </div>
                      <div className="chart-legend">
                        <span>
                          <i /> Recorded spending
                        </span>
                        <span>
                          <i className="dashed" /> Spending plan
                        </span>
                      </div>
                      <div className="line-chart">
                        <div className="chart-y-axis">
                          <span>300k</span>
                          <span>225k</span>
                          <span>150k</span>
                          <span>75k</span>
                          <span>0</span>
                        </div>
                        <svg
                          viewBox="0 0 600 210"
                          role="img"
                          aria-label={`Sample monthly spending: May 84,000; June 112,000; July 92,000; August 120,000; September 108,000; October ${spent.toLocaleString()}.`}
                        >
                          <defs>
                            <pattern
                              id="chartGrid"
                              width="600"
                              height="47.5"
                              patternUnits="userSpaceOnUse"
                            >
                              <path
                                d="M0 0H600"
                                stroke="currentColor"
                                strokeOpacity=".08"
                                fill="none"
                              />
                            </pattern>
                          </defs>
                          <rect
                            x="0"
                            y="0"
                            width="600"
                            height="191"
                            fill="url(#chartGrid)"
                          />
                          <path
                            d={`M0 ${Math.max(0, 190 - (available / 300000) * 190)}H600`}
                            className="plan-line"
                          />
                          <polyline
                            points={`15,137 129,119 243,132 357,114 471,122 585,${Math.max(0, 190 - (spent / 300000) * 190)}`}
                            fill="none"
                            className="spend-line"
                          />
                          {[
                            [15, 137],
                            [129, 119],
                            [243, 132],
                            [357, 114],
                            [471, 122],
                            [585, Math.max(0, 190 - (spent / 300000) * 190)],
                          ].map(([x, y], i) => (
                            <circle
                              key={x}
                              cx={x}
                              cy={y}
                              r={i === 5 ? 6 : 4}
                              className="chart-point"
                            />
                          ))}
                        </svg>
                      </div>
                      <div className="chart-x-axis">
                        {["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m) => (
                          <span key={m}>{m}</span>
                        ))}
                      </div>
                      <div className="chart-summary">
                        <ChartNoAxesCombined size={17} />
                        <p>
                          October spending is {money(108000 - spent)}{" "}
                          {spent <= 108000 ? "lower" : "higher"} than September
                          in this sample history.
                        </p>
                      </div>
                    </section>
                    <section className="panel chart-panel group-chart">
                      <h2>Where your money went</h2>
                      <p>Spending by Kakeibo group · {monthName}</p>
                      <div className="donut-layout">
                        <div
                          className="donut-chart"
                          role="img"
                          aria-label={`Total spent ${money(spent)}. ${groups.map((g) => `${g.name} ${Math.round((groupSpent(g.name) / (spent || 1)) * 100)}%`).join(", ")}.`}
                        >
                          <svg viewBox="0 0 180 180">
                            <circle
                              cx="90"
                              cy="90"
                              r="70"
                              fill="none"
                              stroke="var(--line)"
                              strokeWidth="18"
                            />
                            {groups
                              .map((g, i) => ({
                                p: (groupSpent(g.name) / (spent || 1)) * 100,
                                o:
                                  (groups
                                    .slice(0, i)
                                    .reduce(
                                      (total, item) =>
                                        total + groupSpent(item.name),
                                      0,
                                    ) /
                                    (spent || 1)) *
                                  100,
                                c: `var(--${g.name.toLowerCase()}-accent)`,
                              }))
                              .map((s, i) => (
                                <circle
                                  key={i}
                                  cx="90"
                                  cy="90"
                                  r="70"
                                  fill="none"
                                  stroke={s.c}
                                  strokeWidth="18"
                                  pathLength="100"
                                  strokeDasharray={`${Math.max(0, s.p - 1.8)} ${100 - Math.max(0, s.p - 1.8)}`}
                                  strokeDashoffset={-s.o}
                                  transform="rotate(-90 90 90)"
                                />
                              ))}
                          </svg>
                          <div>
                            <span>Total spent</span>
                            <strong>{money(spent)}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="group-chart-legend">
                        {groups.map((g) => (
                          <div key={g.name}>
                            <g.icon size={15} />
                            <span>{g.name}</span>
                            <strong>{money(groupSpent(g.name))}</strong>
                            <span>
                              {Math.round(
                                (groupSpent(g.name) / (spent || 1)) * 100,
                              )}
                              %
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="chart-caption">
                        Needs account for the largest share of spending.
                      </p>
                    </section>
                  </div>
                </>
              )}
            </>
          )}

          {page === "Monthly Reflection" && (
            <div className="reflection-page">
              <div className="reflection-intro">
                <span className="large-leaf">
                  <Leaf size={30} strokeWidth={1.3} />
                </span>
                <h2>A month of small moments.</h2>
                <p>
                  Numbers tell part of the story. This is a space for the rest.
                  <br />
                  Your reflection is just for you, and always optional.
                </p>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setReflectionSaved(true)
                  if (authStatus === "signed-in") {
                    try {
                      await saveReflection(formatYearMonth(month), {
                        answers: [
                          { questionId: "what-went-well", answer: reflections[0] },
                          { questionId: "what-felt-difficult", answer: reflections[1] },
                          { questionId: "what-to-change", answer: reflections[2] },
                        ],
                      })
                    } catch (err) {
                      console.error("Failed to save reflection to backend:", err)
                    }
                  }
                  notify("Reflection saved")
                  navigate("Dashboard")
                }}
              >
                {[
                  "What went well with your money this month?",
                  "What felt difficult or surprising?",
                  "What would you like to change next month?",
                ].map((q, i) => (
                  <label className="reflection-question" key={q}>
                    <span className="question-number">{i + 1}</span>
                    <div>
                      <span>{q}</span>
                      <textarea
                        maxLength={1000}
                        value={reflections[i]}
                        onChange={(e) =>
                          setReflections((previous) =>
                            previous.map((v, j) =>
                              i === j ? e.target.value : v,
                            ),
                          )
                        }
                        placeholder={
                          [
                            "A small win, a thoughtful purchase, a little breathing room…",
                            "Something you hadn’t planned for, or a pattern you noticed…",
                            "One small thing you’d like to try…",
                          ][i]
                        }
                        rows={4}
                      />
                      <span className="textarea-count">
                        {reflections[i].length} / 1000
                      </span>
                    </div>
                  </label>
                ))}
                <div className="reflection-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("Dashboard")}
                  >
                    Skip for now
                  </Button>
                  <Button variant="primary">
                    <Check size={16} />
                    Save Reflection
                  </Button>
                </div>
              </form>
              <div className="inline-note">
                <ShieldCheck size={16} />
                In this demo, reflections stay in memory only and reset on
                refresh.
              </div>
            </div>
          )}

          {page === "Settings" && (
            <div className="settings-overview">
              <section className="panel settings-block">
                <div className="settings-block-heading">
                  <span className="group-icon">
                    <CircleUserRound size={20} />
                  </span>
                  <div>
                    <h2>Account profile</h2>
                    <p>Your personal space, at a glance.</p>
                  </div>
                  <span className="status-badge">Completed · Demo</span>
                </div>
                <div className="account-details">
                  <div>
                    <span>Email address</span>
                    <strong>{email}</strong>
                  </div>
                  <div>
                    <span>Demo account ID</span>
                    <code>6e0c8a24-8d9f-4b31-a256-2d47b1d069ab</code>
                  </div>
                  <div>
                    <span>Onboarding status</span>
                    <strong>Completed</strong>
                  </div>
                </div>
                <details className="profile-details">
                  <summary>Edit profile</summary>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      if (authStatus === "signed-in") {
                        try {
                          await updateProfile({ displayName: userName.trim() })
                          notify("Profile updated successfully")
                        } catch (err) {
                          console.error("Failed to update profile:", err)
                          notify("Failed to update profile")
                        }
                      } else {
                        notify("Profile updated for this session")
                      }
                    }}
                  >
                    <label className="field">
                      Display name
                      <input
                        required
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                      />
                    </label>
                    <label className="field">
                      Email address
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </label>
                    <Button variant="primary">Save changes</Button>
                  </form>
                </details>
              </section>
              <section className="settings-block">
                <div className="section-heading">
                  <div>
                    <h2>Financial management</h2>
                    <p>A little organization for your everyday records.</p>
                  </div>
                </div>
                <div className="management-links">
                  <button
                    className="panel management-link"
                    onClick={() => navigate("Expense Categories")}
                  >
                    <span className="group-icon">
                      <ShoppingBasket size={21} />
                    </span>
                    <div>
                      <h3>Expense categories</h3>
                      <p>Organize spending across your four Kakeibo groups.</p>
                      <span>
                        Manage categories <ArrowRight size={14} />
                      </span>
                    </div>
                  </button>
                  <button
                    className="panel management-link"
                    onClick={() => navigate("Income Sources")}
                  >
                    <span className="group-icon">
                      <BriefcaseBusiness size={21} />
                    </span>
                    <div>
                      <h3>Income sources</h3>
                      <p>Labels for the money you manually record.</p>
                      <span>
                        Manage income sources <ArrowRight size={14} />
                      </span>
                    </div>
                  </button>
                </div>
              </section>
              <section className="panel settings-block">
                <div className="settings-block-heading">
                  <span className="group-icon">
                    <SlidersHorizontal size={20} />
                  </span>
                  <div>
                    <h2>Regional preferences</h2>
                    <p>A familiar way to read your financial information.</p>
                  </div>
                </div>
                <div className="regional-tiles">
                  {[
                    ["Currency", "LKR (Rs)"],
                    ["Timezone", "Asia/Colombo", "UTC+05:30"],
                    ["Language", "English", "en-LK"],
                  ].map(([label, value, meta]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                      {meta && <small>{meta}</small>}
                    </div>
                  ))}
                </div>
              </section>
              <section className="panel settings-block">
                <div className="settings-block-heading">
                  <span className="group-icon">
                    {theme === "light" ? <Sun size={20} /> : <Moon size={20} />}
                  </span>
                  <div>
                    <h2>Appearance</h2>
                    <p>Choose a look that feels right. Saved on this device.</p>
                  </div>
                </div>
                <div className="theme-options">
                  {(["light", "dark"] as const).map((mode) => (
                    <Button
                      key={mode}
                      className={`theme-option ${
                        theme === mode ? "selected" : ""
                      }`}
                      aria-pressed={theme === mode}
                      onClick={() => setTheme(mode)}
                    >
                      {mode === "light" ? (
                        <Sun size={18} />
                      ) : (
                        <Moon size={18} />
                      )}
                      {mode === "light" ? "Light mode" : "Dark mode"}
                      {theme === mode && <Check size={16} />}
                    </Button>
                  ))}
                </div>
              </section>
              <section className="panel settings-block demo-block">
                <ShieldCheck size={23} />
                <div>
                  <h3>A safe space to explore</h3>
                  <p>
                    This is a session-only prototype. No real account or bank
                    connection is in use.
                  </p>
                </div>
                <Button onClick={() => setOnboardStep(0)}>
                  Explore setup <ArrowRight size={15} />
                </Button>
              </section>
              <section className="panel settings-block data-clear-block">
                <div className="settings-block-heading">
                  <h2>Data Management</h2>
                  <p>Reset your dashboard, clear all income and expenses, or start a new personal financial tracker.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "12px",
                      padding: "16px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--line)",
                      background: "var(--soft)",
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", color: "var(--ink)", fontSize: "14px" }}>
                        {dataCleared ? "Clean Dashboard Active" : "Sample Demo Records Active"}
                      </strong>
                      <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                        {dataCleared
                          ? `Currently running on an empty dashboard (${transactions.length} personal transactions recorded).`
                          : "Currently showing pre-populated demo income and expense transactions."}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {dataCleared && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setTransactions(initialTransactions)
                            setDataCleared(false)
                            try {
                              localStorage.removeItem("divido-data-cleared")
                              localStorage.removeItem("divido-transactions")
                            } catch {}
                            notify("Sample demo transactions restored.")
                          }}
                        >
                          Restore demo data
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => setModal("clear-data")}
                      >
                        <Trash2 size={16} />
                        Clear all data & start new dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
              <section className="panel settings-block danger-zone">
                <div>
                  <h2>Danger zone</h2>
                  <p>Leave this demo and return to the sign-in preview.</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setModal("signout")}
                >
                  <LogOut size={16} />
                  Sign out
                </Button>
              </section>
            </div>
          )}

          {page === "Expense Categories" && (
            <>
              <div
                className="segmented-tabs category-tabs"
                role="group"
                aria-label="Filter categories"
              >
                {["All Categories", ...groups.map((g) => g.name)].map(
                  (name) => (
                    <button
                      key={name}
                      aria-pressed={categoryFilter === name}
                      className={categoryFilter === name ? "selected" : ""}
                      onClick={() => setCategoryFilter(name)}
                    >
                      {name}
                    </button>
                  ),
                )}
              </div>
              <div className="category-grid">
                {categories
                  .filter(
                    (c) =>
                      categoryFilter === "All Categories" ||
                      c.group === categoryFilter,
                  )
                  .map((c) => {
                    const isDefault = initialCategories.some(
                      (original) => original.name === c.name,
                    )
                    return (
                      <section
                        className={`panel category-card ${
                          !c.active ? "inactive-card" : ""
                        }`}
                        key={c.name}
                      >
                        <div className="category-card-title">
                          <h3>{c.name}</h3>
                          <span className="group-icon">
                            <ShoppingBasket size={18} />
                          </span>
                        </div>
                        <div className="record-tags">
                          <span>{isDefault ? "DEFAULT" : "CUSTOM"}</span>
                          <span className={c.active ? "tag-active" : ""}>
                            {c.active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </div>
                        <GroupBadge group={c.group} />
                        <div className="record-actions">
                          {isDefault ? (
                            <span className="default-note">
                              Built-in category
                            </span>
                          ) : (
                            <>
                              <Button
                                onClick={() => {
                                  setEditingCategory(c)
                                  setModal("category")
                                }}
                              >
                                <Pencil size={14} />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  if (c.id && c.active) {
                                    void deactivateCategory(c.id).catch(() => {})
                                  }
                                  setCategories((prev) =>
                                    prev.map((item) =>
                                      item.name === c.name
                                        ? { ...item, active: !item.active }
                                        : item,
                                    ),
                                  )
                                  notify(
                                    c.active
                                      ? "Category deactivated"
                                      : "Category activated",
                                  )
                                }}
                              >
                                {c.active ? "Deactivate" : "Activate"}
                              </Button>
                            </>
                          )}
                        </div>
                      </section>
                    )
                  })}
              </div>
              <div className="inline-note management-notice">
                <ShieldCheck size={17} />
                Deactivated categories stay on existing records. Category
                mapping changes only apply to future entries.
              </div>
            </>
          )}
          {page === "Income Sources" && (
            <>
              <div className="inline-note management-notice">
                <BriefcaseBusiness size={17} />
                These are labels for manually recorded income, not connected
                bank accounts.
              </div>
              <div className="source-grid">
                {sources.map((source) => {
                  const active = !inactiveSources.includes(source)
                  return (
                    <section
                      className={`panel source-card ${
                        !active ? "inactive-card" : ""
                      }`}
                      key={source}
                    >
                      <div className="source-card-heading">
                        <span className="group-icon">
                          <BriefcaseBusiness size={20} />
                        </span>
                        <h3>{source}</h3>
                        <span
                          className={`status-badge ${
                            active ? "" : "status-inactive"
                          }`}
                        >
                          {active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                      <p>Manual income source</p>
                      <div className="record-actions">
                        <Button
                          onClick={() => {
                            setEditingSource(source)
                            setModal("source")
                          }}
                        >
                          <Pencil size={14} />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (
                              active &&
                              sources.filter(
                                (s) => !inactiveSources.includes(s),
                              ).length === 1
                            ) {
                              notify("Keep at least one active income source")
                              return
                            }
                            if (active && sourceIds[source]) {
                              void deactivateIncomeSource(sourceIds[source]).catch(() => {})
                            }
                            setInactiveSources((prev) =>
                              active
                                ? [...prev, source]
                                : prev.filter((s) => s !== source),
                            )
                            notify(
                              active
                                ? "Income source deactivated"
                                : "Income source activated",
                            )
                          }}
                        >
                          {active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </section>
                  )
                })}
              </div>
            </>
          )}

          <footer className="page-footer">
            <span>
              <span className="footer-brand">divido.</span> A little awareness.
              A little more possibility.
            </span>
            <span>
              Thoughtfully recorded, by you.
              <span className="footer-dot" />
              Demo workspace
            </span>
          </footer>
        </main>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {[
          {
            page: "Dashboard" as Page,
            label: "Overview",
            icon: LayoutDashboard,
          },
          {
            page: "Transactions" as Page,
            label: "History",
            icon: ArrowLeftRight,
          },
          { page: null, label: "Add transaction", icon: Plus },
          { page: "Budget" as Page, label: "Budget", icon: Wallet },
          { page: "Settings" as Page, label: "Settings", icon: Settings },
        ].map(({ page: item, label, icon: Icon }) => (
          <button
            key={label}
            className={
              item === null
                ? "mobile-add"
                : page === item ||
                    (item === "Settings" &&
                      ["Expense Categories", "Income Sources"].includes(page))
                  ? "active"
                  : ""
            }
            aria-label={label}
            aria-current={item === page ? "page" : undefined}
            onClick={() => (item ? navigate(item) : setModal("add"))}
          >
            <Icon size={item ? 21 : 25} />
            {item && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          <span>{toast}</span>
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {(modal === "expense" || modal === "income") && (
        <Modal
          className="record-modal"
          title={
            selected
              ? "Edit Transaction"
              : modal === "income"
                ? "Record Income"
                : "Record an Expense"
          }
          subtitle="A small record. A clearer picture."
          onClose={() => {
            setModal(null)
            setSelected(null)
          }}
        >
          <button
            className="text-button record-back"
            onClick={() => navigate("Transactions")}
          >
            <ArrowLeft size={15} />
            Back to Transactions
          </button>
          {transactionForm(modal === "income")}
        </Modal>
      )}
      {modal === "add" && (
        <Modal
          className="quick-add-modal"
          title="What would you like to add?"
          subtitle="Make a little more sense of your month."
          onClose={() => setModal(null)}
        >
          <div className="add-options">
            <button onClick={() => openAdd("expense")}>
              <span className="group-icon quick-add-expense">
                <ArrowUpRight size={22} />
              </span>
              <div>
                <strong>Add Expense</strong>
                <p>Record something you spent.</p>
              </div>
              <ChevronRight size={19} />
            </button>
            <button onClick={() => openAdd("income")}>
              <span className="group-icon green-icon">
                <ArrowDownLeft size={22} />
              </span>
              <div>
                <strong>Add Income</strong>
                <p>Record money you received.</p>
              </div>
              <ChevronRight size={19} />
            </button>
          </div>
        </Modal>
      )}
      {modal === "detail" && selected && (
        <Modal title="Transaction details" onClose={() => setModal(null)}>
          <div className="detail-amount">
            <TransactionIcon transaction={selected} />
            <span>
              {selected.amount > 0 ? "+" : "−"} {money(selected.amount)}
            </span>
            <h3>{selected.name}</h3>
            <span className="subtle-tag">
              {selected.amount > 0 ? "Income" : "Expense"}
            </span>
          </div>
          <dl className="detail-list">
            {[
              ["Category", selected.category],
              ["Kakeibo group", selected.group],
              [
                "Date",
                new Date(`${selected.date}T12:00:00`).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" },
                ),
              ],
              ["Payment method", selected.payment || "Not specified"],
              ["Description", selected.note || "No description"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="modal-actions detail-actions">
            <Button variant="ghost" onClick={() => setModal("delete")}>
              <Trash2 size={16} />
              Delete
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                setModal(selected.amount > 0 ? "income" : "expense")
              }
            >
              <Pencil size={16} />
              Edit transaction
            </Button>
          </div>
        </Modal>
      )}
      {modal === "delete" && selected && (
        <Modal
          title={`Delete this ${selected.amount > 0 ? "income" : "expense"}?`}
          onClose={() => setModal("detail")}
        >
          <div className="confirm-content">
            <span className="large-leaf">
              <TriangleAlert size={27} />
            </span>
            <p>
              This transaction will no longer appear in normal spending totals.
              This action can’t be undone.
            </p>
          </div>
          <div className="modal-actions">
            <Button onClick={() => setModal("detail")}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (authStatus === "signed-in" && typeof selected.id === "string" && selected.id.includes("-")) {
                  try {
                    await deleteTransaction(selected.id)
                  } catch (err) {
                    console.error("Failed to delete transaction from backend:", err)
                  }
                }
                setTransactions((previous) =>
                  previous.filter((t) => t.id !== selected.id),
                )
                setModal(null)
                setSelected(null)
                notify("Transaction deleted")
              }}
            >
              <Trash2 size={16} />
              Delete {selected.amount > 0 ? "Income" : "Expense"}
            </Button>
          </div>
        </Modal>
      )}
      {modal === "notifications" && (
        <Modal
          title="Your updates"
          subtitle="Just the useful things."
          onClose={() => setModal(null)}
        >
          <div className="notification-item">
            <BookOpen size={22} />
            <div>
              <strong>A moment to reflect</strong>
              <p>Your October reflection is ready whenever you are. No rush.</p>
              <button
                className="text-button"
                onClick={() => {
                  setModal(null)
                  navigate("Monthly Reflection")
                }}
              >
                Take a moment <ArrowRight size={15} />
              </button>
            </div>
          </div>
          <div className="notification-item">
            <CheckCircle2 size={22} />
            <div>
              <strong>Your space is ready</strong>
              <p>
                Welcome to the Divido demo. All financial information is
                manually recorded sample data.
              </p>
            </div>
          </div>
        </Modal>
      )}
      {modal === "help" && (
        <Modal
          title="A little awareness. Real clarity."
          subtitle="Meet a more mindful way to manage money."
          onClose={() => setModal(null)}
        >
          <div className="help-content">
            <Leaf size={38} strokeWidth={1.4} />
            <p>
              Divido is inspired by Kakeibo: a thoughtful practice of planning,
              recording, and reflecting on how you use your money.
            </p>
            <div className="help-steps">
              {[
                [
                  "01",
                  "Make a little room",
                  "Plan your income, savings target, and four spending groups.",
                ],
                [
                  "02",
                  "Notice the everyday",
                  "Manually add income and expenses as you go.",
                ],
                [
                  "03",
                  "Look back with kindness",
                  "Explore patterns and reflect on what matters to you.",
                ],
              ].map(([n, t, d]) => (
                <div key={n}>
                  <span>{n}</span>
                  <div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="inline-note">
              No connected accounts. No transfers. No judgment. This is an
              interactive, session-only prototype.
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setModal(null)
                setOnboardStep(0)
              }}
            >
              Explore the setup
              <ArrowRight size={16} />
            </Button>
          </div>
        </Modal>
      )}
      {modal === "insight" && (
        <Modal
          title="A closer look at your spending"
          subtitle={`${period} · Illustrative sample history`}
          onClose={() => setModal(null)}
        >
          <div className="insight-detail">
            <span className="large-leaf">
              <ChartNoAxesCombined size={28} />
            </span>
            <h3>Small patterns, a clearer perspective.</h3>
            <p>
              Your dining total increased from LKR 8,000 to LKR 9,440 in the
              sample comparison period — a difference of LKR 1,440, or 18%.
            </p>
            <div className="insight-comparison">
              <div>
                <span>Previous period</span>
                <strong>LKR 8,000</strong>
              </div>
              <ArrowRight size={20} />
              <div>
                <span>Selected period</span>
                <strong>LKR 9,440</strong>
              </div>
            </div>
            <p className="muted">
              Based on 23 illustrative dining records. This is an observation,
              not a recommendation. Real insights require recorded history.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setModal(null)
                navigate("Transactions")
                setSearch("Dining")
              }}
            >
              Explore transactions <ArrowRight size={16} />
            </Button>
          </div>
        </Modal>
      )}
      {modal === "category" && (
        <Modal
          title={editingCategory ? "Edit category" : "Add category"}
          subtitle="Every expense has a place."
          onClose={() => setModal(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const data = new FormData(e.currentTarget)
              const name = String(data.get("name")).trim()
              if (
                categories.some(
                  (c) =>
                    c.name.toLowerCase() === name.toLowerCase() &&
                    c.name !== editingCategory?.name,
                )
              ) {
                e.currentTarget
                  .querySelector<HTMLInputElement>("input")
                  ?.setCustomValidity("This category already exists.")
                e.currentTarget.reportValidity()
                return
              }
              const group = String(data.get("group")) as Group
              const category: Category = {
                id: editingCategory?.id,
                name,
                group,
                isDefault: editingCategory?.isDefault ?? false,
                active: data.get("active") === "on",
              }
              if (editingCategory && editingCategory.id) {
                void updateCategory(editingCategory.id, { name, group: toKakeibo(group) }).catch(() => {})
              } else {
                void createCategory({ name, group: toKakeibo(group) }).then((newCat) => {
                  setCategories((prev) =>
                    prev.map((c) => (c.name === name ? { ...c, id: newCat.id } : c)),
                  )
                }).catch(() => {})
              }
              setCategories((prev) =>
                editingCategory
                  ? prev.map((c) =>
                      c.name === editingCategory.name ? category : c,
                    )
                  : [...prev, category],
              )
              setModal(null)
              notify("Category saved")
            }}
          >
            <label className="field">
              Category name
              <input
                name="name"
                required
                maxLength={40}
                defaultValue={editingCategory?.name}
                onChange={(e) => e.target.setCustomValidity("")}
              />
            </label>
            <label className="field">
              Kakeibo group
              <select name="group" defaultValue={editingCategory?.group}>
                {groups.map((g) => (
                  <option key={g.name}>{g.name}</option>
                ))}
              </select>
              <span className="field-help">
                Changing this mapping applies to future entries. Existing
                records keep their original group.
              </span>
            </label>
            <label className="checkbox-field">
              <input
                name="active"
                type="checkbox"
                defaultChecked={editingCategory?.active ?? true}
              />
              Active — available for new expenses
            </label>
            <div className="modal-actions">
              <Button type="button" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button variant="primary">Save Category</Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "source" && (
        <Modal
          title={editingSource ? "Edit income source" : "Add income source"}
          subtitle="A simple label, not a connected account."
          onClose={() => setModal(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const name = String(
                new FormData(e.currentTarget).get("name"),
              ).trim()
              if (sources.includes(name) && name !== editingSource) {
                notify("That income source already exists")
                return
              }
              if (editingSource && sourceIds[editingSource]) {
                void updateIncomeSource(sourceIds[editingSource], { name }).then((updated) => {
                  setSourceIds((prev) => ({ ...prev, [name]: updated.id }))
                }).catch(() => {})
              } else {
                void createIncomeSource({ name }).then((newSrc) => {
                  setSourceIds((prev) => ({ ...prev, [name]: newSrc.id }))
                }).catch(() => {})
              }
              setSources((previous) =>
                editingSource
                  ? previous.map((s) => (s === editingSource ? name : s))
                  : [...previous, name],
              )
              if (editingSource)
                setInactiveSources((previous) =>
                  previous.map((source) =>
                    source === editingSource ? name : source,
                  ),
                )
              setModal(null)
              notify("Income source saved")
            }}
          >
            <label className="field">
              Source name
              <input
                name="name"
                required
                maxLength={40}
                defaultValue={editingSource ?? ""}
              />
            </label>
            <div className="modal-actions">
              {editingSource && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (
                      !inactiveSources.includes(editingSource) &&
                      sources.filter((s) => !inactiveSources.includes(s))
                        .length === 1
                    ) {
                      notify("Keep at least one active income source")
                      return
                    }
                    setInactiveSources((previous) =>
                      previous.includes(editingSource)
                        ? previous
                        : [...previous, editingSource],
                    )
                    setModal(null)
                    notify("Income source deactivated")
                  }}
                >
                  Deactivate
                </Button>
              )}
              <Button type="button" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button variant="primary">Save source</Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "clear-data" && (
        <Modal
          title="Clear all data and start new dashboard?"
          subtitle="Reset all income and expenses to start fresh."
          onClose={() => setModal(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <p className="confirm-content">
              This will remove all demo and recorded income, expenses, and transactions. Your dashboard will reset to a clean, empty state ready for your real data.
            </p>
            <div
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--warning-border)",
                background: "var(--warning-soft)",
                padding: "12px",
                fontSize: "13px",
                color: "var(--warning-text)",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}
            >
              <TriangleAlert size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>
                All transactions will be cleared. You can restore sample demo transactions anytime from the Settings page.
              </span>
            </div>
            <div className="modal-actions">
              <Button onClick={() => setModal(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setTransactions([])
                  setDataCleared(true)
                  try {
                    localStorage.setItem("divido-data-cleared", "true")
                    localStorage.setItem("divido-transactions", JSON.stringify([]))
                  } catch {}
                  setModal(null)
                  setPage("Dashboard")
                  notify("All data cleared. Welcome to your fresh new dashboard!")
                }}
              >
                <Trash2 size={16} />
                Clear data & start fresh
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {modal === "signout" && (
        <Modal
          title="Sign out of Divido?"
          subtitle="You can sign back in at any time."
          onClose={() => setModal(null)}
        >
          <p className="confirm-content">
            This will end your current session. You will be redirected to the sign-in screen.
          </p>
          <div className="modal-actions">
            <Button onClick={() => setModal(null)}>Stay here</Button>
            <Button
              variant="destructive"
              onClick={() => void handleSignOut()}
            >
              <LogOut size={16} />
              Sign out
            </Button>
          </div>
        </Modal>
      )}
      {onboardStep !== null && (
        <Modal
          className="onboarding-modal"
          title={
            [
              "Welcome to Divido",
              "Income & savings target",
              "Four groups. A thoughtful plan.",
              "Review your monthly plan",
            ][onboardStep]
          }
          subtitle={`Step ${onboardStep + 1} of 4 · ${email}`}
          onClose={() => setOnboardStep(null)}
        >
          <div
            className="onboarding-progress"
            aria-label={`Step ${onboardStep + 1} of 4`}
          >
            {[0, 1, 2, 3].map((i) => (
              <span className={i <= onboardStep ? "done" : ""} key={i} />
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (onboardStep === 3) {
                setPlans(draftPlan)
                setPlannedIncome(draftIncome)
                setSavings(draftSavings)
                setOnboardStep(null)
                navigate("Dashboard")
                notify("Your monthly plan is ready")
              } else setOnboardStep(onboardStep + 1)
            }}
          >
            <div className="onboarding-content">
              {onboardStep === 0 && (
                <>
                  <h3>
                    A little awareness.
                    <br />A little more possibility.
                  </h3>
                  <p>
                    Inspired by Kakeibo, Divido helps you plan, record, and
                    reflect on your money — one month at a time, without
                    judgment.
                  </p>
                  <div className="onboarding-intro-grid">
                    {groups.map((g) => (
                      <div key={g.name}>
                        <GroupBadge group={g.name} />
                        <p>{g.description}</p>
                      </div>
                    ))}
                  </div>
                  <label className="field">
                    Display name
                    <input
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </label>
                </>
              )}
              {onboardStep === 1 && (
                <>
                  <p>
                    Start with an estimate of what’s coming in, and what you’d
                    like to set aside.
                  </p>
                  <label className="field">
                    Planned monthly income
                    <div className="compact-money">
                      <span>LKR</span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        value={draftIncome}
                        onChange={(e) => setDraftIncome(Number(e.target.value))}
                      />
                    </div>
                  </label>
                  <label className="field">
                    Monthly savings target
                    <div className="compact-money">
                      <span>LKR</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={draftSavings}
                        onChange={(e) =>
                          setDraftSavings(Number(e.target.value))
                        }
                      />
                    </div>
                    <span className="field-help">
                      This is a target, not an automatic transfer.
                    </span>
                  </label>
                  <div className="allocation-summary">
                    <span>Remaining to allocate across expenses</span>
                    <strong>
                      {draftIncome - draftSavings < 0 ? "− " : ""}
                      {money(draftIncome - draftSavings)}
                    </strong>
                  </div>
                </>
              )}
              {onboardStep === 2 && (
                <>
                  <p>
                    Give the essentials, the extras, and life’s surprises a
                    little space.
                  </p>
                  {groups.map((g) => (
                    <label className="field" key={g.name}>
                      <GroupBadge group={g.name} />
                      <span className="field-help">{g.description}</span>
                      <div className="compact-money">
                        <span>LKR</span>
                        <input
                          aria-label={`${g.name} allocation`}
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={draftPlan[g.name]}
                          onChange={(e) =>
                            setDraftPlan({
                              ...draftPlan,
                              [g.name]: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </label>
                  ))}
                  <div className="allocation-summary">
                    <span>Total outflow, including savings</span>
                    <strong>
                      {money(
                        draftSavings +
                          Object.values(draftPlan).reduce((a, b) => a + b, 0),
                      )}
                    </strong>
                    <span>Planned income: {money(draftIncome)}</span>
                  </div>
                </>
              )}
              {onboardStep === 3 && (
                <>
                  <p>
                    A little structure. A little breathing room. You can adjust
                    this plan any time.
                  </p>
                  <dl className="detail-list">
                    {[
                      ["Planned income", draftIncome],
                      ["Savings target", draftSavings],
                      ...groups.map((g) => [g.name, draftPlan[g.name]]),
                      [
                        "Total allocated",
                        draftSavings +
                          Object.values(draftPlan).reduce((a, b) => a + b, 0),
                      ],
                      [
                        "Remaining",
                        draftIncome -
                          draftSavings -
                          Object.values(draftPlan).reduce((a, b) => a + b, 0),
                      ],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <dt>{label}</dt>
                        <dd>
                          {Number(value) < 0 ? "− " : ""}
                          {money(Number(value))}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
              {onboardStep >= 2 &&
                draftSavings +
                  Object.values(draftPlan).reduce((a, b) => a + b, 0) >
                  draftIncome && (
                  <div className="inline-warning" role="status">
                    <TriangleAlert size={20} />
                    <p>
                      Your current allocations and savings target are{" "}
                      {money(
                        draftSavings +
                          Object.values(draftPlan).reduce((a, b) => a + b, 0) -
                          draftIncome,
                      )}{" "}
                      higher than your planned income. You can adjust your plan
                      now or later.
                    </p>
                  </div>
                )}
            </div>
            <div className="modal-actions">
              {onboardStep > 0 && (
                <Button
                  type="button"
                  onClick={() => setOnboardStep(onboardStep - 1)}
                >
                  <ArrowLeft size={16} />
                  {onboardStep === 3 ? "Edit Plan" : "Back"}
                </Button>
              )}
              <Button variant="primary">
                {
                  [
                    "Get Started",
                    "Next: Group Allocations",
                    "Next: Review Plan",
                    "Finish Setup & Launch Divido",
                  ][onboardStep]
                }
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
