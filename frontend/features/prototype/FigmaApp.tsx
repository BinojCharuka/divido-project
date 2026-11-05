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
  Layers,
  Sun,
  Moon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useDividoTheme } from "@/lib/theme"
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
import { cleanNumberString } from "@/lib/formatting/money"

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
}[] = [
  {
    name: "Needs",
    icon: House,
    description: "Everyday essentials and living costs",
  },
  {
    name: "Wants",
    icon: Heart,
    description: "Dining out, entertainment, and hobbies",
  },
  {
    name: "Culture",
    icon: BookOpen,
    description: "Books, education, and personal growth",
  },
  {
    name: "Unexpected",
    icon: Wrench,
    description: "Unplanned expenses and emergencies",
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
const initialTransactions: Transaction[] = []
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
function Brand({
  variant = "full",
  className = "",
}: {
  variant?: "full" | "text" | "icon"
  className?: string
} = {}) {
  if (variant === "text") {
    return (
      <div className={`brand brand-text-only ${className}`}>
        <img
          src="/webp/Logo - text.webp"
          alt="Divido"
          className="brand-logo-img light-only"
        />
        <img
          src="/webp/Logo - text-dark.webp"
          alt="Divido"
          className="brand-logo-img dark-only"
        />
      </div>
    )
  }
  if (variant === "icon") {
    return (
      <div className={`brand brand-icon-only ${className}`}>
        <img
          src="/webp/Logo-flavicon - 250px.webp"
          alt="Divido"
          className="brand-logo-img light-only"
        />
        <img
          src="/webp/logo-icon-dark.webp"
          alt="Divido"
          className="brand-logo-img dark-only"
        />
      </div>
    )
  }
  return (
    <div className={`brand brand-full ${className}`}>
      <img
        src="/webp/logo-fulls.webp"
        alt="Divido"
        className="brand-logo-img light-only"
      />
      <img
        src="/webp/logo-fulls-dark.webp"
        alt="Divido"
        className="brand-logo-img dark-only"
      />
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
          {money(Math.abs(planned - spent))} {over ? "over plan" : "left"}
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
  const { theme, setTheme, toggleTheme: handleToggleTheme } = useDividoTheme()
  const themeToggle = (
    <IconButton
      icon={theme === "light" ? Moon : Sun}
      label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="icon-button theme-toggle"
      onClick={handleToggleTheme}
    />
  )
  const [page, setPage] = useState<Page>(() => {
    if (initialPage) return initialPage
    if (typeof window !== "undefined") {
      return pageForPath(window.location.pathname)
    }
    return "Dashboard"
  })

  useEffect(() => {
    if (initialPage && initialPage !== page) {
      setPage(initialPage)
    }
  }, [initialPage])
  const [dataCleared, setDataCleared] = useState<boolean>(true)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("divido-transactions")
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        }
      }
    } catch {}
    return []
  })
  useEffect(() => {
    try {
      localStorage.setItem("divido-transactions", JSON.stringify(transactions))
    } catch {}
  }, [transactions])
  const [plans, setPlans] = useState<Record<Group, number>>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("divido-group-plans")
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed === "object") return parsed
        }
      }
    } catch {}
    return {
      Needs: 0,
      Wants: 0,
      Culture: 0,
      Unexpected: 0,
    }
  })
  const [plannedIncome, setPlannedIncome] = useState<number>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("divido-planned-income")
        if (saved !== null && !isNaN(Number(saved))) return Number(saved)
      }
    } catch {}
    return 0
  })
  const [savings, setSavings] = useState<number>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("divido-savings-target")
        if (saved !== null && !isNaN(Number(saved))) return Number(saved)
      }
    } catch {}
    return 0
  })
  useEffect(() => {
    try {
      localStorage.setItem("divido-group-plans", JSON.stringify(plans))
    } catch {}
  }, [plans])
  useEffect(() => {
    try {
      localStorage.setItem("divido-planned-income", String(plannedIncome))
    } catch {}
  }, [plannedIncome])
  useEffect(() => {
    try {
      localStorage.setItem("divido-savings-target", String(savings))
    } catch {}
  }, [savings])
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [modal, setModal] =
    useState<"expense" | "income" | "add" | "detail" | "delete" | "notifications" | "help" | "insight" | "category" | "source" | "signout" | "clear-data" | null>(
      () => {
        if (typeof window === "undefined") return null
        return window.location.pathname.endsWith("/edit") && initialTransaction
          ? initialTransaction.amount > 0
            ? "income"
            : "expense"
          : window.location.pathname === "/transactions/new-expense"
            ? "expense"
            : window.location.pathname === "/transactions/new-income"
              ? "income"
              : initialTransaction
                ? "detail"
                : null
      },
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
        const [backendCats, backendSources, backendProfile, backendTx, backendBudget, backendReflection, backendDashboard] =
          await Promise.allSettled([
            listCategories(true),
            listIncomeSources(true),
            getProfile(),
            listTransactions({ size: 100 }),
            getBudget(monthStr),
            getReflection(monthStr),
            getDashboard(monthStr),
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

        if (backendTx.status === "fulfilled" && backendTx.value && Array.isArray(backendTx.value.items)) {
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

        if (backendDashboard.status === "fulfilled" && backendDashboard.value) {
          const d = backendDashboard.value
          if (d.plannedIncome) setPlannedIncome(Number(d.plannedIncome))
          if (d.savingsTarget) setSavings(Number(d.savingsTarget))
          if (Array.isArray(d.groups) && d.groups.length > 0) {
            setPlans({
              Needs: Number(d.groups.find((g) => g.group === "NEEDS")?.budget ?? 0),
              Wants: Number(d.groups.find((g) => g.group === "WANTS")?.budget ?? 0),
              Culture: Number(d.groups.find((g) => g.group === "CULTURE")?.budget ?? 0),
              Unexpected: Number(d.groups.find((g) => g.group === "UNEXPECTED")?.budget ?? 0),
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
    typeof window !== "undefined" && window.location.pathname === "/onboarding" ? 0 : null,
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

  useEffect(() => {
    if (initialSignedOut !== undefined) {
      setSignedOut(initialSignedOut)
    }
  }, [initialSignedOut])

  useEffect(() => {
    if (initialAuthMode) {
      setAuthMode(initialAuthMode)
    }
  }, [initialAuthMode])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("divido-sidebar-collapsed") === "true"
    }
    return false
  })

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((prev) => {
      const next = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem("divido-sidebar-collapsed", String(next))
      }
      return next
    })
  }

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
      setPage("Dashboard")
      setOnboardStep(null)
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

  useEffect(() => {
    setDraftPlan(plans)
  }, [plans])
  useEffect(() => {
    setDraftIncome(plannedIncome)
  }, [plannedIncome])
  useEffect(() => {
    setDraftSavings(savings)
  }, [savings])
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
  const monthTransactions = transactions.filter(
    (t) => new Date(`${t.date}T12:00:00`).getMonth() === month,
  )
  const spent = monthTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const income = monthTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)
  const groupSpent = (group: Group) => {
    return monthTransactions
      .filter((t) => t.group === group && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  }
  const totalAllocated = Object.values(plans).reduce((a, b) => a + b, 0)
  const available = Math.max(0, plannedIncome - savings)
  const budgetBase = available > 0 ? available : totalAllocated
  const remaining = budgetBase - spent
  const spendingPercent =
    budgetBase > 0 ? Math.round((spent / budgetBase) * 100) : spent > 0 ? 100 : 0
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
          try {
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
          } catch (updateErr) {
            if (updateErr instanceof ApiError && updateErr.status === 404) {
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
            } else {
              console.warn("Backend transaction update notice:", updateErr)
            }
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
        console.warn("Backend transaction save notice:", err)
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

  const distinctSpendingDays = new Set(
    transactions.filter((t) => t.amount < 0).map((t) => t.date),
  ).size

  const topGroup = [...groups].sort(
    (a, b) => groupSpent(b.name) - groupSpent(a.name),
  )[0]
  const topGroupPct =
    spent > 0 ? Math.round((groupSpent(topGroup.name) / spent) * 100) : 0

  const chartMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const m = d.getMonth()
    const y = d.getFullYear()
    const mSpend = transactions
      .filter((t) => {
        const td = new Date(`${t.date}T12:00:00`)
        return td.getMonth() === m && td.getFullYear() === y && t.amount < 0
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    return {
      label: d.toLocaleString("default", { month: "short" }),
      spend: mSpend,
    }
  })
  const maxMonthSpend = Math.max(
    ...chartMonths.map((m) => m.spend),
    budgetBase,
    50000,
  )
  const chartYMax = Math.ceil(maxMonthSpend / 10000) * 10000 || 50000
  const chartPoints = chartMonths.map((m, i) => ({
    x: 15 + i * (570 / 5),
    y: Math.max(10, 190 - (m.spend / chartYMax) * 180),
  }))

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
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={selected ? Math.abs(selected.amount) : ""}
            required
            autoFocus
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const cleaned = cleanNumberString(e.target.value)
              if (cleaned !== e.target.value) {
                e.target.value = cleaned
              }
            }}
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
            selected?.date ??
            (new Date().getMonth() === month
              ? new Date().toLocaleDateString("en-CA")
              : `2026-${String(month + 1).padStart(2, "0")}-01`)
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
      <div className="min-h-screen flex flex-col bg-[#fbfaf6] text-zinc-900 dark:bg-[#0b0e0c] dark:text-zinc-100 antialiased relative transition-colors duration-200 selection:bg-emerald-500/20 selection:text-emerald-900 dark:selection:text-emerald-200">
        {/* Background ambient lighting */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(16,185,129,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(16,185,129,0.08),transparent_70%)]"
          aria-hidden="true"
        />

        {/* Top Navbar */}
        <header className="w-full border-b border-zinc-200/70 dark:border-zinc-800/70 bg-white/70 dark:bg-[#0e120f]/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setSignedOut(false)
                setPage("Dashboard")
              }}
              className="flex items-center gap-2 group cursor-pointer border-none bg-transparent p-0 transition-opacity hover:opacity-90"
            >
              <Brand />
            </button>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-block text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-wide">
                Your personal money space
              </span>
              <div className="auth-theme-toggle">{themeToggle}</div>
            </div>
          </div>
        </header>

        {/* Main Content Split */}
        <main className="flex-1 flex items-center justify-center py-8 lg:py-16 px-4 sm:px-6 lg:px-12">
          <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            
            {/* Left Column: Brand Story - Hidden on mobile, clean & minimal on desktop */}
            <div className="hidden lg:flex lg:col-span-7 flex-col gap-6 max-w-lg">
              <h2 className="text-4xl lg:text-[46px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
                A clearer mind.<br />
                A more mindful<br />
                <span className="text-emerald-600 dark:text-emerald-400">money life.</span>
              </h2>
              <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal max-w-md">
                Make room for what matters most.<br />
                Plan, notice, and reflect — one month at a time.
              </p>

              <div className="pt-6 border-t border-zinc-200/70 dark:border-white/[0.08] flex flex-col gap-4.5">
                <div className="flex items-start gap-3.5 group">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Mindful budgeting
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      Thoughtful, stress-free mindfulness for modern budgeting.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 group">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Private & credential-free
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      No bank scraping, no passwords stored. Your personal data stays yours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 group">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Layers size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Four intentional pillars
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      Clear balance across Needs, Wants, Culture, and Unexpected moments.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Auth Card Island - Centered & Solo on mobile */}
            <div className="w-full lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[420px] relative rounded-2xl border border-zinc-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-[#111512]/90 p-7 sm:p-8 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-emerald-500/40 before:to-transparent transition-all">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {authMode === "Sign in"
                      ? "Welcome back"
                      : authMode === "Recover access"
                        ? "Recover access"
                        : "Create your account"}
                    <span className="text-emerald-500 font-serif">.</span>
                  </h1>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {authMode === "Sign in"
                      ? "Sign in to a calmer view of your money."
                      : authMode === "Recover access"
                        ? "Enter your email to receive recovery instructions."
                        : "Start your mindful money journey."}
                  </p>
                </div>

                {authError && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
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
                  className="flex flex-col gap-4"
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
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        Name
                      </label>
                      <input
                        required
                        className="w-full rounded-xl border border-zinc-200/90 bg-zinc-50/60 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15 dark:border-white/[0.08] dark:bg-[#161c18]/70 dark:text-zinc-100 dark:placeholder:text-zinc-500 hover:dark:border-white/[0.14] dark:focus:border-emerald-400 dark:focus:bg-[#161c18] dark:focus:ring-2 dark:focus:ring-emerald-400/20"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full rounded-xl border border-zinc-200/90 bg-zinc-50/60 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15 dark:border-white/[0.08] dark:bg-[#161c18]/70 dark:text-zinc-100 dark:placeholder:text-zinc-500 hover:dark:border-white/[0.14] dark:focus:border-emerald-400 dark:focus:bg-[#161c18] dark:focus:ring-2 dark:focus:ring-emerald-400/20"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>

                  {authMode !== "Recover access" && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          Password
                        </label>
                        {authMode === "Sign in" && (
                          <button
                            type="button"
                            onClick={() => setAuthMode("Recover access")}
                            className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        required
                        minLength={8}
                        className="w-full rounded-xl border border-zinc-200/90 bg-zinc-50/60 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15 dark:border-white/[0.08] dark:bg-[#161c18]/70 dark:text-zinc-100 dark:placeholder:text-zinc-500 hover:dark:border-white/[0.14] dark:focus:border-emerald-400 dark:focus:bg-[#161c18] dark:focus:ring-2 dark:focus:ring-emerald-400/20"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete={authMode === "Sign in" ? "current-password" : "new-password"}
                      />
                    </div>
                  )}

                  {authMode === "Create account" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        Confirm password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        className="w-full rounded-xl border border-zinc-200/90 bg-zinc-50/60 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15 dark:border-white/[0.08] dark:bg-[#161c18]/70 dark:text-zinc-100 dark:placeholder:text-zinc-500 hover:dark:border-white/[0.14] dark:focus:border-emerald-400 dark:focus:bg-[#161c18] dark:focus:ring-2 dark:focus:ring-emerald-400/20"
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        autoComplete="new-password"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full inline-flex items-center justify-center gap-2 font-semibold text-sm py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm shadow-emerald-950/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 mt-1"
                  >
                    <span>
                      {authLoading
                        ? "Please wait…"
                        : authMode === "Recover access"
                          ? "Send instructions"
                          : authMode === "Sign in"
                            ? "Sign in"
                            : "Create account"}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                </form>

                <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-4">
                  {authMode === "Sign in" ? "New to Divido?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null)
                      setAuthMode(authMode === "Sign in" ? "Create account" : "Sign in")
                    }}
                    className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline underline-offset-4 cursor-pointer"
                  >
                    {authMode === "Sign in" ? "Create an account ↗" : "Sign in ↗"}
                  </button>
                </p>
              </div>
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-zinc-200/70 dark:border-zinc-800/70 py-6 px-6 lg:px-12 mt-auto bg-white/40 dark:bg-zinc-950/30">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400 dark:text-zinc-500">
            <div>© 2026 Divido</div>
            <div>A little awareness. A little more possibility.</div>
            <div>Made for a more mindful month.</div>
          </div>
        </footer>
      </div>
    )

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-header-row">
          <button
            className="sidebar-brand"
            aria-label="Divido dashboard"
            onClick={() => navigate("Dashboard")}
            title={sidebarCollapsed ? "Divido Dashboard" : undefined}
          >
            <Brand variant={sidebarCollapsed ? "icon" : "full"} />
          </button>
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={toggleSidebarCollapsed}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
        <div className="workspace-label">PERSONAL SPACE</div>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map(({ page: item, icon: Icon }) => (
            <button
              key={item}
              className={`nav-item ${page === item ? "active" : ""}`}
              aria-current={page === item ? "page" : undefined}
              onClick={() => navigate(item)}
              title={sidebarCollapsed ? item : undefined}
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
            title={sidebarCollapsed ? "Monthly reflection" : undefined}
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
            title={sidebarCollapsed ? "Settings" : undefined}
          >
            <Settings size={19} strokeWidth={1.7} />
            <span>Settings</span>
            {["Settings", "Expense Categories", "Income Sources"].includes(
              page,
            ) && <span className="active-dot" />}
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button className="help-link" onClick={() => setModal("help")} title={sidebarCollapsed ? "Help" : undefined}>
            <CircleHelp size={17} />
            <span>Help & getting started</span>
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
          <div key={page} className="page-transition-water-droplet">
          <div
            className={`page-heading ${
              page === "Dashboard" ? "dashboard-heading" : ""
            }`}
          >
            <div>
              <h1>
                {page === "Dashboard"
                  ? `Good morning, ${userName}`
                  : page === "Budget"
                    ? "Monthly budget"
                    : page === "Monthly Reflection"
                      ? `Monthly Reflection · ${monthName} 2026`
                      : page === "Settings"
                        ? "Settings"
                        : page === "Insights"
                          ? "Spending Insights"
                          : page}
              </h1>
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
              {transactions.length === 0 && plannedIncome === 0 && (
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
                        Fresh Budget Workspace
                      </strong>
                      <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                        Set planned income and group allocations, or add your first transaction.
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Button variant="primary" onClick={() => navigate("Budget")}>
                      <Wallet size={15} /> Set Up Budget
                    </Button>
                    <Button variant="secondary" onClick={() => openAdd("income")}>
                      <Plus size={15} /> Add Income
                    </Button>
                    <Button variant="secondary" onClick={() => openAdd("expense")}>
                      <Plus size={15} /> Add Expense
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
                    className: "",
                  },
                  {
                    label: "Recorded income",
                    value: income,
                    icon: ArrowDownLeft,
                    className: "",
                  },
                  {
                    label: "Spent this month",
                    value: spent,
                    icon: ArrowUpRight,
                    className: "",
                  },
                  {
                    label: "Savings target",
                    value: savings,
                    icon: Target,
                    className: "savings-stat",
                  },
                ].map(({ label, value, icon: Icon, className }) => (
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
                  </div>
                ))}
              </div>
              <section className="budget-section">
                <div className="section-heading">
                  <div>
                    <h2>
                      Budget Breakdown{" "}
                      <span className="subtle-tag">{monthName}</span>
                    </h2>
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
                      <span>Remaining budget</span>
                      <span className="dark-icon">
                        <Wallet size={18} strokeWidth={1.5} />
                      </span>
                    </div>
                    <div className="remaining-amount">
                      <span>LKR</span> {Math.abs(remaining).toLocaleString()}
                    </div>
                    <div className="remaining-label">
                      {remaining >= 0
                        ? "Remaining to spend"
                        : "Over budget"}
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
                  </section>
                </div>
              </div>
              <div className="dashboard-bottom">
                <section className="insight-banner">
                  <span className="banner-icon">
                    <Sparkles size={21} strokeWidth={1.5} />
                  </span>
                  <div>
                    <h3>
                      {spent > 0
                        ? `Needs: ${
                            spent
                              ? Math.round((groupSpent("Needs") / spent) * 100)
                              : 0
                          }% of spending`
                        : "Spending Breakdown"}
                    </h3>
                    <p>
                      {spent > 0
                        ? `Essential needs account for LKR ${groupSpent("Needs").toLocaleString()} of ${monthName} spending.`
                        : "Record expenses to start tracking group breakdowns."}
                    </p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("Insights")}
                  >
                    View insights <ArrowRight size={15} />
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
                          ? `Reflection saved for ${monthName}`
                          : `Monthly reflection for ${monthName}`}
                      </h3>
                      <button
                        className="text-button"
                        onClick={() => navigate("Monthly Reflection")}
                      >
                        {reflectionSaved ? "View reflection" : "Start reflection"}
                        <ArrowRight size={14} />
                      </button>
                    </div>
                    <button
                      className="dismiss-button"
                      onClick={() => setReflectionHidden(true)}
                      aria-label="Dismiss banner"
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
                  <div />
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
                    console.warn("Failed to save budget to backend:", err)
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
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={draftIncome === 0 ? "" : draftIncome}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const cleaned = cleanNumberString(e.target.value)
                        setDraftIncome(cleaned === "" ? 0 : Number(cleaned))
                      }}
                    />
                  </div>
                </label>
                <label className="field">
                  Monthly savings target
                  <div className="compact-money">
                    <span>LKR</span>
                    <input
                      aria-label="Monthly savings target"
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={draftSavings === 0 ? "" : draftSavings}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const cleaned = cleanNumberString(e.target.value)
                        setDraftSavings(cleaned === "" ? 0 : Number(cleaned))
                      }}
                    />
                  </div>
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
                      ? "Remaining to allocate"
                      : "Over planned income"}
                  </span>
                </div>
              </div>
              <div className="section-heading">
                <div>
                  <h2>Group Allocations</h2>
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
                          aria-label={`${group.name} planned amount`}
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={
                            draftPlan[group.name] === 0
                              ? ""
                              : draftPlan[group.name]
                          }
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const cleaned = cleanNumberString(e.target.value)
                            setDraftPlan({
                              ...draftPlan,
                              [group.name]:
                                cleaned === "" ? 0 : Number(cleaned),
                            })
                          }}
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
                          width: `${
                            draftPlan[group.name] > 0
                              ? Math.min(
                                  100,
                                  (groupSpent(group.name) /
                                    draftPlan[group.name]) *
                                    100,
                                )
                              : groupSpent(group.name) > 0
                                ? 100
                                : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="budget-percent-text">
                      {draftPlan[group.name] > 0
                        ? `${Math.round(
                            (groupSpent(group.name) /
                              draftPlan[group.name]) *
                              100,
                          )}% of planned amount used`
                        : groupSpent(group.name) > 0
                          ? "No planned amount (Over plan)"
                          : "0% of planned amount used"}
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
              {distinctSpendingDays < 3 ? (
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
                        <topGroup.icon size={21} />
                      </span>
                      <h3>
                        {topGroup.name} Spending ({topGroupPct}%)
                      </h3>
                      <GroupBadge group={topGroup.name} />
                      <p>
                        {topGroup.name} is your largest spending category this month, totaling {money(groupSpent(topGroup.name))}.
                      </p>
                      <div className="insight-evidence">
                        {monthName} 2026 · {monthTransactions.filter((t) => t.group === topGroup.name).length} transactions
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
                      <h3>Culture & Learning</h3>
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
                      <h3>Unexpected Allocation</h3>
                      <GroupBadge group="Unexpected" />
                      <p>
                        Unexpected expenses total{" "}
                        {money(groupSpent("Unexpected"))}.{" "}
                        {plans.Unexpected > 0
                          ? `That’s ${money(Math.abs(plans.Unexpected - groupSpent("Unexpected")))} ${
                              groupSpent("Unexpected") > plans.Unexpected
                                ? "above"
                                : "within"
                            } your monthly allocation.`
                          : "No monthly unexpected allocation set."}
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
                          <span>{Math.round(chartYMax / 1000)}k</span>
                          <span>{Math.round((chartYMax * 0.75) / 1000)}k</span>
                          <span>{Math.round((chartYMax * 0.5) / 1000)}k</span>
                          <span>{Math.round((chartYMax * 0.25) / 1000)}k</span>
                          <span>0</span>
                        </div>
                        <svg
                          viewBox="0 0 600 210"
                          role="img"
                          aria-label={`Monthly spending over last 6 months`}
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
                          {budgetBase > 0 && (
                            <path
                              d={`M0 ${Math.max(10, 190 - (budgetBase / chartYMax) * 180)}H600`}
                              className="plan-line"
                            />
                          )}
                          <polyline
                            points={chartPoints
                              .map((p) => `${p.x},${p.y}`)
                              .join(" ")}
                            fill="none"
                            className="spend-line"
                          />
                          {chartPoints.map((p, i) => (
                            <circle
                              key={p.x}
                              cx={p.x}
                              cy={p.y}
                              r={i === chartPoints.length - 1 ? 6 : 4}
                              className="chart-point"
                            />
                          ))}
                        </svg>
                      </div>
                      <div className="chart-x-axis">
                        {chartMonths.map((m) => (
                          <span key={m.label}>{m.label}</span>
                        ))}
                      </div>
                      <div className="chart-summary">
                        <ChartNoAxesCombined size={17} />
                        <p>
                          {monthName} spending is {money(spent)} across{" "}
                          {monthTransactions.filter((t) => t.amount < 0).length}{" "}
                          recorded expense transactions.
                        </p>
                      </div>
                    </section>
                    <section className="panel chart-panel group-chart">
                      <h2>Where your money went</h2>
                      <p>Spending by group · {monthName}</p>
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
                <h2>End-of-Month Review</h2>
                <p>
                  Review your spending patterns and intentions for the upcoming month.
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
                      console.warn("Failed to save reflection to backend:", err)
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
                            "What went well with your budget this month...",
                            "What unexpected expenses or challenges arose...",
                            "What adjustments would you like to make next month...",
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
                  </div>
                  <span className="status-badge">Completed</span>
                </div>
                <div className="account-details">
                  <div>
                    <span>Email address</span>
                    <strong>{email}</strong>
                  </div>
                  <div>
                    <span>Account name</span>
                    <strong>{userName}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>Active</strong>
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
                          console.warn("Failed to update profile:", err)
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
                      <p>Organize spending across your four groups.</p>
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
                      <p>Labels for recorded income transactions.</p>
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
                <div className="sidebar-setting-row">
                  <div>
                    <h3>Compact sidebar</h3>
                    <p>Minimize the navigation sidebar to a sleek icon rail.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={sidebarCollapsed}
                    onClick={toggleSidebarCollapsed}
                    className={`setting-switch ${sidebarCollapsed ? "active" : ""}`}
                    aria-label="Toggle compact sidebar"
                  >
                    <span className="setting-switch-handle" />
                  </button>
                </div>
              </section>
              <section className="panel settings-block data-clear-block">
                <div className="settings-block-heading">
                  <h2>Data Management</h2>
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
                        Workspace Data
                      </strong>
                      <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                        {transactions.length === 0
                          ? "Clean slate — no transactions recorded yet."
                          : `${transactions.length} personal transactions recorded (${money(spent)} spent in ${monthName}).`}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Button
                        variant="destructive"
                        onClick={() => setModal("clear-data")}
                      >
                        <Trash2 size={16} />
                        Reset workspace & start fresh
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
              <section className="panel settings-block danger-zone">
                <div>
                  <h2>Account session</h2>
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
            <span className="footer-brand-wrap">
              <Brand variant="text" className="footer-text-brand" />
              <span className="footer-tagline">Personal Budgeting</span>
            </span>
            <span>
              Personal workspace
            </span>
          </footer>
          </div>
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
            type="button"
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
            <Icon size={item ? 19 : 23} />
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
          title="Add Transaction"
          onClose={() => setModal(null)}
        >
          <div className="add-options">
            <button onClick={() => openAdd("expense")}>
              <span className="group-icon quick-add-expense">
                <ArrowUpRight size={22} />
              </span>
              <div>
                <strong>Add Expense</strong>
              </div>
              <ChevronRight size={19} />
            </button>
            <button onClick={() => openAdd("income")}>
              <span className="group-icon green-icon">
                <ArrowDownLeft size={22} />
              </span>
              <div>
                <strong>Add Income</strong>
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
              ["Group", selected.group],
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
                    if (err instanceof ApiError && err.status === 404) {
                      // Already removed on server or not found — safe to proceed
                    } else {
                      console.warn("Backend transaction delete notice:", err)
                    }
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
          title="Notifications"
          onClose={() => setModal(null)}
        >
          <div className="notification-item">
            <BookOpen size={22} />
            <div>
              <strong>Monthly Reflection</strong>
              <p>Your October reflection is ready to review.</p>
              <button
                className="text-button"
                onClick={() => {
                  setModal(null)
                  navigate("Monthly Reflection")
                }}
              >
                Review reflection <ArrowRight size={15} />
              </button>
            </div>
          </div>
          <div className="notification-item">
            <CheckCircle2 size={22} />
            <div>
              <strong>Workspace Active</strong>
              <p>Welcome to Divido. Your financial dashboard is ready.</p>
            </div>
          </div>
        </Modal>
      )}
      {modal === "help" && (
        <Modal
          title="How Divido Works"
          onClose={() => setModal(null)}
        >
          <div className="help-content">
            <Leaf size={38} strokeWidth={1.4} />
            <p>
              Divido helps you plan, track, and reflect on your spending across
              four core groups.
            </p>
            <div className="help-steps">
              {[
                [
                  "1",
                  "Plan your budget",
                  "Set planned income, savings target, and allocations across the four groups.",
                ],
                [
                  "2",
                  "Record activity",
                  "Log expenses and income as transactions occur throughout the month.",
                ],
                [
                  "3",
                  "Reflect monthly",
                  "Review spending patterns and adjust intentions for the upcoming month.",
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
            <Button
              variant="primary"
              onClick={() => {
                setModal(null)
                setOnboardStep(0)
              }}
            >
              Restart Onboarding
              <ArrowRight size={16} />
            </Button>
          </div>
        </Modal>
      )}
      {modal === "insight" && (
        <Modal
          title="Spending Insight"
          subtitle={period}
          onClose={() => setModal(null)}
        >
          <div className="insight-detail">
            <span className="large-leaf">
              <ChartNoAxesCombined size={28} />
            </span>
            <p>
              Your dining total increased from LKR 8,000 to LKR 9,440 in this
              period — a difference of LKR 1,440, or 18%.
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
            <Button
              variant="primary"
              onClick={() => {
                setModal(null)
                navigate("Transactions")
                setSearch("Dining")
              }}
            >
              View Transactions <ArrowRight size={16} />
            </Button>
          </div>
        </Modal>
      )}
      {modal === "category" && (
        <Modal
          title={editingCategory ? "Edit category" : "Add category"}
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
              Spending group
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
          title="Reset workspace & start fresh?"
          onClose={() => setModal(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <p className="confirm-content">
              This will remove all recorded transactions, planned budgets, and custom allocations. Your workspace will reset to an empty clean slate from the beginning.
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
                This action resets your local storage data. All transactions and budget plans will be cleared back to zero.
              </span>
            </div>
            <div className="modal-actions">
              <Button onClick={() => setModal(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setTransactions([])
                  setPlans({ Needs: 0, Wants: 0, Culture: 0, Unexpected: 0 })
                  setPlannedIncome(0)
                  setSavings(0)
                  setDataCleared(true)
                  try {
                    localStorage.removeItem("divido-transactions")
                    localStorage.removeItem("divido-group-plans")
                    localStorage.removeItem("divido-planned-income")
                    localStorage.removeItem("divido-savings-target")
                    localStorage.setItem("divido-data-cleared", "true")
                  } catch {}
                  setModal(null)
                  setPage("Dashboard")
                  notify("Workspace reset. Starting from a fresh clean slate.")
                }}
              >
                <Trash2 size={16} />
                Reset everything & start fresh
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {modal === "signout" && (
        <Modal
          title="Sign out of Divido?"
          onClose={() => setModal(null)}
        >
          <p className="confirm-content">
            Are you sure you want to end your current session?
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
              "Income & Savings Target",
              "Group Allocations",
              "Review Monthly Plan",
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
                  <h3>Monthly Budgeting</h3>
                  <p>
                    Plan, record, and reflect on your finances across four core groups.
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
                    Set your planned monthly income and savings target.
                  </p>
                  <label className="field">
                    Planned monthly income
                    <div className="compact-money">
                      <span>LKR</span>
                      <input
                        aria-label="Planned monthly income"
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={draftIncome === 0 ? "" : draftIncome}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const cleaned = cleanNumberString(e.target.value)
                          setDraftIncome(cleaned === "" ? 0 : Number(cleaned))
                        }}
                      />
                    </div>
                  </label>
                  <label className="field">
                    Monthly savings target
                    <div className="compact-money">
                      <span>LKR</span>
                      <input
                        aria-label="Monthly savings target"
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={draftSavings === 0 ? "" : draftSavings}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const cleaned = cleanNumberString(e.target.value)
                          setDraftSavings(cleaned === "" ? 0 : Number(cleaned))
                        }}
                      />
                    </div>
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
                    Allocate your budget across the four spending groups.
                  </p>
                  {groups.map((g) => (
                    <label className="field" key={g.name}>
                      <GroupBadge group={g.name} />
                      <span className="field-help">{g.description}</span>
                      <div className="compact-money">
                        <span>LKR</span>
                        <input
                          aria-label={`${g.name} allocation`}
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={
                            draftPlan[g.name] === 0 ? "" : draftPlan[g.name]
                          }
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const cleaned = cleanNumberString(e.target.value)
                            setDraftPlan({
                              ...draftPlan,
                              [g.name]: cleaned === "" ? 0 : Number(cleaned),
                            })
                          }}
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
                    Review your monthly plan allocations before completing setup.
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
