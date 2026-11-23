import { useState } from 'react';
import { Calculator, TrendingUp, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateEMI, formatCurrency } from '../../utils/helpers';

const DEFAULT_PRINCIPAL = 100000;
const DEFAULT_RATE = 12;
const DEFAULT_TENURE = 24;

function InputField({ label, value, onChange, min, max, step = '1', prefix, suffix }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-gray-500 font-medium text-sm">{prefix}</span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className={`input w-full ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-10' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 text-gray-400 text-sm">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function ResultCard({ label, value, color = 'gray', large = false }) {
  const colors = {
    gray: 'text-gray-900',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
    blue: 'text-blue-700',
    purple: 'text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-bold ${large ? 'text-3xl' : 'text-xl'} ${colors[color]}`}>{value}</p>
    </div>
  );
}

function buildAmortizationSchedule(principal, annualRate, tenureMonths, emi) {
  const r = annualRate / 12 / 100;
  const rows = [];
  let balance = principal;
  for (let i = 1; i <= tenureMonths; i++) {
    const interest = Math.round(balance * r * 100) / 100;
    const principalPart = Math.round((emi - interest) * 100) / 100;
    const closing = Math.max(0, Math.round((balance - principalPart) * 100) / 100);
    rows.push({
      no: i,
      opening: balance,
      emi,
      principal: principalPart,
      interest,
      closing,
    });
    balance = closing;
  }
  return rows;
}

export default function EMICalculatorPage() {
  // Main calculator
  const [principal, setPrincipal] = useState(DEFAULT_PRINCIPAL);
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [tenure, setTenure] = useState(DEFAULT_TENURE);
  const [result, setResult] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [showSchedule, setShowSchedule] = useState(false);

  // What-if comparison
  const [scenarios, setScenarios] = useState([
    { id: 1, label: 'Scenario A', principal: 100000, rate: 10, tenure: 24 },
    { id: 2, label: 'Scenario B', principal: 100000, rate: 14, tenure: 36 },
    { id: 3, label: 'Scenario C', principal: 150000, rate: 12, tenure: 48 },
  ]);

  function handleCalculate() {
    if (!principal || !rate || !tenure) return;
    const res = calculateEMI(principal, rate, tenure);
    setResult(res);
    setSchedule(buildAmortizationSchedule(principal, rate, tenure, res.emi));
    setShowSchedule(false);
  }

  function handleReset() {
    setPrincipal(DEFAULT_PRINCIPAL);
    setRate(DEFAULT_RATE);
    setTenure(DEFAULT_TENURE);
    setResult(null);
    setSchedule([]);
    setShowSchedule(false);
  }

  function updateScenario(id, field, value) {
    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  const scenarioResults = scenarios.map((s) => ({
    ...s,
    result: calculateEMI(s.principal, s.rate, s.tenure),
  }));

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-900 rounded-xl">
          <Calculator size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">EMI Calculator</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Reducing balance EMI calculation with amortization schedule
          </p>
        </div>
      </div>

      {/* Main Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Loan Parameters</h2>
          <InputField
            label="Principal Amount"
            value={principal}
            onChange={setPrincipal}
            min={1000}
            prefix="₹"
          />
          <InputField
            label="Annual Interest Rate"
            value={rate}
            onChange={setRate}
            min={0}
            max={100}
            step="0.01"
            suffix="% p.a."
          />
          <InputField
            label="Loan Tenure"
            value={tenure}
            onChange={setTenure}
            min={1}
            max={360}
            suffix="months"
          />
          {/* Tenure slider */}
          <div>
            <input
              type="range"
              min={1}
              max={360}
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              className="w-full accent-blue-700"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 month</span>
              <span>360 months (30 years)</span>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleCalculate}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Calculator size={16} />
              Calculate EMI
            </button>
            <button
              onClick={handleReset}
              className="btn-secondary flex items-center gap-2"
              title="Reset"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Result Display */}
        {result ? (
          <div className="space-y-4">
            {/* Big EMI card */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 text-white relative overflow-hidden">
              <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
              <div className="absolute -right-2 -bottom-8 h-20 w-20 rounded-full bg-white/5" />
              <div className="relative z-10">
                <p className="text-xs font-medium opacity-70 uppercase tracking-widest">Monthly EMI</p>
                <p className="text-5xl font-bold mt-2">{formatCurrency(result.emi)}</p>
                <p className="text-xs opacity-60 mt-2">for {tenure} months at {rate}% p.a.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <ResultCard label="Principal" value={formatCurrency(principal)} color="blue" />
              <ResultCard label="Total Interest" value={formatCurrency(result.totalInterest)} color="red" />
              <ResultCard label="Total Repayable" value={formatCurrency(result.totalRepayable)} color="emerald" />
            </div>
            {/* Pie-like visual */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-medium text-gray-600 mb-3">Loan Composition</p>
              <div className="h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-700 h-full"
                  style={{ width: `${(principal / result.totalRepayable) * 100}%` }}
                  title="Principal"
                />
                <div
                  className="bg-red-400 h-full"
                  style={{ width: `${(result.totalInterest / result.totalRepayable) * 100}%` }}
                  title="Interest"
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-700" />
                  Principal ({((principal / result.totalRepayable) * 100).toFixed(1)}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
                  Interest ({((result.totalInterest / result.totalRepayable) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="p-4 bg-blue-50 rounded-full">
              <Calculator size={32} className="text-blue-700" />
            </div>
            <p className="text-gray-500 font-medium">Enter loan parameters and click Calculate</p>
            <p className="text-gray-400 text-sm">Monthly EMI and full amortization schedule will appear here</p>
          </div>
        )}
      </div>

      {/* Amortization Schedule */}
      {schedule.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowSchedule((v) => !v)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900">
              Amortization Schedule ({schedule.length} installments)
            </span>
            {showSchedule ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showSchedule && (
            <div className="overflow-x-auto border-t border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="table-th text-center">#</th>
                    <th className="table-th text-right">Opening Balance</th>
                    <th className="table-th text-right">EMI</th>
                    <th className="table-th text-right">Principal</th>
                    <th className="table-th text-right">Interest</th>
                    <th className="table-th text-right">Closing Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {schedule.map((row) => (
                    <tr key={row.no} className="hover:bg-gray-50/60 transition-colors">
                      <td className="table-td text-center text-gray-500">{row.no}</td>
                      <td className="table-td text-right font-mono text-xs">{formatCurrency(row.opening)}</td>
                      <td className="table-td text-right font-mono text-xs font-semibold text-blue-700">
                        {formatCurrency(row.emi)}
                      </td>
                      <td className="table-td text-right font-mono text-xs text-emerald-600">
                        {formatCurrency(row.principal)}
                      </td>
                      <td className="table-td text-right font-mono text-xs text-red-500">
                        {formatCurrency(row.interest)}
                      </td>
                      <td className="table-td text-right font-mono text-xs">{formatCurrency(row.closing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* What-If Comparison */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-purple-600" />
          <h2 className="text-base font-semibold text-gray-900">What-If Comparison</h2>
          <span className="text-xs text-gray-400 ml-1">— Compare different rates/tenures side by side</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="table-th text-left">Scenario</th>
                <th className="table-th text-right">Principal (₹)</th>
                <th className="table-th text-right">Rate (% p.a.)</th>
                <th className="table-th text-right">Tenure (mo.)</th>
                <th className="table-th text-right bg-blue-50 text-blue-800">Monthly EMI</th>
                <th className="table-th text-right">Total Interest</th>
                <th className="table-th text-right">Total Repayable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {scenarioResults.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="table-td">
                    <input
                      value={s.label}
                      onChange={(e) => updateScenario(s.id, 'label', e.target.value)}
                      className="text-sm font-medium text-gray-800 bg-transparent border-none outline-none focus:underline w-28"
                    />
                  </td>
                  <td className="table-td text-right">
                    <input
                      type="number"
                      value={s.principal}
                      onChange={(e) => updateScenario(s.id, 'principal', Number(e.target.value))}
                      className="input text-right text-sm w-28 py-1"
                    />
                  </td>
                  <td className="table-td text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={s.rate}
                      onChange={(e) => updateScenario(s.id, 'rate', Number(e.target.value))}
                      className="input text-right text-sm w-20 py-1"
                    />
                  </td>
                  <td className="table-td text-right">
                    <input
                      type="number"
                      value={s.tenure}
                      onChange={(e) => updateScenario(s.id, 'tenure', Number(e.target.value))}
                      className="input text-right text-sm w-20 py-1"
                    />
                  </td>
                  <td className="table-td text-right bg-blue-50 font-bold text-blue-800">
                    {formatCurrency(s.result.emi)}
                  </td>
                  <td className="table-td text-right text-red-600">
                    {formatCurrency(s.result.totalInterest)}
                  </td>
                  <td className="table-td text-right font-semibold text-gray-800">
                    {formatCurrency(s.result.totalRepayable)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400">
          * Edit any cell in the table above to instantly update the comparison. All values recalculate in real-time.
        </p>
      </div>
    </div>
  );
}
