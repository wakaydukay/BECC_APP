import { useState, useEffect, FormEvent } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  CheckCircle2, 
  AlertCircle, 
  PieChart, 
  CreditCard, 
  Save,
  PlusCircle,
  Clock,
  Heart,
  Shield,
  Receipt,
  Check,
  RotateCcw,
  HeartHandshake,
  GraduationCap,
  Briefcase,
  Users,
  Calendar,
  FileText,
  DollarSign,
  PiggyBank,
  TrendingUp,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  Calculator,
  Info
} from 'lucide-react';
import { Member, LoanApplication, PaymentTransaction, SavingsAccount, SavingsTransaction, LoanType } from '../types';
import { formatCurrency, LOAN_PRODUCTS } from '../services/loanService';
import { 
  SAVINGS_CONFIG, 
  calculateSavingsInterest, 
  checkDormancyStatus, 
  depositToSavings, 
  withdrawFromSavings, 
  creditSavingsInterest, 
  chargeDormancyServiceFee,
  generateSavingsAccountForMember
} from '../services/savingsService';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  loans: LoanApplication[];
  transactions: PaymentTransaction[];
  savingsAccounts?: SavingsAccount[];
  savingsTransactions?: SavingsTransaction[];
  onUpdateMember: (updatedMember: Member) => void;
  onUpdateSavingsAccount?: (account: SavingsAccount, newTx?: SavingsTransaction) => void;
  onOpenLoanApplyForMember: (member: Member, defaultType?: LoanType, overdueLoanId?: string) => void;
  onOpenPaymentForMember: (member: Member) => void;
}

