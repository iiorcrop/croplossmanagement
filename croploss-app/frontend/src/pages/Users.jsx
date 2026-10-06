import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Edit, RefreshCw } from 'lucide-react';
import { usersAPI } from '../utils/api';
import { RoleBadge, Avatar, CropTag, Modal, Spinner, EmptyState } from '../components/common';
import { CROP_EMOJI, CROP_LABEL, ROLE_LABELS, AV_COLORS, DISCIPLINES, CROPS } from '../utils/constants';
import api from '../utils/api';

const BLANK_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  designation: '',
  role: '',
  centerName: '',
  centerState: '',
  centerDistrict: '',
  centerPI: '',
  crop: '',
  discipline: '',
  assignedCrops: [],
  reviewCrops: [],
  isActive: true,
  notifyWhatsApp: true,
  notifyEmail: true,
};

export default function Users() {
  const [users, setUsers]           = useState([]);
  const [stats, setStats]           = useState({});
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState(BLANK_FORM);
  const [saving, setSaving]         = useState(false);
  const [filters, setFilters]       = useState({ role: '', crop: '', discipline: '', status: '' });
  const [masterData, setMasterData] = useState(null);
  const [fetchingPI, setFetchingPI] = useState(false);
  const [piStatus, setPiStatus]     = useState('');
  const [multipleHeads, setMultipleHeads] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersAPI.list(filters);
      setUsers(res.data.data);
      setStats(res.data.stats || {});
      const mdRes = await api.get('/master-data');
      const md = mdRes.data?.data || {};
      const normalizedCrops = (md.crops || [])
        .map(c => typeof c === 'string' ? c.toLowerCase() : (c?.name || c?.crop || '').toLowerCase())
        .filter(Boolean);
      setMasterData({ ...md, crops: normalizedCrops.length ? normalizedCrops : CROPS });
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditId(null);
    setForm(BLANK_FORM);
    setPiStatus('');
    setMultipleHeads([]);
    setModal(true);
  };

  const openEdit = (u) => {
    setEditId(u._id);
    const existingCrop = (u.role === 'crop_head' ? u.reviewCrops?.[0] : u.assignedCrops?.[0]) || '';
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone,
      password: '',
      designation: u.designation || '',
      role: u.role,
      centerName: u.centerName || '',
      centerState: u.centerState || '',
      centerDistrict: u.centerDistrict || '',
      centerPI: u.centerPI || '',
      crop: existingCrop,
      discipline: u.discipline || '',
      assignedCrops: u.assignedCrops || [],
      reviewCrops: u.reviewCrops || [],
      isActive: u.isActive,
      notifyWhatsApp: u.notifyWhatsApp,
      notifyEmail: u.notifyEmail,
    });
    setPiStatus(u.centerPI ? `Current PI: ${u.centerPI}` : '');
    setMultipleHeads([]);
    setModal(true);
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchPI = async (crop, discipline) => {
    if (!crop || !discipline) return;
    setFetchingPI(true);
    setPiStatus('Fetching Principal Investigator (PI)...');
    try {
      const res = await usersAPI.cropHeads(crop, { discipline });
      const heads = res.data?.data || [];
      setMultipleHeads(heads);
      if (heads.length > 0) {
        const piName = heads[0].name;
        setForm(f => ({ ...f, centerPI: piName }));
        setPiStatus(`✓ Auto-fetched PI: ${piName}${heads.length > 1 ? ` (+${heads.length - 1} more found)` : ''}`);
      } else {
        setPiStatus(`ℹ No Crop Head found for ${CROP_LABEL(crop)} (${discipline}). Please enter PI manually.`);
      }
    } catch (err) {
      console.error('Error fetching PI:', err);
      setPiStatus('Could not auto-fetch PI. Please enter manually.');
    } finally {
      setFetchingPI(false);
    }
  };

  const handleCropChange = (cropVal) => {
    setForm(f => {
      const next = {
        ...f,
        crop: cropVal,
        assignedCrops: cropVal ? [cropVal] : [],
        reviewCrops: cropVal ? [cropVal] : [],
      };
      if (f.role === 'center_user' && cropVal && f.discipline) {
        fetchPI(cropVal, f.discipline);
      }
      return next;
    });
  };

  const handleDisciplineChange = (discVal) => {
    setForm(f => {
      const next = { ...f, discipline: discVal };
      if (f.role === 'center_user' && f.crop && discVal) {
        fetchPI(f.crop, discVal);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.role) {
      toast.error('Name, email and role required');
      return;
    }
    if (!editId && !form.password) {
      toast.error('Password required for new users');
      return;
    }
    if (form.role === 'crop_head') {
      if (!form.crop) { toast.error('Please select a crop'); return; }
      if (!form.discipline) { toast.error('Please select a discipline'); return; }
    }
    if (form.role === 'center_user') {
      if (!form.crop) { toast.error('Please select a crop'); return; }
      if (!form.discipline) { toast.error('Please select a discipline'); return; }
      if (!form.centerName.trim()) { toast.error('Center name required'); return; }
      if (!form.centerState.trim()) { toast.error('State required'); return; }
    }

    const availableCrops = masterData?.crops || CROPS;
    const payload = {
      ...form,
      assignedCrops: form.role === 'center_user' ? (form.crop ? [form.crop] : form.assignedCrops) : (form.role === 'super_admin' ? availableCrops : []),
      reviewCrops: form.role === 'crop_head' ? (form.crop ? [form.crop] : form.reviewCrops) : (form.role === 'super_admin' ? availableCrops : []),
    };

    setSaving(true);
    try {
      if (editId) {
        await usersAPI.update(editId, payload);
        toast.success('User updated');
      } else {
        await usersAPI.create(payload);
        toast.success('User created');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!editId) return;
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await usersAPI.deactivate(editId);
      toast.success('User deactivated');
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const allCrops = (u) => [
    ...new Set(
      [...(u.assignedCrops || []), ...(u.reviewCrops || [])]
        .map(c => (typeof c === 'string' ? c : (c?.name || c?.crop || '')))
        .filter(Boolean)
    )
  ];

  const cropsList = masterData?.crops?.length ? masterData.crops : CROPS;

  return (
    <div>
      <div className="page-header">
        <h2>Users &amp; Roles</h2>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>＋ Add User</button>
      </div>

      {/* Stats */}
      <div className="kpi-grid" style={{ marginBottom: 18 }}>
        {[
          { n: stats.total || 0, l: 'Total Users', c: 'green', i: '👥' },
          { n: stats.superAdmins || 0, l: 'Super Admins', c: 'red', i: '🛡️' },
          { n: stats.cropHeads || 0, l: 'Crop Heads', c: 'amber', i: '🌿' },
          { n: stats.centerUsers || 0, l: 'Center Users', c: 'blue', i: '🏛️' },
          { n: stats.active || 0, l: 'Active', c: 'teal', i: '✅' },
        ].map((k, i) => (
          <div key={i} className={`kpi-card kpi-${k.c}`}>
            <div className="kpi-number">{k.n}</div>
            <div className="kpi-label">{k.l}</div>
            <div className="kpi-icon">{k.i}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select className="filter-control" value={filters.role} onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}>
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="crop_head">Crop Head</option>
          <option value="center_user">Center User</option>
        </select>
        <select className="filter-control" value={filters.crop} onChange={e => setFilters(f => ({ ...f, crop: e.target.value }))}>
          <option value="">All Crops</option>
          {cropsList.map(c => {
            const val = typeof c === 'string' ? c : (c?.name || c?.crop || '');
            return <option key={val} value={val}>{CROP_EMOJI[val] || '🌱'} {CROP_LABEL(c) || val}</option>;
          })}
        </select>
        <select className="filter-control" value={filters.discipline} onChange={e => setFilters(f => ({ ...f, discipline: e.target.value }))}>
          <option value="">All Disciplines</option>
          {DISCIPLINES.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select className="filter-control" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <Spinner /> : users.length === 0 ? <EmptyState emoji="👥" title="No users found" /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Discipline</th>
                  <th>Crops</th>
                  <th>Center / State &amp; PI</th>
                  <th>WhatsApp</th>
                  <th>Notifications</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={u.name} index={idx} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray)' }}>{u.email}</div>
                          {u.designation && <div style={{ fontSize: 10, color: 'var(--gray)' }}>{u.designation}</div>}
                        </div>
                      </div>
                    </td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>
                      {u.discipline ? (
                        <span className="badge badge-submitted" style={{ fontSize: 10.5, padding: '2px 8px' }}>
                          {u.discipline}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--gray)', fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td style={{ maxWidth: 180 }}>
                      {allCrops(u).map(c => <CropTag key={c} crop={c} />)}
                      {!allCrops(u).length && '—'}
                    </td>
                    <td style={{ fontSize: 11.5 }}>
                      <div>{u.centerName || '—'}</div>
                      <div style={{ color: 'var(--gray)' }}>{u.centerState || ''}</div>
                      {u.centerPI && (
                        <div style={{ fontSize: 10.5, color: 'var(--g7)', fontWeight: 500, marginTop: 2 }}>
                          PI: {u.centerPI}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 11.5 }}>{u.phone}</td>
                    <td style={{ fontSize: 11.5 }}>
                      {u.notifyWhatsApp && <span style={{ marginRight: 4 }} title="WhatsApp active">📱</span>}
                      {u.notifyEmail && <span title="Email active">📧</span>}
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-xs" onClick={() => openEdit(u)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Edit size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Edit User' : 'Add New User'}
        maxWidth={640}
        footer={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setModal(false)}>Cancel</button>
            {editId && <button className="btn btn-danger btn-sm" onClick={handleDeactivate}>Deactivate</button>}
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save User'}</button>
          </>
        }
      >
        <div className="form-grid grid-2" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label required">Full Name</label>
            <input className="form-control" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Dr. Firstname Lastname" />
          </div>
          <div className="form-group">
            <label className="form-label required">Email</label>
            <input className="form-control" type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="name@icar.org.in" readOnly={!!editId} />
          </div>
          <div className="form-group">
            <label className="form-label required">WhatsApp Number</label>
            <input className="form-control" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+91-98765-43210" />
          </div>
          <div className="form-group">
            <label className={`form-label ${!editId ? 'required' : ''}`}>{editId ? 'New Password (leave blank to keep)' : 'Password'}</label>
            <input className="form-control" type="password" value={form.password} onChange={e => setF('password', e.target.value)} placeholder={editId ? 'Leave blank to keep current' : 'Min 6 characters'} />
          </div>
          <div className="form-group">
            <label className="form-label required">Role</label>
            <select
              className="form-control"
              value={form.role}
              onChange={e => {
                const nextRole = e.target.value;
                setForm(f => ({
                  ...f,
                  role: nextRole,
                  centerPI: nextRole === 'center_user' ? f.centerPI : '',
                }));
                setPiStatus('');
                setMultipleHeads([]);
              }}
            >
              <option value="">— Select Role —</option>
              <option value="super_admin">Super Admin</option>
              <option value="crop_head">Crop Head</option>
              <option value="center_user">Center User</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Designation</label>
            <input className="form-control" value={form.designation} onChange={e => setF('designation', e.target.value)} placeholder="e.g. Senior Scientist" />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={String(form.isActive)} onChange={e => setF('isActive', e.target.value === 'true')}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {/* Crop Head section */}
        {form.role === 'crop_head' && (
          <div style={{ marginBottom: 14, padding: 14, background: 'var(--g1)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--g8)', marginBottom: 10 }}>
              🌿 Crop Head Assignment
            </div>
            <div className="form-grid grid-2">
              <div className="form-group">
                <label className="form-label required">1. Select Crop</label>
                <select
                  className="form-control"
                  value={form.crop || ''}
                  onChange={e => handleCropChange(e.target.value)}
                >
                  <option value="">— Select Crop —</option>
                  {cropsList.map(c => {
                    const val = typeof c === 'string' ? c : (c?.name || c?.crop || '');
                    return (
                      <option key={val} value={val}>
                        {CROP_EMOJI[val] || '🌱'} {CROP_LABEL(c) || val}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">2. Select Discipline</label>
                <select
                  className="form-control"
                  value={form.discipline || ''}
                  onChange={e => handleDisciplineChange(e.target.value)}
                  disabled={!form.crop}
                >
                  <option value="">{form.crop ? '— Select Discipline —' : 'Select crop first'}</option>
                  {DISCIPLINES.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--gray)', marginTop: 8 }}>
              Crop Head will receive WhatsApp &amp; Email alerts and review data for the selected crop and discipline.
            </div>
          </div>
        )}

        {/* Center User section */}
        {form.role === 'center_user' && (
          <div style={{ marginBottom: 14, padding: 14, background: 'var(--g1)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--g8)', marginBottom: 10 }}>
              🏛️ Center &amp; Assignment Details
            </div>
            <div className="form-grid grid-2" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label className="form-label required">Center / Institute Name</label>
                <input className="form-control" value={form.centerName} onChange={e => setF('centerName', e.target.value)} placeholder="e.g. SDAU, S.K.Nagar" />
              </div>
              <div className="form-group">
                <label className="form-label required">State</label>
                <input className="form-control" value={form.centerState} onChange={e => setF('centerState', e.target.value)} placeholder="e.g. Gujarat" />
              </div>
              <div className="form-group">
                <label className="form-label">District</label>
                <input className="form-control" value={form.centerDistrict} onChange={e => setF('centerDistrict', e.target.value)} placeholder="e.g. Banaskantha" />
              </div>
            </div>

            <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--g8)', margin: '14px 0 8px' }}>
              Crop &amp; Discipline Assignment
            </div>
            <div className="form-grid grid-2">
              <div className="form-group">
                <label className="form-label required">1. Select Crop</label>
                <select
                  className="form-control"
                  value={form.crop || ''}
                  onChange={e => handleCropChange(e.target.value)}
                >
                  <option value="">— Select Crop —</option>
                  {cropsList.map(c => {
                    const val = typeof c === 'string' ? c : (c?.name || c?.crop || '');
                    return (
                      <option key={val} value={val}>
                        {CROP_EMOJI[val] || '🌱'} {CROP_LABEL(c) || val}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">2. Select Discipline</label>
                <select
                  className="form-control"
                  value={form.discipline || ''}
                  onChange={e => handleDisciplineChange(e.target.value)}
                  disabled={!form.crop}
                >
                  <option value="">{form.crop ? '— Select Discipline —' : 'Select crop first'}</option>
                  {DISCIPLINES.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Principal Investigator (PI) - Auto-fetched */}
            <div className="form-group" style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Principal Investigator (PI)
                </label>
                {form.crop && form.discipline && (
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    style={{ fontSize: 10.5, padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                    onClick={() => fetchPI(form.crop, form.discipline)}
                    disabled={fetchingPI}
                  >
                    <RefreshCw size={11} className={fetchingPI ? 'spin' : ''} /> Refetch PI
                  </button>
                )}
              </div>
              <input
                className="form-control"
                value={form.centerPI}
                onChange={e => setF('centerPI', e.target.value)}
                placeholder={fetchingPI ? 'Auto-fetching PI...' : 'Principal Investigator name'}
              />
              {piStatus && (
                <div style={{
                  fontSize: 11.5,
                  marginTop: 4,
                  color: piStatus.startsWith('✓') ? 'var(--g7)' : (piStatus.startsWith('ℹ') ? 'var(--gray)' : 'var(--danger)')
                }}>
                  {piStatus}
                </div>
              )}
              {multipleHeads.length > 1 && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--gray)' }}>Available Crop Heads:</span>
                  {multipleHeads.map(h => (
                    <button
                      key={h._id}
                      type="button"
                      className={`btn btn-xs ${form.centerPI === h.name ? 'btn-primary' : 'btn-outline'}`}
                      style={{ fontSize: 11, padding: '2px 8px' }}
                      onClick={() => {
                        setF('centerPI', h.name);
                        setPiStatus(`✓ Selected PI: ${h.name}`);
                      }}
                    >
                      {h.name} {h.discipline ? `(${h.discipline})` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="divider" />
        <div style={{ display: 'flex', gap: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.notifyWhatsApp} onChange={e => setF('notifyWhatsApp', e.target.checked)} style={{ accentColor: 'var(--g7)' }} />
            WhatsApp notifications
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.notifyEmail} onChange={e => setF('notifyEmail', e.target.checked)} style={{ accentColor: 'var(--g7)' }} />
            Email notifications
          </label>
        </div>
      </Modal>
    </div>
  );
}
