import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../utils/api';

// Initial data for the demonstration
export const INITIAL_DATA = {
  crops: [
    { id: 1, name: 'Castor', emoji: '🌿', description: 'Major oilseed crop used for industrial oil production.', area: '1.2M Ha', status: 'Active', color: '#10b981' },
    { id: 2, name: 'Sunflower', emoji: '🌻', description: 'Edible oilseed crop known for high quality polyunsaturated fatty acids.', area: '0.8M Ha', status: 'Active', color: '#f59e0b' },
    { id: 3, name: 'Safflower', emoji: '🌼', description: 'Important dryland oilseed crop suitable for semi-arid regions.', area: '0.4M Ha', status: 'Active', color: '#ef4444' },
  ],
  disciplines: [
    { id: 1, name: 'Pathology', description: 'The study of plant diseases, their causes, and management strategies.', code: 'PATH', status: 'Active', color: '#06b6d4' },
    { id: 2, name: 'Entomology', description: 'The study of insects and their relationship to agriculture and the environment.', code: 'ENTO', status: 'Active', color: '#f43f5e' },
  ],
  seasons: [
    { id: 1, name: 'Kharif 2025-26', status: 'Active', startDate: '2024-06-01', endDate: '2024-10-30', color: '#f97316' },
    { id: 2, name: 'Rabi 2025-26', status: 'Closed', startDate: '2023-11-01', endDate: '2024-03-31', color: '#64748b' },
  ],
  'soil-types': [
    { id: 1, name: 'Black Soil', description: 'Rich in metals such as Iron, Magnesium, and Aluminum.', fertility: 'High', status: 'Active', color: '#334155' },
    { id: 2, name: 'Red Soil', description: 'Develops on crystalline igneous rocks in areas of low rainfall.', fertility: 'Medium', status: 'Active', color: '#dc2626' },
    { id: 3, name: 'Alluvial Soil', description: 'Formed by the deposition of silt by rivers.', fertility: 'Very High', status: 'Active', color: '#b45309' },
  ],
  'previous-crops': [
    { id: 1, name: 'Cotton', description: 'Commonly grown before castor in central India.', impact: 'Neutral', status: 'Active', color: '#e2e8f0' },
    { id: 2, name: 'Soybean', description: 'Nitrogen-fixing crop that benefits subsequent oilseeds.', impact: 'Positive', status: 'Active', color: '#84cc16' },
    { id: 3, name: 'Maize', description: 'Heavy feeder crop; needs soil replenishment.', impact: 'Negative', status: 'Active', color: '#fbbf24' },
  ],
  varieties: [
    { id: 1, name: 'GCH-7', crop: 'Castor', type: 'Hybrid', year: '2015', status: 'Active', color: '#10b981' },
    { id: 2, name: 'DCH-177', crop: 'Castor', type: 'Hybrid', year: '2010', status: 'Active', color: '#059669' },
    { id: 3, name: 'DRSH-1', crop: 'Sunflower', type: 'Hybrid', year: '2012', status: 'Active', color: '#f59e0b' },
  ],
  irrigation: [
    { id: 1, name: 'Rainfed', description: 'Dependent entirely on seasonal rainfall.', cost: 'Low', status: 'Active', color: '#60a5fa' },
    { id: 2, name: 'Irrigated', description: 'Supplemented by borewell, canal, or tank water.', cost: 'Medium', status: 'Active', color: '#2563eb' },
  ],
  'crop-stages': [
    { id: 1, name: 'Seedling', duration: '15-20 days', importance: 'Critical', status: 'Active', color: '#86efac' },
    { id: 2, name: 'Vegetative', duration: '40-60 days', importance: 'High', status: 'Active', color: '#4ade80' },
    { id: 3, name: 'Flowering', duration: '20-30 days', importance: 'Very High', status: 'Active', color: '#22c55e' },
    { id: 4, name: 'Maturity', duration: '15-25 days', importance: 'Medium', status: 'Active', color: '#16a34a' },
  ]
};

