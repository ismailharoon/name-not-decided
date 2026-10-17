import React, { useState } from 'react';
import {
  Plus,
  Users,
  UserPlus,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { formatCurrencyPKR } from '../utils/exporters';

const INITIAL_AGENT_FORM = {
  CompanyName: '',
  LoginID: '',
  PassCode: '',
  City: 'Karachi',
  Country: 'Pakistan',
  MobileNumber: '',
  AccountStatus: 'Enable',
  Address: '',
  Email: '',
  CreditLimit: 5000000,
  PrimaryColor: '#1B3664',
  SecondaryColor: '#0F172A',
  LightColor: '#EFF4FB',
  SubDomain: '',
  FacebookLink: '',
  TwitterLink: '',
  InstagramLink: '',
  AboutUs: '',
  CompanyHeaderLogo: '',
  CompanyFooterLogo: '',
  CompanyFavIcon: '',
  CompanyBackPicture: ''
};

const INITIAL_USER_FORM = {
  LoginID: '',
  PassCode: '',
  FullName: '',
  Email: '',
  Designation: 'Ticketing Officer',
  WhatsAppNumber: '',
  AccountType: 'Operator',
  AccountStatus: 'Enable',
  Reset2FA: false
};

export default function ManageSubAgents() {
  const {
    subAgents,
    createSubAgent,
    updateSubAgent,
    deleteSubAgent,
    createSubAgentUser,
    updateSubAgentUser,
    deleteSubAgentUser,
    addToast
  } = usePortal();

  const [expandedRows, setExpandedRows] = useState({});
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState(null);
  const [agentForm, setAgentForm] = useState(INITIAL_AGENT_FORM);

  const [showUserModal, setShowUserModal] = useState(false);
  const [activeSubCompanyId, setActiveSubCompanyId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState(INITIAL_USER_FORM);

  const toggleExpand = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateAgent = () => {
    setEditingAgentId(null);
    setAgentForm(INITIAL_AGENT_FORM);
    setShowAgentModal(true);
  };

  const openEditAgent = (agent) => {
    setEditingAgentId(agent.SubCompanyID);
    setAgentForm({ ...INITIAL_AGENT_FORM, ...agent });
    setShowAgentModal(true);
  };

  const handleSaveAgent = async (e) => {
    e.preventDefault();
    if (!agentForm.CompanyName.trim()) {
      addToast('Company Name is required.', 'error');
      return;
    }
    try {
      if (editingAgentId) {
        await updateSubAgent(editingAgentId, agentForm);
      } else {
        await createSubAgent(agentForm);
      }
      setShowAgentModal(false);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const openAddUserModal = (subCompanyId) => {
    setActiveSubCompanyId(subCompanyId);
    setEditingUserId(null);
    setUserForm(INITIAL_USER_FORM);
    setShowUserModal(true);
  };

  const openEditUserModal = (subCompanyId, u) => {
    setActiveSubCompanyId(subCompanyId);
    setEditingUserId(u.UserID);
    setUserForm({ ...INITIAL_USER_FORM, ...u });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await updateSubAgentUser(activeSubCompanyId, editingUserId, userForm);
      } else {
        await createSubAgentUser(activeSubCompanyId, userForm);
      }
      setShowUserModal(false);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#1B3664]">
            B2B Agency Network & White-Label Configuration
          </span>
          <h1 className="font-display font-semibold text-xl sm:text-2xl text-slate-900 mt-0.5">
            Manage Sub Agents
          </h1>
        </div>
        <button
          onClick={openCreateAgent}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium text-xs transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Sub Agent</span>
        </button>
      </div>

      {/* Sub Agents Master-Detail Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-executive overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1D314F] text-white text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 w-10"></th>
                <th className="py-3 px-3">Company Name & Domain</th>
                <th className="py-3 px-3">City / Country</th>
                <th className="py-3 px-3">Contact & Email</th>
                <th className="py-3 px-3">Credit Limit / Balance</th>
                <th className="py-3 px-3">Branding Swatches</th>
                <th className="py-3 px-3">Account Status</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {subAgents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No sub agents added yet. Click &ldquo;Add New Sub Agent&rdquo; to register your first B2B agency.
                  </td>
                </tr>
              ) : (
                subAgents.map((agent) => {
                  const isExpanded = Boolean(expandedRows[agent.SubCompanyID]);
                  return (
                    <React.Fragment key={agent.SubCompanyID}>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => toggleExpand(agent.SubCompanyID)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#1B3664] text-[#1B3664] hover:text-white transition cursor-pointer"
                            title="Expand Users"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-xs text-slate-900">{agent.CompanyName}</div>
                          <div className="text-[11px] text-[#1B3664] font-mono">
                            {agent.SubDomain || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{agent.City}</div>
                          <div className="text-[11px] text-slate-500">{agent.Country}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-medium">{agent.MobileNumber}</div>
                          <div className="text-[11px] text-slate-500">{agent.Email}</div>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <div className="font-semibold text-[#1B3664]">
                            Lim: {formatCurrencyPKR(agent.CreditLimit)}
                          </div>
                          <div className="text-[11px] text-emerald-700 font-medium">
                            Bal: {formatCurrencyPKR(agent.CreditLimitBalance)}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-4 h-4 rounded border border-slate-300"
                              style={{ backgroundColor: agent.PrimaryColor || '#1B3664' }}
                              title={`Primary: ${agent.PrimaryColor}`}
                            />
                            <span
                              className="w-4 h-4 rounded border border-slate-300"
                              style={{ backgroundColor: agent.SecondaryColor || '#0F172A' }}
                              title={`Secondary: ${agent.SecondaryColor}`}
                            />
                            <span
                              className="w-4 h-4 rounded border border-slate-300"
                              style={{ backgroundColor: agent.LightColor || '#EFF4FB' }}
                              title={`Light: ${agent.LightColor}`}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              agent.AccountStatus === 'Enable'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {agent.AccountStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{agent.Created}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openAddUserModal(agent.SubCompanyID)}
                              className="px-2.5 py-1 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Add User</span>
                            </button>
                            <button
                              onClick={() => openEditAgent(agent)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-[#1B3664] text-slate-600 hover:text-[#1B3664] cursor-pointer"
                              title="Edit Sub Agent"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete Sub Agent "${agent.CompanyName}"?`)) {
                                  deleteSubAgent(agent.SubCompanyID);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-red-600 text-slate-500 hover:text-red-600 cursor-pointer"
                              title="Delete Sub Agent"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED SUB AGENT USERS TABLE */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={9} className="p-4 border-b border-slate-200">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                              <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                                <h5 className="font-display font-semibold text-xs uppercase tracking-wider text-[#1B3664] flex items-center gap-2">
                                  <Users className="w-3.5 h-3.5" />
                                  Registered Users for {agent.CompanyName} ({(agent.Users || []).length})
                                </h5>
                                <button
                                  onClick={() => openAddUserModal(agent.SubCompanyID)}
                                  className="px-2.5 py-1 rounded-lg bg-[#1B3664] text-white font-medium text-[11px] hover:bg-[#0F172A] transition cursor-pointer"
                                >
                                  + Add New User
                                </button>
                              </div>
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                    <th className="py-2 px-3">Login ID</th>
                                    <th className="py-2 px-3">Full Name</th>
                                    <th className="py-2 px-3">Email</th>
                                    <th className="py-2 px-3">Designation</th>
                                    <th className="py-2 px-3">WhatsApp Number</th>
                                    <th className="py-2 px-3">Account Type</th>
                                    <th className="py-2 px-3">Status</th>
                                    <th className="py-2 px-3 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {(agent.Users || []).length === 0 ? (
                                    <tr>
                                      <td colSpan={8} className="py-5 text-center text-slate-500">
                                        No users registered under this Sub Agent yet.
                                      </td>
                                    </tr>
                                  ) : (
                                    (agent.Users || []).map((u) => (
                                      <tr key={u.UserID} className="hover:bg-slate-50">
                                        <td className="py-2 px-3 font-mono font-semibold text-[#1B3664]">
                                          {u.LoginID}
                                        </td>
                                        <td className="py-2 px-3 font-semibold text-slate-900">
                                          {u.FullName}
                                        </td>
                                        <td className="py-2 px-3">{u.Email}</td>
                                        <td className="py-2 px-3">{u.Designation}</td>
                                        <td className="py-2 px-3 font-mono">{u.WhatsAppNumber}</td>
                                        <td className="py-2 px-3">
                                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[#1B3664] font-medium">
                                            {u.AccountType}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3">{u.AccountStatus}</td>
                                        <td className="py-2 px-3 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              onClick={() => openEditUserModal(agent.SubCompanyID, u)}
                                              className="px-2.5 py-1 rounded-lg bg-[#1B3664] text-white text-[11px] font-medium hover:bg-[#0F172A] transition cursor-pointer"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => {
                                                if (window.confirm(`Delete user ${u.LoginID}?`)) {
                                                  deleteSubAgentUser(agent.SubCompanyID, u.UserID);
                                                }
                                              }}
                                              className="p-1 text-slate-500 hover:text-red-600 cursor-pointer"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT SUB AGENT MODAL */}
      {showAgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-[#1D314F] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <h5 className="font-semibold text-sm">
                {editingAgentId ? 'Edit SubAgent' : 'Add SubAgent'}
              </h5>
              <button
                onClick={() => setShowAgentModal(false)}
                className="text-white/75 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={agentForm.CompanyName}
                    onChange={(e) => setAgentForm({ ...agentForm, CompanyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={agentForm.City}
                    onChange={(e) => setAgentForm({ ...agentForm, City: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={agentForm.Country}
                    onChange={(e) => setAgentForm({ ...agentForm, Country: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={agentForm.MobileNumber}
                    onChange={(e) => setAgentForm({ ...agentForm, MobileNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={agentForm.Email}
                    onChange={(e) => setAgentForm({ ...agentForm, Email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Credit Limit (PKR)</label>
                  <input
                    type="number"
                    value={agentForm.CreditLimit}
                    onChange={(e) =>
                      setAgentForm({ ...agentForm, CreditLimit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Account Status</label>
                  <select
                    value={agentForm.AccountStatus}
                    onChange={(e) => setAgentForm({ ...agentForm, AccountStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Enable">Enable</option>
                    <option value="Disable">Disable</option>
                  </select>
                </div>
              </div>

              {!editingAgentId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-lg bg-[#EFF4FB] border border-[#1B3664]/20">
                  <div>
                    <label className="block font-semibold text-[#1B3664] mb-1">
                      Sub-Agent Login ID (For POS Login)
                    </label>
                    <input
                      type="text"
                      value={agentForm.LoginID || ''}
                      onChange={(e) => setAgentForm({ ...agentForm, LoginID: e.target.value })}
                      placeholder="e.g. agent1"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1B3664] mb-1">
                      Sub-Agent Password
                    </label>
                    <input
                      type="text"
                      value={agentForm.PassCode || ''}
                      onChange={(e) => setAgentForm({ ...agentForm, PassCode: e.target.value })}
                      placeholder="e.g. Pass@123"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={agentForm.Address}
                  onChange={(e) => setAgentForm({ ...agentForm, Address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              {/* White-Label Colors & Domain */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Primary Color</label>
                  <input
                    type="color"
                    value={agentForm.PrimaryColor || '#1B3664'}
                    onChange={(e) => setAgentForm({ ...agentForm, PrimaryColor: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Secondary Color</label>
                  <input
                    type="color"
                    value={agentForm.SecondaryColor || '#0F172A'}
                    onChange={(e) => setAgentForm({ ...agentForm, SecondaryColor: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Light Color</label>
                  <input
                    type="color"
                    value={agentForm.LightColor || '#EFF4FB'}
                    onChange={(e) => setAgentForm({ ...agentForm, LightColor: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Sub Domain</label>
                  <input
                    type="text"
                    value={agentForm.SubDomain}
                    onChange={(e) => setAgentForm({ ...agentForm, SubDomain: e.target.value })}
                    placeholder="sub.domain.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Social Links & About Us */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Facebook Link</label>
                  <input
                    type="text"
                    value={agentForm.FacebookLink}
                    onChange={(e) => setAgentForm({ ...agentForm, FacebookLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Twitter Link</label>
                  <input
                    type="text"
                    value={agentForm.TwitterLink}
                    onChange={(e) => setAgentForm({ ...agentForm, TwitterLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Instagram Link</label>
                  <input
                    type="text"
                    value={agentForm.InstagramLink}
                    onChange={(e) => setAgentForm({ ...agentForm, InstagramLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">About Us</label>
                <textarea
                  rows={2}
                  value={agentForm.AboutUs}
                  onChange={(e) => setAgentForm({ ...agentForm, AboutUs: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAgentModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium transition cursor-pointer"
                >
                  Save SubAgent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT SUB AGENT USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-[#1D314F] text-white px-5 py-3.5 flex items-center justify-between">
              <h5 className="font-semibold text-sm">
                {editingUserId ? 'Edit User' : 'Add User'}
              </h5>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-white/75 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Login ID *</label>
                  <input
                    type="text"
                    disabled={Boolean(editingUserId)}
                    value={userForm.LoginID}
                    onChange={(e) => setUserForm({ ...userForm, LoginID: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-semibold disabled:bg-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Pass Code *</label>
                  <input
                    type="text"
                    value={userForm.PassCode}
                    onChange={(e) => setUserForm({ ...userForm, PassCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={userForm.FullName}
                    onChange={(e) => setUserForm({ ...userForm, FullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={userForm.Email}
                    onChange={(e) => setUserForm({ ...userForm, Email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={userForm.Designation}
                    onChange={(e) => setUserForm({ ...userForm, Designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">WhatsApp Number *</label>
                  <input
                    type="text"
                    value={userForm.WhatsAppNumber}
                    onChange={(e) => setUserForm({ ...userForm, WhatsAppNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Account Type</label>
                  <select
                    value={userForm.AccountType}
                    onChange={(e) => setUserForm({ ...userForm, AccountType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Operator">Operator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Account Status</label>
                  <select
                    value={userForm.AccountStatus}
                    onChange={(e) => setUserForm({ ...userForm, AccountStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Enable">Enable</option>
                    <option value="Disable">Disable</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer font-medium text-[#1B3664]">
                <input
                  type="checkbox"
                  checked={Boolean(userForm.Reset2FA)}
                  onChange={(e) => setUserForm({ ...userForm, Reset2FA: e.target.checked })}
                />
                <span>Reset 2FA</span>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium transition cursor-pointer"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
