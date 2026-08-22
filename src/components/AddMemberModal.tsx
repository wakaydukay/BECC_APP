import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  FileText, 
  DollarSign, 
  User, 
  MapPin, 
  GraduationCap, 
  Heart, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  Users,
  Calendar,
  CreditCard,
  Building,
  Info
} from 'lucide-react';
import { Member, MemberType, MemberStatus } from '../types';
import { generateSavingsAccountForMember } from '../services/savingsService';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (member: Member) => Promise<void> | void;
  existingCount: number;
}

export function AddMemberModal({
  isOpen,
  onClose,
  onAddMember,
  existingCount
}: AddMemberModalProps) {
  // Generate default sequential member number and BOD Resolution
  const year = new Date().getFullYear();
  const todayStr = new Date().toISOString().split('T')[0];
  const nextSeq = String(existingCount + 1).padStart(4, '0');

  // Form State
  const [activeTab, setActiveTab] = useState<'coop' | 'personal' | 'socio' | 'programs'>('coop');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Cooperative Registration Fields
  const [memberNumber, setMemberNumber] = useState(`COOP-${year}-${nextSeq}`);
  const [dateAccepted, setDateAccepted] = useState(todayStr);
  const [bodResolutionNo, setBodResolutionNo] = useState(`BOD-RES-${year}-${String(Math.floor(10 + Math.random() * 90))}`);
  const [memberType, setMemberType] = useState<MemberType>('regular');
  const [status, setStatus] = useState<MemberStatus>('good_standing');

  // Share Capital & Equity Fields
  const [sharesSubscribed, setSharesSubscribed] = useState<number>(500); // 500 shares standard
  const [shareParValue] = useState<number>(100); // ₱100 per share standard
  const [subscribedAmount, setSubscribedAmount] = useState<number>(50000); // shares * par value
  const [initialPaidUp, setInitialPaidUp] = useState<number>(12500); // 25% minimum
  const [initialSavings, setInitialSavings] = useState<number>(2000);

  // Personal Identification & Demographics
  const [fullName, setFullName] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1990-01-01');
  const [age, setAge] = useState<number>(36);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [civilStatus, setCivilStatus] = useState<'Single' | 'Married' | 'Widowed' | 'Separated' | 'Divorced'>('Married');
  const [religionOrAffiliation, setReligionOrAffiliation] = useState('Roman Catholic');
  const [numberOfDependents, setNumberOfDependents] = useState<number>(2);

  // Contact & Address
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('+63 ');
  const [email, setEmail] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Spouse');

  // Socio-Economic Profile
  const [highestEduAttainment, setHighestEduAttainment] = useState('College Graduate');
  const [occupationOrSourceOfIncome, setOccupationOrSourceOfIncome] = useState('');
  const [annualIncome, setAnnualIncome] = useState<number>(360000);

  // Aid Programs (HAP & MAP) Initial Enrollment
  const [enrollHap, setEnrollHap] = useState(true);
  const [payHapNow, setPayHapNow] = useState(true);
  const [enrollMap, setEnrollMap] = useState(true);
  const [payMapNow, setPayMapNow] = useState(true);

  // Termination Details (Optional)
  const [dateOfTermination, setDateOfTermination] = useState('');
  const [terminationResolution, setTerminationResolution] = useState('');

  // Auto-calculate Subscribed Amount when shares change
  useEffect(() => {
    const total = (sharesSubscribed || 0) * shareParValue;
    setSubscribedAmount(total);
    // Suggest 25% minimum paid up if initialPaidUp is 0 or proportional
    if (initialPaidUp === 0 || initialPaidUp === total * 0.25) {
      setInitialPaidUp(total * 0.25);
    }
  }, [sharesSubscribed, shareParValue]);

  // Auto-calculate Age when DOB changes
  useEffect(() => {
    if (dateOfBirth) {
      const birth = new Date(dateOfBirth);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      if (!isNaN(calculatedAge) && calculatedAge >= 0) {
        setAge(calculatedAge);
      }
    }
  }, [dateOfBirth]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Form Validations
    if (!fullName.trim()) {
      setValidationError('Full Name is required.');
      setActiveTab('personal');
      return;
    }
    if (!tinNumber.trim()) {
      setValidationError('Tax Identification Number (T.I.N.) is required.');
      setActiveTab('personal');
      return;
    }
    if (!address.trim()) {
      setValidationError('Complete Residential Address is required.');
      setActiveTab('personal');
      return;
    }
    if (!bodResolutionNo.trim()) {
      setValidationError('BOD Resolution Number is required.');
      setActiveTab('coop');
      return;
    }
    if (!dateAccepted.trim()) {
      setValidationError('Date Accepted is required.');
      setActiveTab('coop');
      return;
    }
    if (sharesSubscribed <= 0) {
      setValidationError('Number of Subscribed Shares must be greater than zero.');
      setActiveTab('coop');
      return;
    }
    if (initialPaidUp < 0) {
      setValidationError('Initial Paid-up amount cannot be negative.');
      setActiveTab('coop');
      return;
    }

    setIsSubmitting(true);

    try {
      const newMemberId = `mem-${Date.now()}`;
      const monthlyIncome = Math.round((annualIncome || 0) / 12);
      const nextYearDate = new Date();
      nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
      const validUntilStr = nextYearDate.toISOString().split('T')[0];

      const generatedMemberNumber = memberNumber.trim() || `COOP-${year}-${nextSeq}`;
      const savingsAccountNumber = `SA-${year}-${generatedMemberNumber.split('-')[2] || nextSeq}`;

      const newMember: Member = {
        id: newMemberId,
        memberNumber: generatedMemberNumber,
        fullName: fullName.trim(),
        email: email.trim() || `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@coopmail.ph`,
        phone: phone.trim() || '+63 900 000 0000',
        
        // Official Cooperative Registration
        tinNumber: tinNumber.trim(),
        dateAccepted: dateAccepted.trim(),
        bodResolutionNo: bodResolutionNo.trim(),
        sharesSubscribed: Number(sharesSubscribed) || 500,
        subscribedAmount: Number(subscribedAmount) || (Number(sharesSubscribed) * 100),
        initialPaidUp: Number(initialPaidUp) || 0,
        shareCapital: Number(initialPaidUp) || 0,
        savingsDeposit: Number(initialSavings) || 0,
        savingsAccountNumber: savingsAccountNumber,

        // Personal & Demographics
        address: address.trim(),
        dateOfBirth: dateOfBirth || '1990-01-01',
        age: Number(age) || 30,
        gender: gender,
        civilStatus: civilStatus,
        highestEduAttainment: highestEduAttainment.trim() || 'College Graduate',
        occupationOrSourceOfIncome: occupationOrSourceOfIncome.trim() || 'Cooperative Member',
        numberOfDependents: Number(numberOfDependents) || 0,
        religionOrAffiliation: religionOrAffiliation.trim() || 'Roman Catholic',
        annualIncome: Number(annualIncome) || 360000,

        // Termination Details (if specified)
        dateOfTermination: dateOfTermination.trim() || undefined,
        terminationResolution: terminationResolution.trim() || undefined,

        // Operational & Compatibility
        joinDate: dateAccepted.trim(),
        employerOrBusiness: occupationOrSourceOfIncome.trim() || 'Cooperative Member',
        monthlySalaryOrIncome: monthlyIncome,
        memberType: memberType,
        status: status,

        // Health Aid Program (HAP)
        isHapMember: enrollHap && payHapNow,
        hapInfo: {
          isEnrolled: enrollHap,
          isPaid: enrollHap && payHapNow,
          feeAmount: 1000,
          paidDate: enrollHap && payHapNow ? todayStr : undefined,
          validUntil: enrollHap && payHapNow ? validUntilStr : undefined,
          receiptNo: enrollHap && payHapNow ? `OR-HAP-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
          benefitCoverage: '₱10,000 Hospitalization Assistance'
        },

        // Mutual Aid Program (MAP)
        isMapMember: enrollMap && payMapNow,
        mapInfo: {
          isEnrolled: enrollMap,
          isPaid: enrollMap && payMapNow,
          feeAmount: 1500,
          paidDate: enrollMap && payMapNow ? todayStr : undefined,
          validUntil: enrollMap && payMapNow ? validUntilStr : undefined,
          receiptNo: enrollMap && payMapNow ? `OR-MAP-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
          benefitCoverage: '₱100,000 Mutual Life & Damayan Assistance'
        },

        // Financial & Standing
        activeLoanCount: 0,
        totalLoanBalance: 0,
        pastDueAmount: 0,
        creditScoreCategory: 'A (Excellent)',
        emergencyContact: {
          name: emergencyName.trim() || 'Cooperative Secretariat',
          phone: emergencyPhone.trim() || phone.trim(),
          relationship: emergencyRelationship || 'Spouse'
        },
        version: 1,
        updatedAt: new Date().toISOString()
      };

      await onAddMember(newMember);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to create member record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Register New Cooperative Member</h2>
                <span className="bg-emerald-500/30 text-emerald-200 text-[11px] font-mono px-2 py-0.5 rounded border border-emerald-400/30">
                  Offline Encrypted Vault
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Complete official membership acceptance, share subscription, demographics, and aid programs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 flex items-center gap-2 text-xs font-semibold text-rose-800 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 overflow-x-auto gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('coop')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'coop'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>1. BOD & Share Capital</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'personal'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>2. Personal & T.I.N. Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('socio')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'socio'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>3. Education & Income</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('programs')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'programs'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>4. HAP & MAP Programs</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: COOP REGISTRATION & SHARE CAPITAL */}
          {activeTab === 'coop' && (
            <div className="space-y-6">
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Cooperative Acceptance & Board Resolution</span>
                </div>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Official registry records approved by the Board of Directors.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Member ID / Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={memberNumber}
                    onChange={(e) => setMemberNumber(e.target.value)}
                    placeholder="COOP-2026-0001"
                    className="w-full text-xs font-mono font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date Accepted *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateAccepted}
                    onChange={(e) => setDateAccepted(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    BOD Resolution No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={bodResolutionNo}
                    onChange={(e) => setBodResolutionNo(e.target.value)}
                    placeholder="BOD-RES-2026-042"
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Membership Classification
                  </label>
                  <select
                    value={memberType}
                    onChange={(e) => setMemberType(e.target.value as MemberType)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="regular">Regular Member (Voting & Full Rights)</option>
                    <option value="associate">Associate Member (Non-voting)</option>
                    <option value="honorary">Honorary Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Membership Standing
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MemberStatus)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="good_standing">Good Standing (Active)</option>
                    <option value="active">Active</option>
                    <option value="past_due">Past Due / Delinquent</option>
                    <option value="dormant">Dormant</option>
                  </select>
                </div>
              </div>

              {/* Share Capital Subscription Section */}
              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Share Capital Subscription & Equity
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Standard share par value is ₱100.00 per share. Initial paid-up is credited to member's share capital.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. of Shares Subscribed *
                    </label>
                    <input
                      type="number"
                      required
                      min={10}
                      step={10}
                      value={sharesSubscribed}
                      onChange={(e) => setSharesSubscribed(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      @ ₱100.00 par value / share
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Amount (Total Subscribed)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-500">₱</span>
                      <input
                        type="number"
                        readOnly
                        value={subscribedAmount}
                        className="w-full text-xs font-mono font-bold pl-7 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-800"
                      />
                    </div>
                    <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
                      Total equity pledged
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Initial Paid-up Capital *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-500">₱</span>
                      <input
                        type="number"
                        required
                        min={0}
                        step={100}
                        value={initialPaidUp}
                        onChange={(e) => setInitialPaidUp(Number(e.target.value))}
                        className="w-full text-xs font-mono font-bold pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white text-emerald-900"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Min 25% (₱{(subscribedAmount * 0.25).toLocaleString()})
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Initial Savings Deposit
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-500">₱</span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={initialSavings}
                        onChange={(e) => setInitialSavings(Number(e.target.value))}
                        className="w-full text-xs font-mono font-bold pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Auto-opens Savings Account (3% p.a.)
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-2 bg-emerald-50/80 border border-emerald-200/80 p-3 rounded-lg text-xs text-emerald-900">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold text-emerald-950">Automated Savings Account Feature:</span> Upon registration approval, a dedicated Savings Account will be generated automatically.
                    Savings earn <strong className="font-semibold text-emerald-900">3.0% interest per annum</strong> on deposits up to a <strong className="font-semibold text-emerald-900">maximum of ₱300,000.00</strong>. Amounts exceeding ₱300,000 will not earn interest. Inactivity for 2 years triggers a dormancy alert & periodic service fee.
                  </div>
                </div>
              </div>

              {/* Termination Section (Optional) */}
              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Termination Records (Optional / If Terminated)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Date of Termination
                    </label>
                    <input
                      type="date"
                      value={dateOfTermination}
                      onChange={(e) => setDateOfTermination(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Termination Resolution No.
                    </label>
                    <input
                      type="text"
                      value={terminationResolution}
                      onChange={(e) => setTerminationResolution(e.target.value)}
                      placeholder="e.g. BOD-TERM-2026-003"
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL & T.I.N. DETAILS */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>Personal Identification, Demographics & Residence</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official civil details required for CDA compliance and statutory identification.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Member Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maria Corazon Bautista-Santos"
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    T.I.N. (Tax Identification No.) *
                  </label>
                  <input
                    type="text"
                    required
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    placeholder="e.g. 123-456-789-000"
                    className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Civil Status *
                  </label>
                  <select
                    value={civilStatus}
                    onChange={(e) => setCivilStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Religion / Social Affiliation *
                  </label>
                  <input
                    type="text"
                    value={religionOrAffiliation}
                    onChange={(e) => setReligionOrAffiliation(e.target.value)}
                    placeholder="e.g. Roman Catholic / Rotary Club"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. of Dependent/s *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={numberOfDependents}
                    onChange={(e) => setNumberOfDependents(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Address & Contacts */}
              <div className="border-t border-slate-200 pt-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>Residential Address & Contact Points</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Complete Residential Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Lot/Block No., Street, Barangay, Municipality/City, Province"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Phone Number *
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+63 917 123 4567"
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="member.name@email.com"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">
                    Emergency Contact Person
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Contact Name</label>
                      <input
                        type="text"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Contact Phone</label>
                      <input
                        type="text"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="+63 9XX XXX XXXX"
                        className="w-full text-xs font-mono px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Relationship</label>
                      <input
                        type="text"
                        value={emergencyRelationship}
                        onChange={(e) => setEmergencyRelationship(e.target.value)}
                        placeholder="Spouse / Parent / Sibling"
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SOCIO-ECONOMIC & EDUCATION */}
          {activeTab === 'socio' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  <span>Educational Attainment & Income Sources</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assists in credit evaluation, loan capacity determination, and cooperative education programs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Highest Educational Attainment *
                  </label>
                  <select
                    value={highestEduAttainment}
                    onChange={(e) => setHighestEduAttainment(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="Elementary Graduate">Elementary Graduate</option>
                    <option value="High School Graduate">High School Graduate</option>
                    <option value="Vocational / Technical Diploma">Vocational / Technical Diploma</option>
                    <option value="College Undergraduate">College Undergraduate</option>
                    <option value="College Graduate (Bachelor's Degree)">College Graduate (Bachelor's Degree)</option>
                    <option value="Post Graduate (Masteral / Doctorate)">Post Graduate (Masteral / Doctorate)</option>
                    <option value="Professional License Holder">Professional License Holder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Occupation / Source of Income *
                  </label>
                  <input
                    type="text"
                    required
                    value={occupationOrSourceOfIncome}
                    onChange={(e) => setOccupationOrSourceOfIncome(e.target.value)}
                    placeholder="e.g. Public School Teacher / Agrivet Store Owner"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Annual Income (PHP) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-500">₱</span>
                    <input
                      type="number"
                      required
                      min={0}
                      step={5000}
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white text-emerald-950"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Equivalent to ~<strong>₱{Math.round((annualIncome || 0) / 12).toLocaleString()}</strong> / month
                  </span>
                </div>

                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 flex items-center gap-3">
                  <Info className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div className="text-xs text-emerald-900">
                    <span className="font-bold block">Maximum Loanable Benchmark</span>
                    <span>Max loanable across coop products is ₱200,000.00 with repayment terms up to 4 years (48 months) @ 15% p.a.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HAP & MAP AID PROGRAMS */}
          {activeTab === 'programs' && (
            <div className="space-y-6">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-teal-950 font-bold text-sm">
                  <Heart className="w-4 h-4 text-teal-700" />
                  <span>Cooperative Aid Protection Programs (HAP & MAP)</span>
                </div>
                <p className="text-xs text-teal-700 mt-0.5">
                  Members with paid annual aid program fees display active HAP / MAP status badges and are covered for hospital and mutual damayan benefits.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Health Aid Program (HAP) */}
                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                        <Heart className="w-4 h-4 fill-current" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">
                          Health Aid Program (HAP)
                        </h4>
                        <span className="text-[11px] text-teal-800 font-semibold">
                          ₱10,000 Hospitalization Benefit
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-teal-900">
                      ₱1,000 / yr
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-teal-200/60 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enrollHap}
                        onChange={(e) => setEnrollHap(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-800">
                        Enroll in Health Aid Program
                      </span>
                    </label>

                    {enrollHap && (
                      <label className="flex items-center gap-2 ml-6 cursor-pointer text-emerald-800">
                        <input
                          type="checkbox"
                          checked={payHapNow}
                          onChange={(e) => setPayHapNow(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="text-[11px] font-bold">
                          Mark Annual Fee (₱1,000) as Paid & Issue Official Receipt
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Mutual Aid Program (MAP) */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                        <Shield className="w-4 h-4 fill-current" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">
                          Mutual Aid Program (MAP)
                        </h4>
                        <span className="text-[11px] text-indigo-800 font-semibold">
                          ₱100,000 Life & Damayan Coverage
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-900">
                      ₱1,500 / yr
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-indigo-200/60 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enrollMap}
                        onChange={(e) => setEnrollMap(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-800">
                        Enroll in Mutual Aid Program
                      </span>
                    </label>

                    {enrollMap && (
                      <label className="flex items-center gap-2 ml-6 cursor-pointer text-indigo-800">
                        <input
                          type="checkbox"
                          checked={payMapNow}
                          onChange={(e) => setPayMapNow(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <span className="text-[11px] font-bold">
                          Mark Annual Fee (₱1,500) as Paid & Issue Official Receipt
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="border-t border-slate-200 pt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {activeTab !== 'coop' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'personal') setActiveTab('coop');
                    if (activeTab === 'socio') setActiveTab('personal');
                    if (activeTab === 'programs') setActiveTab('socio');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  ← Back
                </button>
              )}

              {activeTab !== 'programs' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'coop') setActiveTab('personal');
                    if (activeTab === 'personal') setActiveTab('socio');
                    if (activeTab === 'socio') setActiveTab('programs');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition"
                >
                  Next Step →
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                id="btn-submit-new-member"
                disabled={isSubmitting}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving to Encrypted Vault...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Register Member</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