export function MemberDetailModal({
  isOpen,
  onClose,
  member,
  loans,
  transactions,
  savingsAccounts = [],
  savingsTransactions = [],
  onUpdateMember,
  onUpdateSavingsAccount,
  onOpenLoanApplyForMember,
  onOpenPaymentForMember
}: MemberDetailModalProps) {
  if (!isOpen || !member) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'coop' | 'aid' | 'loans' | 'savings'>('profile');

  // Savings Operation States
  const [savingsActionType, setSavingsActionType] = useState<'deposit' | 'withdraw' | 'credit_interest' | 'charge_dormancy' | null>(null);
  const [savingsAmountInput, setSavingsAmountInput] = useState<number>(1000);
  const [dormancyFeeInput, setDormancyFeeInput] = useState<number>(100);
  const [savingsOfficerInput, setSavingsOfficerInput] = useState<string>('Account Officer');
  const [savingsNotesInput, setSavingsNotesInput] = useState<string>('');
  const [savingsInterestMonths, setSavingsInterestMonths] = useState<number>(1);
  const [savingsFeedback, setSavingsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Editable Form States
  const [fullName, setFullName] = useState(member.fullName);
  const [phone, setPhone] = useState(member.phone);
  const [email, setEmail] = useState(member.email);
  const [address, setAddress] = useState(member.address || '');
  const [tinNumber, setTinNumber] = useState(member.tinNumber || '');
  const [dateAccepted, setDateAccepted] = useState(member.dateAccepted || member.joinDate || '');
  const [bodResolutionNo, setBodResolutionNo] = useState(member.bodResolutionNo || '');
  const [sharesSubscribed, setSharesSubscribed] = useState<number>(member.sharesSubscribed || 500);
  const [subscribedAmount, setSubscribedAmount] = useState<number>(member.subscribedAmount || ((member.sharesSubscribed || 500) * 100));
  const [initialPaidUp, setInitialPaidUp] = useState<number>(member.initialPaidUp || 12500);
  
  const [dateOfBirth, setDateOfBirth] = useState(member.dateOfBirth || '1990-01-01');
  const [age, setAge] = useState<number>(member.age || 35);
  const [gender, setGender] = useState(member.gender || 'Female');
  const [civilStatus, setCivilStatus] = useState(member.civilStatus || 'Married');
  const [highestEduAttainment, setHighestEduAttainment] = useState(member.highestEduAttainment || 'College Graduate');
  const [occupationOrSourceOfIncome, setOccupationOrSourceOfIncome] = useState(member.occupationOrSourceOfIncome || member.employerOrBusiness || '');
  const [numberOfDependents, setNumberOfDependents] = useState<number>(member.numberOfDependents || 0);
  const [religionOrAffiliation, setReligionOrAffiliation] = useState(member.religionOrAffiliation || 'Roman Catholic');
  const [annualIncome, setAnnualIncome] = useState<number>(member.annualIncome || (member.monthlySalaryOrIncome * 12) || 360000);

  const [dateOfTermination, setDateOfTermination] = useState(member.dateOfTermination || '');
  const [terminationResolution, setTerminationResolution] = useState(member.terminationResolution || '');

  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [showDepositBox, setShowDepositBox] = useState(false);
  const [aidPaymentSuccess, setAidPaymentSuccess] = useState<string | null>(null);

  // Sync state whenever member changes
  useEffect(() => {
    if (member) {
      setFullName(member.fullName);
      setPhone(member.phone);
      setEmail(member.email);
      setAddress(member.address || '');
      setTinNumber(member.tinNumber || '');
      setDateAccepted(member.dateAccepted || member.joinDate || '');
      setBodResolutionNo(member.bodResolutionNo || '');
      setSharesSubscribed(member.sharesSubscribed || 500);
      setSubscribedAmount(member.subscribedAmount || ((member.sharesSubscribed || 500) * 100));
      setInitialPaidUp(member.initialPaidUp || 12500);
      setDateOfBirth(member.dateOfBirth || '1990-01-01');
      setAge(member.age || 35);
      setGender(member.gender || 'Female');
      setCivilStatus(member.civilStatus || 'Married');
      setHighestEduAttainment(member.highestEduAttainment || 'College Graduate');
      setOccupationOrSourceOfIncome(member.occupationOrSourceOfIncome || member.employerOrBusiness || '');
      setNumberOfDependents(member.numberOfDependents || 0);
      setReligionOrAffiliation(member.religionOrAffiliation || 'Roman Catholic');
      setAnnualIncome(member.annualIncome || (member.monthlySalaryOrIncome * 12) || 360000);
      setDateOfTermination(member.dateOfTermination || '');
      setTerminationResolution(member.terminationResolution || '');
      setIsEditing(false);
    }
  }, [member]);

  const memberLoans = loans.filter((l) => l.memberId === member.id);
  const isPastDue = member.status === 'past_due' || member.pastDueAmount > 0;

  const isHap = member.isHapMember || (member.hapInfo && member.hapInfo.isPaid);
  const isMap = member.isMapMember || (member.mapInfo && member.mapInfo.isPaid);

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    const monthlySalaryOrIncome = Math.round((annualIncome || 0) / 12);

    const updated: Member = {
      ...member,
      fullName: fullName.trim() || member.fullName,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      tinNumber: tinNumber.trim(),
      dateAccepted: dateAccepted.trim() || member.joinDate,
      joinDate: dateAccepted.trim() || member.joinDate,
      bodResolutionNo: bodResolutionNo.trim(),
      sharesSubscribed: Number(sharesSubscribed) || 500,
      subscribedAmount: Number(subscribedAmount) || (Number(sharesSubscribed) * 100),
      initialPaidUp: Number(initialPaidUp) || 0,
      dateOfBirth: dateOfBirth || '1990-01-01',
      age: Number(age) || 30,
      gender: gender,
      civilStatus: civilStatus,
      highestEduAttainment: highestEduAttainment.trim(),
      occupationOrSourceOfIncome: occupationOrSourceOfIncome.trim(),
      employerOrBusiness: occupationOrSourceOfIncome.trim(),
      numberOfDependents: Number(numberOfDependents) || 0,
      religionOrAffiliation: religionOrAffiliation.trim(),
      annualIncome: Number(annualIncome) || 0,
      monthlySalaryOrIncome: monthlySalaryOrIncome,
      dateOfTermination: dateOfTermination.trim() || undefined,
      terminationResolution: terminationResolution.trim() || undefined,
      version: member.version + 1,
      updatedAt: new Date().toISOString()
    };

    onUpdateMember(updated);
    setIsEditing(false);
  };

  const handleAddCapitalDeposit = () => {
    if (depositAmount <= 0) return;
    const updated: Member = {
      ...member,
      shareCapital: member.shareCapital + depositAmount,
      version: member.version + 1,
      updatedAt: new Date().toISOString()
    };
    onUpdateMember(updated);
    setDepositAmount(0);
    setShowDepositBox(false);
  };

  const handlePayAidProgram = (programType: 'hap' | 'map') => {
    const now = new Date();
    const paidDate = now.toISOString().split('T')[0];
    const nextYear = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString().split('T')[0];
    const receiptNo = `OR-${programType.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let updated: Member;

    if (programType === 'hap') {
      updated = {
        ...member,
        isHapMember: true,
        hapInfo: {
          isEnrolled: true,
          isPaid: true,
          feeAmount: 1000,
          paidDate,
          validUntil: nextYear,
          receiptNo,
          benefitCoverage: '₱10,000 Hospitalization Assistance'
        },
        version: member.version + 1,
        updatedAt: new Date().toISOString()
      };
      setAidPaymentSuccess(`Health Aid Program fee (₱1,000) recorded! Receipt: ${receiptNo}. Member is active HAP.`);
    } else {
      updated = {
        ...member,
        isMapMember: true,
        mapInfo: {
          isEnrolled: true,
          isPaid: true,
          feeAmount: 1500,
          paidDate,
          validUntil: nextYear,
          receiptNo,
          benefitCoverage: '₱100,000 Mutual Life & Damayan Assistance'
        },
        version: member.version + 1,
        updatedAt: new Date().toISOString()
      };
      setAidPaymentSuccess(`Mutual Aid Program fee (₱1,500) recorded! Receipt: ${receiptNo}. Member is active MAP.`);
    }

    onUpdateMember(updated);
    setTimeout(() => {
      setAidPaymentSuccess(null);
    }, 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-fade-in flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
              {member.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {member.fullName}
                </h2>
                {isPastDue ? (
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full">
                    Past Due Account
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                    Good Standing
                  </span>
                )}
                {isHap && (
                  <span className="text-[10px] font-bold bg-teal-800 text-teal-200 border border-teal-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-teal-400 text-teal-400" /> HAP
                  </span>
                )}
                {isMap && (
                  <span className="text-[10px] font-bold bg-indigo-800 text-indigo-200 border border-indigo-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3 fill-indigo-400 text-indigo-400" /> MAP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {member.memberNumber} • TIN: {member.tinNumber || 'N/A'} • Version v{member.version}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                isEditing
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isEditing ? 'Cancel Edit' : 'Edit Member Info'}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal & Demographics</span>
          </button>
          <button
            onClick={() => setActiveTab('coop')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'coop'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Coop Acceptance & Shares</span>
          </button>
          <button
            onClick={() => setActiveTab('aid')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'aid'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Aid Programs (HAP/MAP)</span>
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'loans'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Loans & Credit ({memberLoans.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'savings'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Savings Account (3% p.a.)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs flex-1">
          {/* Aid Program Success Banner */}
          {aidPaymentSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-3.5 flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="font-semibold text-xs">{aidPaymentSuccess}</div>
            </div>
          )}

          {/* EDIT FORM WRAPPER */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-amber-900 font-semibold flex items-center justify-between">
                <span>Editing Member Profile — Changes will be encrypted in your offline vault.</span>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-xs shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Updates
                </button>
              </div>

              {/* 1. Official Cooperative Information Form */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-700" />
                  Official Cooperative Registration & BOD Resolution
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">T.I.N. (Tax Identification No.)</label>
                    <input
                      type="text"
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Date Accepted</label>
                    <input
                      type="date"
                      value={dateAccepted}
                      onChange={(e) => setDateAccepted(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">BOD Resolution No.</label>
                    <input
                      type="text"
                      value={bodResolutionNo}
                      onChange={(e) => setBodResolutionNo(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">No. of Shares Subscribed</label>
                    <input
                      type="number"
                      value={sharesSubscribed}
                      onChange={(e) => {
                        const shares = Number(e.target.value);
                        setSharesSubscribed(shares);
                        setSubscribedAmount(shares * 100);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Amount (Subscribed Capital)</label>
                    <input
                      type="number"
                      value={subscribedAmount}
                      onChange={(e) => setSubscribedAmount(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Initial Paid-up</label>
                    <input
                      type="number"
                      value={initialPaidUp}
                      onChange={(e) => setInitialPaidUp(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Personal & Demographics Form */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-700" />
                  Personal Details & Demographics
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Civil Status</label>
                    <select
                      value={civilStatus}
                      onChange={(e) => setCivilStatus(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">No. of Dependent/s</label>
                    <input
                      type="number"
                      value={numberOfDependents}
                      onChange={(e) => setNumberOfDependents(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Religion / Social Affiliation</label>
                    <input
                      type="text"
                      value={religionOrAffiliation}
                      onChange={(e) => setReligionOrAffiliation(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-slate-600 block mb-1 font-semibold">Residential Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              {/* 3. Socio-Economic & Education Form */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  Education, Occupation & Income
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Highest Edu. Attainment</label>
                    <input
                      type="text"
                      value={highestEduAttainment}
                      onChange={(e) => setHighestEduAttainment(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Occupation / Source of Income</label>
                    <input
                      type="text"
                      value={occupationOrSourceOfIncome}
                      onChange={(e) => setOccupationOrSourceOfIncome(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Annual Income (PHP)</label>
                    <input
                      type="number"
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Termination Records (If Applicable) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Termination Records (Optional)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1">Date of Termination</label>
                    <input
                      type="date"
                      value={dateOfTermination}
                      onChange={(e) => setDateOfTermination(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Termination Resolution No.</label>
                    <input
                      type="text"
                      value={terminationResolution}
                      onChange={(e) => setTerminationResolution(e.target.value)}
                      placeholder="e.g. BOD-TERM-2026-001"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Save Changes to Encrypted Vault
                </button>
              </div>
            </form>
          ) : (
            /* VIEW MODE DISPLAY */
            <>
              {/* TAB 1: PROFILE & DEMOGRAPHICS */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-700" />
                        Personal Identification & Civil Details
                      </h3>
                      <span className="text-[11px] font-mono text-slate-500">
                        T.I.N. {member.tinNumber || 'Not recorded'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">T.I.N.:</span>
                        <strong className="font-mono text-slate-900">{member.tinNumber || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Date of Birth:</span>
                        <strong className="text-slate-900">{member.dateOfBirth || '1990-01-01'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Age / Gender:</span>
                        <strong className="text-slate-900">{member.age || 35} yrs old • {member.gender || 'Female'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Civil Status:</span>
                        <strong className="text-slate-900">{member.civilStatus || 'Married'}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Religion / Social Affiliation:</span>
                        <strong className="text-slate-900">{member.religionOrAffiliation || 'Roman Catholic'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">No. of Dependent/s:</span>
                        <strong className="text-slate-900">{member.numberOfDependents || 0} dependent(s)</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Contact Phone:</span>
                        <strong className="font-mono text-slate-900">{member.phone}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase">Complete Residential Address:</span>
                      <strong className="text-slate-900">{member.address}</strong>
                    </div>
                  </div>

                  {/* Socio-Economic Profile Card */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                      <GraduationCap className="w-4 h-4 text-emerald-700" />
                      Education, Source of Income & Capacity
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Highest Edu. Attainment:</span>
                        <strong className="text-slate-900">{member.highestEduAttainment || 'College Graduate'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Occupation / Source of Income:</span>
                        <strong className="text-slate-900">{member.occupationOrSourceOfIncome || member.employerOrBusiness}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Annual Income:</span>
                        <strong className="text-emerald-800 font-mono text-sm">
                          {formatCurrency(member.annualIncome || (member.monthlySalaryOrIncome * 12))}
                        </strong>
                        <span className="text-[10px] text-slate-400 block">
                          (~{formatCurrency(member.monthlySalaryOrIncome)} / month)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: COOP ACCEPTANCE & SHARES */}
              {activeTab === 'coop' && (
                <div className="space-y-4">
                  {/* Cooperative Board Approval Card */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-emerald-50/40 space-y-3">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-emerald-200 pb-2">
                      <FileText className="w-4 h-4 text-emerald-700" />
                      Board Acceptance & Registry Records
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-700">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Date Accepted:</span>
                        <strong className="text-slate-900 font-mono">{member.dateAccepted || member.joinDate}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">BOD Resolution No.:</span>
                        <strong className="text-emerald-900 font-mono font-bold">{member.bodResolutionNo || 'BOD-RES-2021-042'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Classification:</span>
                        <span className="capitalize font-bold text-slate-900">{member.memberType} Member</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Standing:</span>
                        <span className="capitalize font-bold text-emerald-800">{member.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Share Capital Subscription Details */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-teal-700" />
                        Share Capital Subscription & Equity Balances
                      </h3>
                      <button
                        onClick={() => setShowDepositBox(!showDepositBox)}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Add Capital Deposit
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-700">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px] uppercase">Shares Subscribed:</span>
                        <strong className="text-slate-900 font-mono text-sm">{member.sharesSubscribed || 500} shares</strong>
                        <span className="text-[10px] text-slate-400 block">@ ₱100/share</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px] uppercase">Total Subscribed Amount:</span>
                        <strong className="text-slate-900 font-mono text-sm">
                          {formatCurrency(member.subscribedAmount || ((member.sharesSubscribed || 500) * 100))}
                        </strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px] uppercase">Initial Paid-up:</span>
                        <strong className="text-slate-900 font-mono text-sm">
                          {formatCurrency(member.initialPaidUp || 12500)}
                        </strong>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                        <span className="text-emerald-700 block text-[10px] uppercase font-bold">Current Share Capital:</span>
                        <strong className="text-emerald-900 font-mono text-sm font-bold">
                          {formatCurrency(member.shareCapital)}
                        </strong>
                      </div>
                    </div>

                    {/* Quick Capital Deposit Box */}
                    {showDepositBox && (
                      <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                        <div>
                          <h4 className="font-bold text-emerald-900 text-xs">Add Share Capital Contribution</h4>
                          <p className="text-[11px] text-emerald-700">Increases member equity. Reconciled additively during sync.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={100}
                            step={500}
                            placeholder="₱ Amount"
                            value={depositAmount || ''}
                            onChange={(e) => setDepositAmount(Number(e.target.value))}
                            className="bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-xs w-32 font-mono font-bold"
                          />
                          <button
                            onClick={handleAddCapitalDeposit}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1 rounded-lg text-xs"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Termination details if any */}
                  {(member.dateOfTermination || member.terminationResolution) && (
                    <div className="border border-rose-200 rounded-xl p-4 bg-rose-50/50 space-y-2">
                      <h3 className="font-bold text-rose-900 text-xs uppercase tracking-wider">
                        Termination Records
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-rose-600 block text-[10px]">Date of Termination:</span>
                          <strong>{member.dateOfTermination}</strong>
                        </div>
                        <div>
                          <span className="text-rose-600 block text-[10px]">Termination Resolution:</span>
                          <strong className="font-mono">{member.terminationResolution}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: HAP & MAP AID PROGRAMS */}
              {activeTab === 'aid' && (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <HeartHandshake className="w-4 h-4 text-emerald-700" />
                        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                          Cooperative Aid Program Indicators (HAP & MAP)
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Hospitalization & Damayan Protection
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* HAP Card */}
                      <div className={`p-4 rounded-xl border transition ${
                        isHap 
                          ? 'bg-teal-50/80 border-teal-300 text-teal-950' 
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-lg ${isHap ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              <Heart className="w-4 h-4 fill-current" />
                            </div>
                            <div>
                              <div className="font-bold text-xs">
                                Health Aid Program (HAP)
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Annual Fee: ₱1,000 • ₱10,000 Hospitalization Aid
                              </div>
                            </div>
                          </div>
                          {isHap ? (
                            <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full border border-teal-400">
                              <Check className="w-3 h-3" />
                              HAP MEMBER
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                              UNPAID / INACTIVE
                            </span>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-teal-200/60 text-[11px] space-y-1">
                          {isHap ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Payment Status:</span>
                                <span className="font-bold text-teal-900">Paid (Active Member)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Official Receipt:</span>
                                <span className="font-mono font-bold text-slate-800">{member.hapInfo?.receiptNo || 'OR-HAP-OK'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Coverage Validity:</span>
                                <span>Until {member.hapInfo?.validUntil || '2027-01-15'}</span>
                              </div>
                              <div className="pt-2 flex justify-end">
                                <button
                                  onClick={() => handlePayAidProgram('hap')}
                                  className="text-[10px] text-teal-800 hover:text-teal-950 font-semibold underline flex items-center gap-1"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Renew / Re-issue HAP
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-slate-500 text-[11px]">
                                Member has not yet settled the annual Health Aid fee (₱1,000). Pay now to activate coverage.
                              </p>
                              <div className="pt-2 flex justify-end">
                                <button
                                  id={`btn-pay-hap-${member.id}`}
                                  onClick={() => handlePayAidProgram('hap')}
                                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>Pay HAP Fee (₱1,000)</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* MAP Card */}
                      <div className={`p-4 rounded-xl border transition ${
                        isMap 
                          ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950' 
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-lg ${isMap ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              <Shield className="w-4 h-4 fill-current" />
                            </div>
                            <div>
                              <div className="font-bold text-xs">
                                Mutual Aid Program (MAP)
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Annual Fee: ₱1,500 • ₱100,000 Life & Damayan Aid
                              </div>
                            </div>
                          </div>
                          {isMap ? (
                            <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full border border-indigo-400">
                              <Check className="w-3 h-3" />
                              MAP MEMBER
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                              UNPAID / INACTIVE
                            </span>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-indigo-200/60 text-[11px] space-y-1">
                          {isMap ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Payment Status:</span>
                                <span className="font-bold text-indigo-900">Paid (Active Member)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Official Receipt:</span>
                                <span className="font-mono font-bold text-slate-800">{member.mapInfo?.receiptNo || 'OR-MAP-OK'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Coverage Validity:</span>
                                <span>Until {member.mapInfo?.validUntil || '2027-01-15'}</span>
                              </div>
                              <div className="pt-2 flex justify-end">
                                <button
                                  onClick={() => handlePayAidProgram('map')}
                                  className="text-[10px] text-indigo-800 hover:text-indigo-950 font-semibold underline flex items-center gap-1"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Renew / Re-issue MAP
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-slate-500 text-[11px]">
                                Member has not yet settled the annual Mutual Aid fee (₱1,500). Pay now to activate coverage.
                              </p>
                              <div className="pt-2 flex justify-end">
                                <button
                                  id={`btn-pay-map-${member.id}`}
                                  onClick={() => handlePayAidProgram('map')}
                                  className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>Pay MAP Fee (₱1,500)</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LOANS & CREDIT */}
              {activeTab === 'loans' && (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                        Member Loan Accounts ({memberLoans.length})
                      </h3>
                      <button
                        onClick={() => onOpenLoanApplyForMember(member)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                      >
                        + Apply Loan (15% p.a.)
                      </button>
                    </div>

                    {memberLoans.length === 0 ? (
                      <p className="text-slate-400 text-center py-6">No active loans on record for this member.</p>
                    ) : (
                      <div className="space-y-3">
                        {memberLoans.map((loan) => {
                          const config = LOAN_PRODUCTS[loan.loanType] || LOAN_PRODUCTS.salary_loan;
                          return (
                            <div
                              key={loan.id}
                              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${config.badgeColor}`}>
                                    {config.name}
                                  </span>
                                  <span className="font-mono text-slate-900 font-bold">{loan.loanNumber}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1">
                                  Diminishing Amortization (1st: {formatCurrency(loan.schedule[0]?.totalMonthlyPayment || loan.monthlyAmortization)}) • Next Due: {loan.nextDueDate} • Term: {loan.termMonths} mos @ 15% p.a.
                                </div>
                              </div>

                              <div className="text-right flex flex-col items-end gap-1">
                                <div className="font-bold text-slate-900 font-mono text-sm">
                                  {formatCurrency(loan.remainingBalance)}
                                </div>
                                {loan.status === 'past_due' ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                                      {loan.daysOverdue}d Past Due ({formatCurrency(loan.overdueAmount)})
                                    </span>
                                    <button
                                      onClick={() => onOpenLoanApplyForMember(member, 'restructuring_loan', loan.id)}
                                      className="text-[10px] bg-purple-700 hover:bg-purple-800 text-white font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs"
                                      title="Apply for loan restructuring to pay off overdue principal"
                                    >
                                      <RotateCcw className="w-2.5 h-2.5" />
                                      <span>Restructure</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    {loan.isRestructured && (
                                      <span className="text-[9px] font-mono bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                                        Restructured
                                      </span>
                                    )}
                                    <span className="text-[10px] text-emerald-700 font-semibold">Good Standing</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: SAVINGS ACCOUNT (3% P.A. & ₱300K CAP & DORMANCY) */}
              {activeTab === 'savings' && (() => {
                const currentSavingsAccount: SavingsAccount = savingsAccounts.find(s => s.memberId === member.id) || 
                  member.savingsAccount || 
                  generateSavingsAccountForMember(member, member.savingsDeposit || 2000).account;

                const currentSavingsTransactions: SavingsTransaction[] = savingsTransactions.filter(t => t.savingsAccountId === currentSavingsAccount.id);

                const dormancyStatus = checkDormancyStatus(currentSavingsAccount.lastTransactionDate);
                const isDormant = dormancyStatus.isDormant || currentSavingsAccount.isDormant || currentSavingsAccount.status === 'dormant';
                const interestCalc = calculateSavingsInterest(currentSavingsAccount.balance, 12);
                const monthlyInterestEst = calculateSavingsInterest(currentSavingsAccount.balance, 1).projectedInterestForMonths;
                const isCapped = currentSavingsAccount.balance > SAVINGS_CONFIG.maxInterestEarningBalance;

                const handleExecuteSavingsAction = () => {
                  if (!savingsActionType) return;
                  setSavingsFeedback(null);

                  try {
                    if (savingsActionType === 'deposit') {
                      if (savingsAmountInput <= 0) throw new Error('Deposit amount must be greater than 0.');
                      const { updatedAccount, transaction } = depositToSavings(currentSavingsAccount, savingsAmountInput, savingsOfficerInput, savingsNotesInput || 'OTC Savings Deposit');
                      if (onUpdateSavingsAccount) onUpdateSavingsAccount(updatedAccount, transaction);
                      setSavingsFeedback({ type: 'success', message: `Deposited ₱${savingsAmountInput.toLocaleString()}! Receipt: ${transaction.receiptOrRef}` });
                    } else if (savingsActionType === 'withdraw') {
                      if (savingsAmountInput <= 0) throw new Error('Withdrawal amount must be greater than 0.');
                      const { updatedAccount, transaction } = withdrawFromSavings(currentSavingsAccount, savingsAmountInput, savingsOfficerInput, savingsNotesInput || 'OTC Savings Withdrawal');
                      if (onUpdateSavingsAccount) onUpdateSavingsAccount(updatedAccount, transaction);
                      setSavingsFeedback({ type: 'success', message: `Withdrew ₱${savingsAmountInput.toLocaleString()}! Receipt: ${transaction.receiptOrRef}` });
                    } else if (savingsActionType === 'credit_interest') {
                      const { updatedAccount, transaction, interestAmount } = creditSavingsInterest(currentSavingsAccount, savingsInterestMonths, savingsOfficerInput);
                      if (onUpdateSavingsAccount) onUpdateSavingsAccount(updatedAccount, transaction);
                      setSavingsFeedback({ type: 'success', message: `Credited ₱${interestAmount.toLocaleString()} in 3.0% savings interest (${savingsInterestMonths} mo)! Receipt: ${transaction.receiptOrRef}` });
                    } else if (savingsActionType === 'charge_dormancy') {
                      if (dormancyFeeInput <= 0) throw new Error('Fee must be greater than 0.');
                      const { updatedAccount, transaction } = chargeDormancyServiceFee(currentSavingsAccount, dormancyFeeInput, savingsOfficerInput, savingsNotesInput || `Dormancy service fee charged by Account Officer due to 2+ years inactivity (Last Tx: ${currentSavingsAccount.lastTransactionDate})`);
                      if (onUpdateSavingsAccount) onUpdateSavingsAccount(updatedAccount, transaction);
                      setSavingsFeedback({ type: 'success', message: `Dormancy service fee of ₱${dormancyFeeInput.toLocaleString()} charged by ${savingsOfficerInput}! Receipt: ${transaction.receiptOrRef}` });
                    }
                    setSavingsActionType(null);
                  } catch (err: any) {
                    setSavingsFeedback({ type: 'error', message: err.message || 'Operation failed.' });
                  }
                };

                return (
                  <div className="space-y-4">
                    {/* Operation Feedback Toast */}
                    {savingsFeedback && (
                      <div className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                        savingsFeedback.type === 'success' 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                          : 'bg-rose-50 border-rose-300 text-rose-900'
                      }`}>
                        {savingsFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{savingsFeedback.message}</span>
                      </div>
                    )}

                    {/* DORMANT ACCOUNT INACTIVITY NOTIFICATION BANNER */}
                    {isDormant && (
                      <div className="bg-rose-50 border-2 border-rose-400/80 rounded-2xl p-4.5 text-rose-950 space-y-3 shadow-xs animate-fade-in">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-rose-200/80 text-rose-800 rounded-xl shrink-0 mt-0.5">
                              <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-rose-900 flex items-center gap-2">
                                <span>⚠️ Official Notice: Inactive / Dormant Savings Account (&gt; 2 Years)</span>
                              </h4>
                              <p className="text-xs text-rose-900 mt-1 leading-relaxed">
                                No financial transaction has been recorded on this account for over <strong>2 years (730+ days)</strong>. 
                                Last recorded transaction was on <strong className="underline">{currentSavingsAccount.lastTransactionDate || 'Account Opening'}</strong> ({dormancyStatus.daysInactive} days ago).
                              </p>
                              <p className="text-[11px] text-rose-800 mt-1">
                                <strong>Cooperative Policy:</strong> A dormancy maintenance service fee must be assessed and charged by the Account Officer to maintain the account ledger.
                              </p>
                            </div>
                          </div>

                          <button
                            id={`btn-charge-dormancy-${currentSavingsAccount.id}`}
                            onClick={() => {
                              setSavingsActionType('charge_dormancy');
                              setDormancyFeeInput(SAVINGS_CONFIG.standardDormancyServiceFee);
                              setSavingsNotesInput(`Periodic dormancy service fee charged by Account Officer due to 2+ years inactivity (Last Tx: ${currentSavingsAccount.lastTransactionDate})`);
                            }}
                            className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition shrink-0 flex items-center gap-1.5"
                          >
                            <ShieldAlert className="w-4 h-4" />
                            <span>Charge Dormancy Fee (₱100)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Top Savings Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Card 1: Total Balance & Status */}
                      <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-4 rounded-xl shadow-xs space-y-2">
                        <div className="flex justify-between items-center text-xs text-slate-300">
                          <span>Savings Account Balance</span>
                          <PiggyBank className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-bold font-mono text-emerald-300">
                          {formatCurrency(currentSavingsAccount.balance)}
                        </div>
                        <div className="text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-800 pt-2 font-mono">
                          <span>{currentSavingsAccount.accountNumber}</span>
                          <span className={isDormant ? 'text-rose-400 font-bold' : 'text-emerald-400 font-semibold'}>
                            {isDormant ? 'Dormant (> 2y)' : 'Active (3% p.a.)'}
                          </span>
                        </div>
                      </div>

                      {/* Card 2: 3.0% Earning vs Non-Earning (₱300k Cap) */}
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
                        <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                          <span>Interest-Earning Principal</span>
                          <TrendingUp className="w-4 h-4 text-teal-600" />
                        </div>
                        <div className="text-2xl font-bold font-mono text-teal-800">
                          {formatCurrency(currentSavingsAccount.earningBalance)}
                        </div>
                        <div className="text-[11px] flex items-center justify-between border-t border-slate-100 pt-2">
                          <span className="text-slate-500">Max ₱300,000 Cap:</span>
                          <span className={`font-semibold font-mono ${isCapped ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {isCapped ? `+${formatCurrency(currentSavingsAccount.nonEarningBalance)} (0%)` : '100% Earning'}
                          </span>
                        </div>
                      </div>

                      {/* Card 3: Yield Projection */}
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
                        <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                          <span>Annual 3% Interest Yield</span>
                          <Coins className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="text-2xl font-bold font-mono text-amber-800">
                          {formatCurrency(interestCalc.estimatedAnnualInterest)}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2 font-mono">
                          <span>Monthly Rate (0.25%):</span>
                          <span className="font-bold text-slate-900">~{formatCurrency(monthlyInterestEst)}/mo</span>
                        </div>
                      </div>
                    </div>

                    {/* Interest Rules Detail Callout */}
                    <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-xl text-emerald-950 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed space-y-1">
                        <div>
                          <strong className="text-emerald-900">Cooperative Savings Policy:</strong> Savings accounts earn <strong>3.0% interest per annum</strong> on deposits up to a <strong>maximum limit of ₱300,000.00</strong>. 
                          {isCapped && (
                            <span className="text-amber-900 font-bold ml-1">
                              Notice: ₱{currentSavingsAccount.nonEarningBalance.toLocaleString()} of this member's balance exceeds ₱300,000 and earns no interest.
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-emerald-800">
                          Last Transaction Date: <strong>{currentSavingsAccount.lastTransactionDate || 'N/A'}</strong> ({dormancyStatus.daysInactive} days ago). 
                          Accounts with no transactions for 2 continuous years (730 days) require Account Officer intervention.
                        </div>
                      </div>
                    </div>

                    {/* Operational Action Buttons Bar */}
                    <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-700 px-2">Account Officer Actions:</span>
                      <button
                        onClick={() => {
                          setSavingsActionType('deposit');
                          setSavingsAmountInput(1000);
                          setSavingsNotesInput('OTC Savings Deposit');
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-2xs transition"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Deposit</span>
                      </button>

                      <button
                        onClick={() => {
                          setSavingsActionType('withdraw');
                          setSavingsAmountInput(Math.min(1000, currentSavingsAccount.balance));
                          setSavingsNotesInput('OTC Savings Withdrawal');
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-2xs transition"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Withdraw</span>
                      </button>

                      <button
                        onClick={() => {
                          setSavingsActionType('credit_interest');
                          setSavingsInterestMonths(1);
                        }}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-2xs transition"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Credit 3% Interest</span>
                      </button>

                      <button
                        onClick={() => {
                          setSavingsActionType('charge_dormancy');
                          setDormancyFeeInput(SAVINGS_CONFIG.standardDormancyServiceFee);
                          setSavingsNotesInput(`Dormancy service fee charged by Account Officer`);
                        }}
                        className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-2xs transition"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Charge Dormancy Fee</span>
                      </button>
                    </div>

                    {/* Inline Form for Chosen Action */}
                    {savingsActionType && (
                      <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-3 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                            {savingsActionType === 'deposit' && <ArrowDownLeft className="w-4 h-4 text-emerald-600" />}
                            {savingsActionType === 'withdraw' && <ArrowUpRight className="w-4 h-4 text-amber-600" />}
                            {savingsActionType === 'credit_interest' && <TrendingUp className="w-4 h-4 text-teal-600" />}
                            {savingsActionType === 'charge_dormancy' && <ShieldAlert className="w-4 h-4 text-rose-600" />}
                            <span>
                              {savingsActionType === 'deposit' && 'Process Savings Deposit'}
                              {savingsActionType === 'withdraw' && 'Process Savings Withdrawal'}
                              {savingsActionType === 'credit_interest' && 'Post 3.0% p.a. Savings Interest'}
                              {savingsActionType === 'charge_dormancy' && 'Charge Dormancy Service Fee'}
                            </span>
                          </h4>
                          <button
                            onClick={() => setSavingsActionType(null)}
                            className="text-slate-400 hover:text-slate-700 p-1 text-xs"
                          >
                            ✕ Cancel
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {savingsActionType === 'charge_dormancy' ? (
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Dormancy Fee Amount (₱) *
                              </label>
                              <input
                                type="number"
                                min={10}
                                step={10}
                                value={dormancyFeeInput}
                                onChange={(e) => setDormancyFeeInput(Number(e.target.value))}
                                className="w-full bg-white border border-rose-300 rounded-lg p-2 font-mono font-bold text-xs"
                              />
                            </div>
                          ) : savingsActionType === 'credit_interest' ? (
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Period in Months
                              </label>
                              <select
                                value={savingsInterestMonths}
                                onChange={(e) => setSavingsInterestMonths(Number(e.target.value))}
                                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                              >
                                <option value={1}>1 Month (0.25%) — {formatCurrency(calculateSavingsInterest(currentSavingsAccount.balance, 1).projectedInterestForMonths)}</option>
                                <option value={3}>3 Months (Quarterly) — {formatCurrency(calculateSavingsInterest(currentSavingsAccount.balance, 3).projectedInterestForMonths)}</option>
                                <option value={6}>6 Months (Semi-annual) — {formatCurrency(calculateSavingsInterest(currentSavingsAccount.balance, 6).projectedInterestForMonths)}</option>
                                <option value={12}>12 Months (Full 3.0% Annual) — {formatCurrency(calculateSavingsInterest(currentSavingsAccount.balance, 12).projectedInterestForMonths)}</option>
                              </select>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Amount (₱) *
                              </label>
                              <input
                                type="number"
                                min={50}
                                step={100}
                                value={savingsAmountInput}
                                onChange={(e) => setSavingsAmountInput(Number(e.target.value))}
                                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-xs"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Authorized Account Officer
                            </label>
                            <input
                              type="text"
                              value={savingsOfficerInput}
                              onChange={(e) => setSavingsOfficerInput(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Remarks / Reason
                            </label>
                            <input
                              type="text"
                              value={savingsNotesInput}
                              onChange={(e) => setSavingsNotesInput(e.target.value)}
                              placeholder="Transaction notes"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setSavingsActionType(null)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleExecuteSavingsAction}
                            className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg transition shadow-xs flex items-center gap-1 ${
                              savingsActionType === 'charge_dormancy'
                                ? 'bg-rose-700 hover:bg-rose-800'
                                : 'bg-emerald-700 hover:bg-emerald-800'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm & Record Transaction</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Savings Transaction Ledger Table */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                          Savings Transaction Ledger ({currentSavingsTransactions.length})
                        </h4>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Account: {currentSavingsAccount.accountNumber}
                        </span>
                      </div>

                      {currentSavingsTransactions.length === 0 ? (
                        <p className="text-slate-400 text-center py-6 text-xs">
                          No savings transaction history recorded yet for this account.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Reference / OR</th>
                                <th className="py-2.5 px-3">Transaction Type</th>
                                <th className="py-2.5 px-3 text-right">Amount</th>
                                <th className="py-2.5 px-3 text-right">Balance After</th>
                                <th className="py-2.5 px-3">Officer</th>
                                <th className="py-2.5 px-3">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px]">
                              {currentSavingsTransactions.map((tx) => {
                                const isPositive = tx.type === 'deposit' || tx.type === 'interest_credited' || tx.type === 'account_opening';
                                return (
                                  <tr key={tx.id} className="hover:bg-slate-50">
                                    <td className="py-2.5 px-3 font-medium text-slate-800">{tx.date}</td>
                                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{tx.receiptOrRef}</td>
                                    <td className="py-2.5 px-3">
                                      {tx.type === 'interest_credited' && (
                                        <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold text-[10px]">
                                          3.0% Interest
                                        </span>
                                      )}
                                      {tx.type === 'dormancy_fee' && (
                                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold text-[10px]">
                                          Dormancy Fee
                                        </span>
                                      )}
                                      {tx.type === 'deposit' && (
                                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">
                                          Deposit
                                        </span>
                                      )}
                                      {tx.type === 'withdrawal' && (
                                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]">
                                          Withdrawal
                                        </span>
                                      )}
                                      {tx.type === 'account_opening' && (
                                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold text-[10px]">
                                          Opening
                                        </span>
                                      )}
                                    </td>
                                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                                      isPositive ? 'text-emerald-700' : 'text-rose-700'
                                    }`}>
                                      {isPositive ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                      {formatCurrency(tx.balanceAfter)}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-600">{tx.performedBy || 'System'}</td>
                                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{tx.notes || '-'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center shrink-0">
          <div className="text-[11px] text-slate-500 font-mono">
            Encrypted AES-GCM local storage • Auto-sync enabled
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

