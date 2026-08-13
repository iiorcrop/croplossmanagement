import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { usersAPI } from '../utils/api';
import { RoleBadge, Avatar, CropTag, Modal, Spinner, EmptyState } from '../components/common';
import { CROP_EMOJI, CROP_LABEL, ROLE_LABELS, AV_COLORS } from '../utils/constants';
import api from '../utils/api';

const BLANK_FORM = {
  name:'',email:'',phone:'',password:'',designation:'',
  role:'',centerName:'',centerState:'',centerDistrict:'',centerPI:'',
  assignedCrops:[],reviewCrops:[],isActive:true,notifyWhatsApp:true,notifyEmail:true,
};

function CropCheckboxGrid({ gridId, selected, onChange, label }) {
  const toggle = (crop) => {
    const next = selected.includes(crop) ? selected.filter(c=>c!==crop) : [...selected, crop];
    onChange(next);
  };
  return (
    <div>
      {label && <div style={{ fontSize:11,fontWeight:700,color:'var(--g8)',marginBottom:8,textTransform:'uppercase',letterSpacing:.5 }}>{label}</div>}
      <div className="crop-checkbox-grid">
        {(window.masterDataCrops || []).map(c => (
          <label key={c} className={`crop-checkbox-item ${selected.includes(c)?'checked':''}`}>
            <input type="checkbox" checked={selected.includes(c)} onChange={()=>toggle(c)} style={{accentColor:'var(--g7)'}} />
            <span style={{fontSize:15}}>{CROP_EMOJI[c] || '🌱'}</span>
            {CROP_LABEL(c) || c}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers]       = useState([]);
  const [stats, setStats]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(BLANK_FORM);
  const [saving, setSaving]     = useState(false);
  const [filters, setFilters]   = useState({ role:'', crop:'', status:'' });
  const [masterData, setMasterData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersAPI.list(filters);
      setUsers(res.data.data);
      setStats(res.data.stats || {});
      const mdRes = await api.get('/master-data');
      setMasterData(mdRes.data.data);
      window.masterDataCrops = mdRes.data.data.crops;
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(()=>{ load(); },[load]);

  const openAdd = () => { setEditId(null); setForm(BLANK_FORM); setModal(true); };

  const openEdit = (u) => {
    setEditId(u._id);
    setForm({
      name:u.name, email:u.email, phone:u.phone, password:'', designation:u.designation||'',
      role:u.role, centerName:u.centerName||'', centerState:u.centerState||'',
      centerDistrict:u.centerDistrict||'', centerPI:u.centerPI||'',
      assignedCrops:u.assignedCrops||[], reviewCrops:u.reviewCrops||[],
      isActive:u.isActive, notifyWhatsApp:u.notifyWhatsApp, notifyEmail:u.notifyEmail,
    });
    setModal(true);
  };

  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async () => {
    if (!form.name||!form.email||!form.role){ toast.error('Name, email and role required'); return; }
    if (!editId&&!form.password){ toast.error('Password required for new users'); return; }
    if (form.role==='crop_head'&&!form.reviewCrops.length){ toast.error('Assign at least one review crop'); return; }
    if (form.role==='center_user'&&!form.assignedCrops.length){ toast.error('Assign at least one crop'); return; }
    if (form.role==='center_user'&&!form.centerName.trim()){ toast.error('Center name required'); return; }

    setSaving(true);
    try {
      if (editId) {
        await usersAPI.update(editId, form);
        toast.success('User updated');
      } else {
        await usersAPI.create(form);
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

  const allCrops = (u) => [...new Set([...(u.assignedCrops||[]),...(u.reviewCrops||[])])];

  return (
    <div>
      <div className="page-header">
        <h2>Users &amp; Roles</h2>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>＋ Add User</button>
      </div>

      {/* Stats */}
      <div className="kpi-grid" style={{ marginBottom:18 }}>
        {[
          {n:stats.total||0, l:'Total Users', c:'green', i:'👥'},
          {n:stats.superAdmins||0, l:'Super Admins', c:'red', i:'🛡️'},
          {n:stats.cropHeads||0, l:'Crop Heads', c:'amber', i:'🌿'},
          {n:stats.centerUsers||0, l:'Center Users', c:'blue', i:'🏛️'},
          {n:stats.active||0, l:'Active', c:'teal', i:'✅'},
        ].map((k,i)=>(
          <div key={i} className={`kpi-card kpi-${k.c}`}>
            <div className="kpi-number">{k.n}</div>
            <div className="kpi-label">{k.l}</div>
            <div className="kpi-icon">{k.i}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select className="filter-control" value={filters.role} onChange={e=>setFilters(f=>({...f,role:e.target.value}))}>
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="crop_head">Crop Head</option>
          <option value="center_user">Center User</option>
        </select>
        <select className="filter-control" value={filters.crop} onChange={e=>setFilters(f=>({...f,crop:e.target.value}))}>
          <option value="">All Crops</option>
          {(masterData?.crops || []).map(c=><option key={c} value={c}>{CROP_EMOJI[c] || '🌱'} {CROP_LABEL(c) || c}</option>)}
        </select>
        <select className="filter-control" value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <Spinner /> : users.length===0 ? <EmptyState emoji="👥" title="No users found" /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Crops</th>
                  <th>Center / State</th>
                  <th>WhatsApp</th>
                  <th>Notifications</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u,idx)=>(
                  <tr key={u._id}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <Avatar name={u.name} index={idx} />
                        <div>
                          <div style={{fontWeight:500}}>{u.name}</div>
                          <div style={{fontSize:11,color:'var(--gray)'}}>{u.email}</div>
                          {u.designation&&<div style={{fontSize:10,color:'var(--gray)'}}>{u.designation}</div>}
                        </div>
                      </div>
                    </td>
                    <td><RoleBadge role={u.role} /></td>
                    <td style={{maxWidth:180}}>
                      {allCrops(u).map(c=><CropTag key={c} crop={c}/>)}
                      {!allCrops(u).length&&'—'}
                    </td>
                    <td style={{fontSize:11.5}}>
                      <div>{u.centerName||'—'}</div>
                      <div style={{color:'var(--gray)'}}>{u.centerState||''}</div>
                    </td>
                    <td style={{fontSize:11.5}}>{u.phone}</td>
                    <td style={{fontSize:11.5}}>
                      {u.notifyWhatsApp&&<span style={{marginRight:4}}>📱</span>}
                      {u.notifyEmail&&<span>📧</span>}
                    </td>
                    <td>
                      <span className={`badge ${u.isActive?'badge-active':'badge-inactive'}`}>
                        {u.isActive?'Active':'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-xs" onClick={()=>openEdit(u)}>Edit</button>
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
        onClose={()=>setModal(false)}
        title={editId?'Edit User':'Add New User'}
        maxWidth={620}
        footer={
          <>
            <button className="btn btn-outline btn-sm" onClick={()=>setModal(false)}>Cancel</button>
            {editId&&<button className="btn btn-danger btn-sm" onClick={handleDeactivate}>Deactivate</button>}
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving?'Saving…':'Save User'}</button>
          </>
        }
      >
        <div className="form-grid grid-2" style={{marginBottom:14}}>
          <div className="form-group"><label className="form-label required">Full Name</label><input className="form-control" value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="Dr. Firstname Lastname"/></div>
          <div className="form-group"><label className="form-label required">Email</label><input className="form-control" type="email" value={form.email} onChange={e=>setF('email',e.target.value)} placeholder="name@icar.gov.in" readOnly={!!editId}/></div>
          <div className="form-group"><label className="form-label required">WhatsApp Number</label><input className="form-control" value={form.phone} onChange={e=>setF('phone',e.target.value)} placeholder="+91-98765-43210"/></div>
          <div className="form-group"><label className={`form-label ${!editId?'required':''}`}>{editId?'New Password (leave blank to keep)':'Password'}</label><input className="form-control" type="password" value={form.password} onChange={e=>setF('password',e.target.value)} placeholder={editId?'Leave blank to keep current':'Min 6 characters'}/></div>
          <div className="form-group"><label className="form-label required">Role</label>
            <select className="form-control" value={form.role} onChange={e=>setF('role',e.target.value)}>
              <option value="">— Select Role —</option>
              <option value="super_admin">Super Admin</option>
              <option value="crop_head">Crop Head</option>
              <option value="center_user">Center User</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Designation</label><input className="form-control" value={form.designation} onChange={e=>setF('designation',e.target.value)} placeholder="e.g. Senior Scientist"/></div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-control" value={String(form.isActive)} onChange={e=>setF('isActive',e.target.value==='true')}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {/* Crop Head section */}
        {form.role==='crop_head'&&(
          <div style={{marginBottom:14}}>
            <CropCheckboxGrid
              label="Crops to Review (will receive WhatsApp alerts for these crops)"
              selected={form.reviewCrops}
              onChange={v=>setF('reviewCrops',v)}
            />
          </div>
        )}

        {/* Center User section */}
        {form.role==='center_user'&&(
          <div style={{marginBottom:14}}>
            <div className="form-grid grid-2" style={{marginBottom:12}}>
              <div className="form-group"><label className="form-label required">Center / Institute Name</label><input className="form-control" value={form.centerName} onChange={e=>setF('centerName',e.target.value)} placeholder="e.g. RARS Junagadh"/></div>
              <div className="form-group"><label className="form-label required">State</label><input className="form-control" value={form.centerState} onChange={e=>setF('centerState',e.target.value)} placeholder="e.g. Gujarat"/></div>
              <div className="form-group"><label className="form-label">District</label><input className="form-control" value={form.centerDistrict} onChange={e=>setF('centerDistrict',e.target.value)} placeholder="e.g. Junagadh"/></div>
              <div className="form-group"><label className="form-label">Principal Investigator</label><input className="form-control" value={form.centerPI} onChange={e=>setF('centerPI',e.target.value)} placeholder="PI name"/></div>
            </div>
            <CropCheckboxGrid
              label="Crops this user can enter data for"
              selected={form.assignedCrops}
              onChange={v=>setF('assignedCrops',v)}
            />
          </div>
        )}

        <div className="divider"/>
        <div style={{display:'flex',gap:20}}>
          <label style={{display:'flex',alignItems:'center',gap:7,fontSize:12.5,cursor:'pointer'}}>
            <input type="checkbox" checked={form.notifyWhatsApp} onChange={e=>setF('notifyWhatsApp',e.target.checked)} style={{accentColor:'var(--g7)'}}/>
            WhatsApp notifications
          </label>
          <label style={{display:'flex',alignItems:'center',gap:7,fontSize:12.5,cursor:'pointer'}}>
            <input type="checkbox" checked={form.notifyEmail} onChange={e=>setF('notifyEmail',e.target.checked)} style={{accentColor:'var(--g7)'}}/>
            Email notifications
          </label>
        </div>
      </Modal>
    </div>
  );
}
