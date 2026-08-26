export interface BookLoan {
  id: string;
  bookId: number;
  borrowerId: number;
  borrowerName: string;
  startDate: string;
  endDate: string;
  extended: boolean;
}

const STORAGE_KEY = 'book_loans';

function loadLoans(): BookLoan[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveLoans(loans: BookLoan[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const bookLoanStore = {
  getAll(): BookLoan[] {
    return loadLoans();
  },

  getByUser(userId: number): BookLoan[] {
    return loadLoans().filter((l) => l.borrowerId === userId);
  },

  isRented(bookId: number): boolean {
    return loadLoans().some((l) => l.bookId === bookId);
  },

  getLoanForBook(bookId: number): BookLoan | undefined {
    return loadLoans().find((l) => l.bookId === bookId);
  },

  rent(bookId: number, borrowerId: number, borrowerName: string, startDate: string): BookLoan {
    const loans = loadLoans();
    const loan: BookLoan = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      bookId,
      borrowerId,
      borrowerName,
      startDate,
      endDate: addDays(startDate, 14),
      extended: false,
    };
    saveLoans([...loans, loan]);
    return loan;
  },

  cancel(loanId: string) {
    saveLoans(loadLoans().filter((l) => l.id !== loanId));
  },

  extend(loanId: string) {
    const loans = loadLoans().map((l) => {
      if (l.id !== loanId) return l;
      return { ...l, endDate: addDays(l.endDate, 14), extended: true };
    });
    saveLoans(loans);
  },
};
