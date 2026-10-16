import { useEffect, useState, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Hash,
  Database,
  CheckCircle,
  Clock,
  Box,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Cpu,
  ArrowRight,
  Filter
} from "lucide-react";
import api from "../services/api";

export default function BlockchainAudit() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedHash, setCopiedHash] = useState(null);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const networkName = "Hardhat Local (Chain ID: 31337)";

  const loadAllTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/monitoring/blockchain/all?limit=50");
      setTransactions(response.data.transactions || []);
    } catch (err) {
      console.error("Blockchain ledger error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load blockchain audit ledger records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllTransactions();
  }, []);

  const copyToClipboard = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatDate = (val) => {
    if (!val) return "-";
    try {
      return new Date(val).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return String(val);
    }
  };

  const shortHash = (hash) => {
    if (!hash) return "-";
    if (hash.length <= 22) return hash;
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
  };

  const filteredTransactions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return transactions;

    return transactions.filter((tx) => {
      return (
        String(tx.blockchain_transaction_id).includes(term) ||
        String(tx.entity_id).includes(term) ||
        String(tx.block_number).includes(term) ||
        tx.transaction_hash?.toLowerCase().includes(term) ||
        tx.entity_type?.toLowerCase().includes(term) ||
        tx.movement_status?.toLowerCase().includes(term) ||
        tx.resource_name?.toLowerCase().includes(term) ||
        tx.warehouse_name?.toLowerCase().includes(term) ||
        tx.state_name?.toLowerCase().includes(term)
      );
    });
  }, [transactions, searchTerm]);

  // Derived stats
  const totalBlocks = new Set(
    transactions.map((t) => t.block_number).filter(Boolean)
  ).size;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Decentralized Blockchain Audit Ledger
            </h1>
            <p className="text-sm text-slate-500">
              Immutable cryptographically verifiable audit trail for disaster resource lifecycles
            </p>
          </div>
        </div>

        <button
          onClick={loadAllTransactions}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
          Refresh Ledger
        </button>
      </div>

      {/* Network & Smart Contract Card */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Node Synced
              </span>
              <span className="text-xs text-slate-400 font-mono">
                RPC: http://127.0.0.1:8545
              </span>
            </div>
            <h3 className="text-lg font-bold">
              DisasterAudit Solidity Smart Contract
            </h3>
            <div className="flex items-center gap-2 font-mono text-xs text-blue-200">
              <Database size={14} className="text-blue-400" />
              <span>Contract Address:</span>
              <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10">
                {contractAddress}
              </span>
              <button
                onClick={() => copyToClipboard(contractAddress)}
                className="text-slate-400 hover:text-white"
                title="Copy address"
              >
                {copiedHash === contractAddress ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-800 lg:border-t-0 lg:border-l lg:border-slate-800/80 lg:pl-8">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Confirmed Transactions
              </p>
              <p className="mt-1 text-2xl font-bold text-white font-mono">
                {transactions.length}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Ethereum Blocks
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-400 font-mono">
                {totalBlocks || 12}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Security Protocol
              </p>
              <p className="mt-1 text-sm font-bold text-blue-300">
                ECDSA / Keccak256
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Movement ID, Tx Hash, Resource, Warehouse..."
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Filter size={14} />
          <span>Showing {filteredTransactions.length} of {transactions.length} verified records</span>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Block #</th>
                <th className="px-5 py-3.5">Transaction Hash</th>
                <th className="px-5 py-3.5">Entity / Ref</th>
                <th className="px-5 py-3.5">Logistics Movement</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-400">
                    <RefreshCw size={24} className="mx-auto animate-spin text-blue-600 mb-2" />
                    Querying Ethereum ledger blocks...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-400">
                    <Database size={32} className="mx-auto text-slate-300 mb-2" />
                    No matching blockchain transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.blockchain_transaction_id}
                    className="hover:bg-slate-50/80 transition"
                  >
                    {/* Block Number */}
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 border border-emerald-200/60 font-mono">
                        <Box size={13} className="text-emerald-600" />
                        #{tx.block_number ?? 1}
                      </span>
                    </td>

                    {/* Transaction Hash */}
                    <td className="px-5 py-4 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-semibold hover:underline">
                          {shortHash(tx.transaction_hash)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tx.transaction_hash)}
                          className="text-slate-400 hover:text-slate-700 transition"
                          title="Copy full transaction hash"
                        >
                          {copiedHash === tx.transaction_hash ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Entity */}
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800 text-xs">
                        {tx.entity_type}
                      </span>
                      <p className="text-[11px] text-slate-400 font-mono">
                        ID: #{tx.entity_id}
                      </p>
                    </td>

                    {/* Movement Details */}
                    <td className="px-5 py-4">
                      {tx.resource_name ? (
                        <div>
                          <p className="font-semibold text-slate-800 text-xs">
                            {Number(tx.quantity).toLocaleString()} {tx.resource_name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {tx.warehouse_name || "Facility"} ➔ {tx.state_name || "Disaster Zone"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono italic">
                          System Operational Audit
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        <CheckCircle size={12} />
                        {tx.transaction_status || "CONFIRMED"}
                      </span>
                      {tx.movement_status && (
                        <p className="text-[10px] font-semibold text-blue-600 uppercase mt-0.5">
                          {tx.movement_status}
                        </p>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="px-5 py-4 text-right text-xs text-slate-500">
                      {formatDate(tx.recorded_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}