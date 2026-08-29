import { Member, LoanApplication, PaymentTransaction, SavingsAccount, QueuedOfflineMutation, SyncReport } from '../types';

class ApiService {
  private baseUrl = '/api';

  public async checkHealth(): Promise<{ status: string; totalMembers?: number; totalLoans?: number }> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch (e: any) {
      return { status: 'offline' };
    }
  }

  public async fetchServerState(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/coop/state`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data;
  }

  public async syncWithServer(queue: QueuedOfflineMutation[]): Promise<{
    success: boolean;
    report: SyncReport;
    state: any;
  }> {
    const res = await fetch(`${this.baseUrl}/coop/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queue })
    });
    if (!res.ok) throw new Error(`Server sync failed with HTTP ${res.status}`);
    return await res.json();
  }

  public async registerMember(member: Partial<Member>): Promise<Member> {
    const res = await fetch(`${this.baseUrl}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    });
    if (!res.ok) throw new Error(`Failed to register member: HTTP ${res.status}`);
    const json = await res.json();
    return json.data;
  }

  public async applyLoan(loan: LoanApplication): Promise<LoanApplication> {
    const res = await fetch(`${this.baseUrl}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loan)
    });
    if (!res.ok) throw new Error(`Failed to submit loan: HTTP ${res.status}`);
    const json = await res.json();
    return json.data;
  }

  public async recordPayment(payment: PaymentTransaction): Promise<any> {
    const res = await fetch(`${this.baseUrl}/loans/${payment.loanId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment)
    });
    if (!res.ok) throw new Error(`Failed to record payment: HTTP ${res.status}`);
    return await res.json();
  }

  public async depositSavings(accountId: string, amount: number, notes?: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/savings/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, amount, notes })
    });
    if (!res.ok) throw new Error(`Failed to deposit savings: HTTP ${res.status}`);
    return await res.json();
  }

  public async withdrawSavings(accountId: string, amount: number, notes?: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/savings/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, amount, notes })
    });
    if (!res.ok) throw new Error(`Failed to withdraw savings: HTTP ${res.status}`);
    return await res.json();
  }

  public async resetServerDb(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/coop/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`Failed to reset server DB: HTTP ${res.status}`);
    return await res.json();
  }

  public async getAuditLogs(): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/audit-logs`);
    if (!res.ok) throw new Error(`Failed to fetch audit logs: HTTP ${res.status}`);
    const json = await res.json();
    return json.data;
  }
}

export const apiService = new ApiService();
