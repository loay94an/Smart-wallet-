export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  desc?: string;
}

export type DebtType = 'debt' | 'receivable'; // debt = ديون عليك, receivable = مستحقات لك

export interface Debt {
  id: string;
  personId: string;
  type: DebtType;
  amount: number;
  desc: string;
  date: string;
}

export type PaymentMethod = 'cash' | 'bank' | 'card';

export interface Payment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  notes?: string;
}

export interface Person {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export type WorkCalculationType = 'hourly' | 'piece';
export type WorkStatus = 'active' | 'pending' | 'delayed' | 'completed' | 'cancelled';

export interface Work {
  id: string;
  name: string;
  client?: string;
  calculationType: WorkCalculationType;
  rate: number; // hourly rate or piece price
  unitName: string; // e.g., 'قطعة', 'ساعة', 'متر'
  status: WorkStatus;
  startDate?: string | null;
  endDate?: string | null;
  desc?: string;
}

export interface WorkLog {
  id: string;
  workId: string;
  date: string;
  start?: string;
  end?: string;
  hours: number;
  quantity: number;
  desc?: string;
}

export type WorkPaymentType = 'salary' | 'payment' | 'bonus';

export interface WorkPayment {
  id: string;
  workId: string;
  type: WorkPaymentType;
  amount: number;
  date: string;
  method: PaymentMethod;
  desc?: string;
  createdAt?: string;
}

export type GoalFrequency = 'daily' | 'weekly' | 'monthly';

export interface WorkGoal {
  id: string;
  workId: string;
  type: GoalFrequency;
  target: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  target: number;
  savedAmount: number;
  deadline?: string;
  icon?: string;
}

export interface NotebookNode {
  id: string;
  title: string;
  icon?: string;
  date?: string;
  amount?: number;
  desc?: string;
  tag?: string;
  children?: NotebookNode[];
}

export interface StandardNote {
  id: string;
  title: string;
  content: string;
  date: string;
  category?: string;
  tags?: string[];
}

export interface MindMapNode {
  id: string;
  title: string;
  color?: string;
  children?: MindMapNode[];
}

export interface MindMap {
  id: string;
  title: string;
  root: MindMapNode;
  date: string;
}

export interface SecurityConfig {
  enabled: boolean;
  type: 'off' | 'pin' | 'pattern';
  pin: string;
  pattern: number[];
}

export interface SettingsConfig {
  currency: string;
  language: 'ar' | 'en';
  theme: string;
  autoCloudSync: boolean;
  syncKey: string;
  userEmail: string;
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  people: Person[];
  debts: Debt[];
  payments: Payment[];
  works: Work[];
  workLogs: WorkLog[];
  workPayments: WorkPayment[];
  workGoals: WorkGoal[];
  budgets: Budget[];
  financialGoals: FinancialGoal[];
  notebooks: NotebookNode[];
  standardNotes: StandardNote[];
  mindMaps: MindMap[];
  exchangeRates: Record<string, number>;
  settings: SettingsConfig;
  security: SecurityConfig;
  lastUpdated?: string;
}