const CATEGORY_CONFIG = {
  crops: { icon: '🌱', theme: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', desc: 'Crop varieties and distribution.' },
  disciplines: { icon: '🔬', theme: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)', desc: 'Scientific research fields.' },
  seasons: { icon: '🌦️', theme: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', desc: 'Survey time periods.' },
  'soil-types': { icon: '🟤', theme: 'linear-gradient(135deg, #475569 0%, #64748b 100%)', desc: 'Soil classifications.' },
  'previous-crops': { icon: '🔄', theme: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', desc: 'Crop rotation history.' },
  varieties: { icon: '🏷️', theme: 'linear-gradient(135deg, #be123c 0%, #fb7185 100%)', desc: 'Specific plant varieties.' },
  irrigation: { icon: '💧', theme: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', desc: 'Watering methods.' },
  'crop-stages': { icon: '📉', theme: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)', desc: 'Biological growth phases.' }
};

export default function MasterData() {
  const { type } = useParams();
  const config = CATEGORY_CONFIG[type] || CATEGORY_CONFIG.crops;
  
  const [data, setData] = useState([]);
  const [availableCrops, setAvailableCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '', description: '', emoji: '', status: 'Active',
    code: '', area: '', startDate: '', endDate: '', color: '#10b981',
    fertility: 'Medium', impact: 'Neutral', crop: '', type: 'Hybrid',
    year: '2024', cost: 'Medium', duration: '', importance: 'High'
  });

  // Fetch master data from database on mount or type change
  useEffect(() => {
    setLoading(true);
    api.get('/master-data')
      .then(res => {
        const dbData = res.data.data;
        if (dbData) {
          const cropNames = (dbData.crops || [])
            .map(c => typeof c === 'string' ? c : (c.name || ''))
            .filter(Boolean)
            .map(c => c.toLowerCase());
          setAvailableCrops(cropNames);

          const dbKeyMap = {
            'previous-crops': 'previousCrops',
            'soil-types': 'soilTypes',
            'irrigation': 'irrigationTypes',
            'crop-stages': 'cropStages',
            'crops': 'crops',
            'seasons': 'seasons',
            'disciplines': 'disciplines'
          };
          const dbKey = dbKeyMap[type] || type;
          if (type === 'varieties' && dbData.varieties && !Array.isArray(dbData.varieties)) {
            const list = [];
            let idx = 1;
            Object.keys(dbData.varieties).forEach(crop => {
              const varList = dbData.varieties[crop];
              if (Array.isArray(varList)) {
                varList.forEach(v => {
                  list.push({
                    id: idx++,
                    name: typeof v === 'object' ? v.name : v,
                    crop: crop.charAt(0).toUpperCase() + crop.slice(1),
                    type: typeof v === 'object' ? (v.type || 'Unknown') : 'Unknown',
                    year: typeof v === 'object' ? (v.year || '2024') : '2024',
                    status: typeof v === 'object' ? (v.status || 'Active') : 'Active',
                    color: typeof v === 'object' ? (v.color || '#10b981') : '#10b981'
                  });
                });
              }
            });
            setData(list);
          } else if (dbData[dbKey]) {
            const items = dbData[dbKey];
            const normalized = items.map((i, idx) => {
              if (typeof i === 'string') {
                return { id: idx + 1, name: i, status: 'Active', color: '#10b981' };
              }
              return i;
            });
            setData(normalized);
          } else {
            setData([]);
          }
        }
      })
      .catch(err => {
        console.error('Failed to fetch master data from database', err);
      })
      .finally(() => setLoading(false));
  }, [type]);

  const label = type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const singularLabel = label.endsWith('ies') ? label.slice(0, -3) + 'y' : label.slice(0, -1);

  const handleReset = () => {
    if (window.confirm('Reset this category to default data? All custom entries will be lost.')) {
      const defData = INITIAL_DATA[type] || [];
      setData(defData);
      
      persistToDb(defData);
      toast.success('Reset successful');
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (type === 'varieties' && selectedCrop && (item.crop || '').toLowerCase() !== selectedCrop.toLowerCase()) return false;
      return (
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [data, searchTerm, type, selectedCrop]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '', description: '', emoji: '', status: 'Active',
      code: '', area: '', startDate: '', endDate: '', color: '#10b981',
      fertility: 'Medium', impact: 'Neutral',
      crop: type === 'varieties' ? (selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1)) : '',
      type: 'Hybrid', year: '2024', cost: 'Medium', duration: '', importance: 'High'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleOpenView = (item) => {
    setViewingItem(item);
    setShowViewModal(true);
  };

  const handleSave = () => {
    if (!formData.name) return toast.error('Name is required');
    let updated;
    if (editingItem) {
      updated = data.map(i => i.id === editingItem.id ? { ...formData, id: i.id } : i);
      toast.success(`${singularLabel} updated successfully`);
    } else {
      const nextId = data.length > 0 ? Math.max(...data.map(i => Number(i.id) || 0)) + 1 : 1;
      const newItem = { ...formData, id: nextId };
      updated = [...data, newItem];
      toast.success(`${singularLabel} added successfully`);
    }
    setData(updated);
    persistToDb(updated);
    setShowModal(false);
  };

  const handleDelete = (id) => {
    const updated = data.filter(i => String(i.id) !== String(id));
    setData(updated);
    persistToDb(updated);
    toast.success('Deleted successfully');
  };

  const persistToDb = (items) => {
    let apiValue = items.map(i => i.name || i);
    if (type === 'varieties') {
      apiValue = {};
      items.forEach(item => {
        const crop = (item.crop || 'others').toLowerCase();
        if (!apiValue[crop]) apiValue[crop] = [];
        apiValue[crop].push(item.name || item);
      });
    }
    return api.put(`/master-data/${type}`, { value: apiValue })
      .catch(err => {
        console.error(err);
        toast.error('Failed to save to server');
      });
  };

  return (
    <div className="fade-in">
      {/* Category Hero Section */}
      <div className="master-hero" style={{ 
        background: config.theme, padding: '32px 40px', borderRadius: 24, marginBottom: 32, color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 48 }}>{config.icon}</div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>{label}</h1>
              <p style={{ opacity: 0.9, fontSize: 15, marginTop: 4 }}>{config.desc}</p>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, fontWeight: 600 }}>Records</div>
          <div style={{ fontSize: 42, fontWeight: 800 }}>{type === 'varieties' ? filteredData.length : data.length}</div>
        </div>
      </div>

      {/* Crop tabs for varieties */}
      {type === 'varieties' && availableCrops.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', ...availableCrops].map(c => (
            <button
              key={c}
              onClick={() => setSelectedCrop(c === 'all' ? '' : c)}
              style={{
                padding: '10px 18px',
                borderRadius: 12,
                border: ((c === 'all' && !selectedCrop) || selectedCrop === c) ? '2px solid #1e293b' : '1px solid #e2e8f0',
                background: ((c === 'all' && !selectedCrop) || selectedCrop === c) ? '#1e293b' : '#fff',
                color: ((c === 'all' && !selectedCrop) || selectedCrop === c) ? '#fff' : '#475569',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, maxWidth: 600 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" className="form-control" 
              style={{ paddingLeft: 44, height: 48, borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff' }}
              placeholder={`Search ${type.toLowerCase()}...`}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" style={{ height: 48, borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b' }} onClick={handleReset} title="Reset to Defaults">
            🔄 Reset
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" style={{ height: 48, padding: '0 20px', borderRadius: 14, fontWeight: 600, background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }} onClick={async () => {
            try {
              const XLSX = await import('xlsx');
              const ws = XLSX.utils.json_to_sheet(filteredData.map(item => {
                const { color, ...rest } = item;
                return rest;
              }));
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "MasterData");
              XLSX.writeFile(wb, `CropLoss_${label}_${new Date().toISOString().split('T')[0]}.xlsx`);
              toast.success('Excel exported successfully');
            } catch (err) {
              console.error(err);
              toast.error('Excel Export failed');
            }
          }}>
            📊 Excel
          </button>

          <button className="btn btn-outline" style={{ height: 48, padding: '0 20px', borderRadius: 14, fontWeight: 600, background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }} onClick={async () => {
            try {
              const doc = new jsPDF('landscape');
              doc.setFontSize(16);
              doc.text(`CropLoss Portal - ${label} Master Data`, 14, 15);
              
              if (filteredData.length === 0) {
                toast.error('No data to export');
                return;
              }
              
              const keys = Object.keys(filteredData[0]).filter(k => k !== 'color');
              const tableData = filteredData.map(item => keys.map(k => item[k] || '-'));
              
              autoTable(doc, {
                startY: 25,
                head: [keys.map(k => k.charAt(0).toUpperCase() + k.slice(1))],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [71, 85, 105] },
                styles: { fontSize: 9 }
              });
              doc.save(`CropLoss_${label}_${new Date().toISOString().split('T')[0]}.pdf`);
              toast.success('PDF exported successfully');
            } catch (err) {
              console.error(err);
              toast.error('PDF Export failed');
            }
          }}>
            📄 PDF
          </button>

          <button className="btn btn-primary" style={{ height: 48, padding: '0 24px', borderRadius: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} onClick={handleOpenAdd}>
            <span style={{ fontSize: 20 }}>+</span> Add {singularLabel}
          </button>
        </div>
      </div>

      {/* Card Grid View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {filteredData.map(item => (
          <div key={item.id} className="master-card" style={{ 
            background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0',
            transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: item.color || '#10b981' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ 
                width: 52, height: 52, borderRadius: 12, background: `${item.color}15`, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 
              }}>
                {item.emoji || config.icon}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="icon-btn" onClick={() => handleOpenView(item)}>👁️</button>
                <button className="icon-btn" onClick={() => handleOpenEdit(item)}>✏️</button>
                <button className="icon-btn delete" onClick={() => handleDelete(item.id)}>🗑️</button>
              </div>
            </div>

            <h3 style={{ fontSize: 19, fontWeight: 700, color: '#1e293b' }}>{item.name}</h3>
            <div style={{ marginTop: 6, marginBottom: 16 }}>
              <span className={`status-pill ${item.status === 'Active' ? 'status-approved' : 'status-rejected'}`} style={{ fontSize: 11, padding: '2px 10px' }}>
                {item.status}
              </span>
              <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                {type === 'varieties' ? `${item.crop} - ${item.type}` : 
                 type === 'soil-types' ? `Fertility: ${item.fertility}` : 
                 type === 'crop-stages' ? item.duration : 
                 type === 'irrigation' ? `Cost: ${item.cost}` : ''}
              </span>
            </div>

            <p style={{ fontSize: 13.5, color: '#475467', lineHeight: 1.5, height: 40, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {item.description || 'System configuration item.'}
            </p>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>ID: #{item.id}</div>
              <button style={{ background: 'none', border: 'none', color: config.theme.split(' ')[2], fontSize: 13, fontWeight: 700, cursor: 'pointer' }} onClick={() => handleOpenView(item)}>Explore →</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-content fade-up" style={{ maxWidth: 550, width: '95%', padding: 0, borderRadius: 28, overflow: 'hidden' }}>
            <div style={{ padding: '32px 40px', background: config.theme, color: '#fff', position: 'relative' }}>
              <h3 style={{ fontSize: 24, fontWeight: 800 }}>{editingItem ? 'Update' : 'Add'} {singularLabel}</h3>
              <button style={{ position: 'absolute', right: 24, top: 24, background: 'rgba(255,255,255,0.2)', border: 'none', width: 36, height: 36, borderRadius: '50%', color: '#fff', fontSize: 22, cursor: 'pointer' }} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <div style={{ padding: '32px 40px', background: '#fff' }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Name</label>
                  <input className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                {type === 'varieties' && (
                  <div className="form-group">
                    <label className="form-label">Crop</label>
                    <select className="form-control" value={(formData.crop || '').toLowerCase()} onChange={e => setFormData({...formData, crop: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)})}>
                      <option value="">— Select Crop —</option>
                      {availableCrops.map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                )}
                {type === 'crops' && (
                  <div className="form-group">
                    <label className="form-label">Icon</label>
                    <input className="form-control" value={formData.emoji} onChange={e => setFormData({...formData, emoji: e.target.value})} />
                  </div>
                )}
                {type === 'soil-types' && (
                  <div className="form-group">
                    <label className="form-label">Fertility</label>
                    <select className="form-control" value={formData.fertility} onChange={e => setFormData({...formData, fertility: e.target.value})}>
                      <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Very High">Very High</option>
                    </select>
                  </div>
                )}
              </div>

              {type === 'crop-stages' && (
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input className="form-control" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Importance</label>
                    <select className="form-control" value={formData.importance} onChange={e => setFormData({...formData, importance: e.target.value})}>
                      <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Status</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {['Active', 'Closed', 'Inactive'].map(s => (
                    <button key={s} onClick={() => setFormData({...formData, status: s})} style={{ 
                      flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: formData.status === s ? `2px solid #000` : '1px solid #e2e8f0',
                      background: formData.status === s ? `#f8fafc` : '#fff'
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
                <button className="btn btn-outline" style={{ flex: 1, height: 52, borderRadius: 16 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1, height: 52, borderRadius: 16, background: config.theme }} onClick={handleSave}>
                  Save {singularLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingItem && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 1000 }}>
          <div className="modal-content fade-up" style={{ maxWidth: 500, width: '95%', padding: 0, borderRadius: 28, overflow: 'hidden' }}>
            <div style={{ padding: '32px 40px', background: config.theme, color: '#fff', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                 <div style={{ fontSize: 40, width: 64, height: 64, background: 'rgba(255,255,255,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   {viewingItem.emoji || config.icon}
                 </div>
                 <div>
                   <h3 style={{ fontSize: 24, fontWeight: 800 }}>{viewingItem.name}</h3>
                   <span style={{ opacity: 0.8, fontSize: 13 }}>ID: #{viewingItem.id}</span>
                 </div>
              </div>
              <button style={{ position: 'absolute', right: 24, top: 24, background: 'rgba(255,255,255,0.2)', border: 'none', width: 36, height: 36, borderRadius: '50%', color: '#fff', fontSize: 22, cursor: 'pointer' }} onClick={() => setShowViewModal(false)}>&times;</button>
            </div>
            
            <div style={{ padding: '32px 40px', background: '#fff' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Description / Notes</div>
                <div style={{ fontSize: 15, color: '#1e293b', lineHeight: 1.5 }}>{viewingItem.description || 'No additional details provided.'}</div>
              </div>
              
              <div className="grid-2" style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>System Status</div>
                  <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600 }}>{viewingItem.status}</div>
                </div>
                {type === 'varieties' && (
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Parent Crop</div>
                    <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600 }}>{viewingItem.crop}</div>
                  </div>
                )}
                {type === 'soil-types' && (
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Fertility Level</div>
                    <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600 }}>{viewingItem.fertility}</div>
                  </div>
                )}
                {type === 'crop-stages' && (
                  <>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Phase Duration</div>
                      <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600 }}>{viewingItem.duration}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Criticality</div>
                      <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600 }}>{viewingItem.importance}</div>
                    </div>
                  </>
                )}
              </div>
              
              <div style={{ marginTop: 32 }}>
                <button className="btn btn-outline" style={{ width: '100%', height: 48, borderRadius: 14, fontWeight: 600 }} onClick={() => setShowViewModal(false)}>Close Window</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .master-card:hover { transform: translateY(-5px); box-shadow: 0 12px 20px -5px rgba(0,0,0,0.1); border-color: #cbd5e1 !important; }
        .icon-btn { width: 34px; height: 34px; borderRadius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; alignItems: center; justifyContent: center; fontSize: 14; transition: all 0.2s }
        .icon-btn:hover { background: #f1f5f9; transform: scale(1.1); }
        .icon-btn.delete:hover { background: #fee2e2; color: #ef4444; border-color: #fecaca; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      `}} />
    </div>
  );
}
